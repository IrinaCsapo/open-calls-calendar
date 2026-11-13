// "Near you": where the visitor probably is, and which listings are close to them.
// The automatic guess comes from the device's time zone, so there's no permission prompt.
// "Use my exact location" (in More filters) asks the browser, and only sorts by distance:
// the coordinates stay in the visitor's browser, never stored or sent anywhere.
import type { Listing } from '../types/listing';
import { PLACES, PLACE_MATCH, type Place } from './filters';
import { closesAt } from './dates';

const CANADA = /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton|Glace_Bay|Goose_Bay|Whitehorse|Yellowknife|Iqaluit|Dawson|Dawson_Creek|Fort_Nelson|Creston|Swift_Current|Rankin_Inlet|Resolute|Cambridge_Bay|Inuvik|Atikokan|Blanc-Sablon)$/;
const LATAM = /^America\/(Mexico_City|Monterrey|Merida|Cancun|Tijuana|Hermosillo|Chihuahua|Mazatlan|Matamoros|Bahia_Banderas|Sao_Paulo|Bahia|Fortaleza|Recife|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Rio_Branco|Boa_Vista|Maceio|Araguaina|Santarem|Noronha|Argentina\/.*|Buenos_Aires|Bogota|Lima|Santiago|Punta_Arenas|Caracas|Montevideo|Asuncion|La_Paz|Guayaquil|Guatemala|Costa_Rica|Panama|El_Salvador|Tegucigalpa|Managua|Belize|Havana|Santo_Domingo|Puerto_Rico|Paramaribo|Cayenne|Guyana|Port-au-Prince|Jamaica)$/;
const MIDDLE_EAST = /^Asia\/(Dubai|Riyadh|Qatar|Kuwait|Bahrain|Muscat|Tehran|Baghdad|Jerusalem|Tel_Aviv|Beirut|Amman|Damascus|Aden|Gaza|Hebron|Nicosia|Famagusta)$/;

/** Best guess of where the visitor is, from their time zone. null if we can't tell. */
export function guessPlace(): Place | null {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''; } catch { return null; }
  if (/^Europe\/(London|Belfast|Guernsey|Jersey|Isle_of_Man)$/.test(tz)) return 'UK';
  if (tz.startsWith('Europe/')) return 'Europe';
  if (CANADA.test(tz)) return 'Canada';
  if (LATAM.test(tz)) return 'Latin America';
  if (tz.startsWith('America/') || tz.startsWith('US/') || tz === 'Pacific/Honolulu') return 'US';
  if (tz.startsWith('Australia/')) return 'Australia';
  if (tz.startsWith('Pacific/')) return 'Oceania';
  if (tz.startsWith('Africa/')) return 'Africa';
  if (MIDDLE_EAST.test(tz)) return 'Middle East';
  if (tz.startsWith('Asia/')) return 'Asia';
  return null;
}

/** A country also shows the rest of its continent, after its own listings. */
const WIDER: Partial<Record<Place, Place>> = { UK: 'Europe', US: 'North America', Canada: 'North America', Australia: 'Oceania' };

// ---- The visitor's chosen location (remembered in their browser) ----
// "auto" = use the guess; "off" = don't show the Near you row; or one of PLACES.
export type PlaceSetting = 'auto' | 'off' | Place;
const KEY = 'magpie:place';
export function loadPlaceSetting(): PlaceSetting {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'off' || (PLACES as readonly string[]).includes(v ?? '') ? (v as PlaceSetting) : 'auto';
  } catch { return 'auto'; }
}
export function savePlaceSetting(v: PlaceSetting) {
  try { if (v === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch { /* fine */ }
}

export interface Coords { lat: number; lng: number }

export function distanceKm(a: Coords, b: Coords): number {
  const rad = Math.PI / 180, R = 6371;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const NEAR_KM = 600;

/**
 * Listings near the visitor: in their place (then the wider continent), never the worldwide online ones
 * (those show everywhere anyway). With exact coordinates, in-person listings within ~600 km come first,
 * nearest first.
 */
export function nearYou(listings: Listing[], place: Place | null, coords: Coords | null): Listing[] {
  const local = (l: Listing) => l.region !== 'Global';
  const byClosing = (a: Listing, b: Listing) => closesAt(a) - closesAt(b);
  const picked: Listing[] = [];
  const add = (list: Listing[]) => { for (const l of list) if (!picked.includes(l)) picked.push(l); };

  if (coords) {
    const dist = (l: Listing) => (l.lat !== undefined && l.lng !== undefined ? distanceKm(coords, { lat: l.lat, lng: l.lng }) : Infinity);
    add(listings.filter((l) => l.format !== 'Online' && dist(l) <= NEAR_KM).sort((a, b) => dist(a) - dist(b)));
  }
  if (place) {
    add(listings.filter((l) => local(l) && PLACE_MATCH[place](l)).sort(byClosing));
    const wider = WIDER[place];
    if (wider) add(listings.filter((l) => local(l) && PLACE_MATCH[wider](l)).sort(byClosing));
  }
  return picked;
}
