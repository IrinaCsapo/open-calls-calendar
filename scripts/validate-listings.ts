// Runs before every build. Any invalid listing fails the build with a clear message,
// so a typo (from a person or the daily scout) never reaches the live site.
import { readFileSync } from 'node:fs';
import {
  CURRENCIES, DISCIPLINES, ENTRY_FEES, FORMATS, LISTING_TYPES, OPPORTUNITY_TYPES, PRIZE_KINDS, REGIONS, SELECTED_FEES,
} from '../src/types/listing';

const FILE = new URL('../src/data/listings.json', import.meta.url);
const data: unknown = JSON.parse(readFileSync(FILE, 'utf8'));
const errors: string[] = [];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KNOWN_FIELDS = new Set([
  'id', 'title', 'organiser', 'type', 'disciplines', 'format', 'timezone', 'city', 'country', 'region', 'venue',
  'lat', 'lng', 'deadline', 'start_date', 'end_date', 'eligibility', 'entry_fee', 'fee_amount', 'currency',
  'fee_details', 'selected_fee', 'selected_fee_details', 'commission', 'prizes', 'prize_kinds', 'prize_value',
  'apply_url', 'image_url', 'source', 'added',
]);

const isDate = (v: unknown) => typeof v === 'string' && ISO_DATE.test(v) && !Number.isNaN(Date.parse(v));
const isUrl = (v: unknown) => { try { return /^https?:$/.test(new URL(String(v)).protocol); } catch { return false; } };
const isTimezone = (v: unknown) => { try { new Intl.DateTimeFormat('en', { timeZone: String(v) }); return true; } catch { return false; } };

if (!Array.isArray(data)) {
  errors.push('listings.json must be an array of listings');
} else {
  const seen = new Set<string>();
  const seenUrls = new Map<string, string>();
  data.forEach((l: Record<string, unknown>, i) => {
    const where = `listing #${i + 1} (${typeof l.id === 'string' ? l.id : 'no id'})`;
    const fail = (msg: string) => errors.push(`${where}: ${msg}`);
    const oneOf = (field: string, allowed: readonly string[]) => {
      if (!allowed.includes(l[field] as string)) fail(`${field} is "${l[field]}", must be one of: ${allowed.join(', ')}`);
    };
    const str = (field: string, required = true) => {
      if (l[field] === undefined && !required) return;
      if (typeof l[field] !== 'string') fail(`${field} must be a string`);
      else if (required && !(l[field] as string).trim()) fail(`${field} must not be empty`);
    };
    const date = (field: string, required = false) => {
      if (l[field] === undefined) { if (required) fail(`${field} is required`); return; }
      if (!isDate(l[field])) fail(`${field} must be an ISO date (YYYY-MM-DD)`);
    };
    const list = (field: string, allowed: readonly string[], min = 0) => {
      const v = l[field];
      if (!Array.isArray(v)) return fail(`${field} must be an array`);
      if (v.length < min) fail(`${field} needs at least ${min} value`);
      for (const x of v) if (!allowed.includes(x)) fail(`${field}: "${x}" must be one of: ${allowed.join(', ')}`);
      if (new Set(v).size !== v.length) fail(`${field} has duplicates`);
    };
    const positive = (field: string) => {
      if (l[field] !== undefined && (typeof l[field] !== 'number' || (l[field] as number) < 0)) fail(`${field} must be a number, 0 or more`);
    };

    for (const key of Object.keys(l)) if (!KNOWN_FIELDS.has(key)) fail(`unknown field "${key}" (typo?)`);

    if (typeof l.id !== 'string' || !SLUG.test(l.id)) fail('id must be a lowercase slug like "woman-artist-award-2026"');
    else if (seen.has(l.id)) fail('duplicate id');
    else seen.add(l.id);

    str('title'); str('organiser'); str('eligibility'); str('source');
    str('venue', false); str('fee_details', false); str('selected_fee_details', false); str('commission', false);
    oneOf('type', LISTING_TYPES);
    oneOf('format', FORMATS);
    oneOf('region', REGIONS);
    oneOf('entry_fee', ENTRY_FEES);
    oneOf('selected_fee', SELECTED_FEES);
    list('disciplines', DISCIPLINES, 1);
    list('prize_kinds', PRIZE_KINDS);

    if (!Array.isArray(l.prizes) || l.prizes.some((p) => typeof p !== 'string' || !p.trim())) fail('prizes must be an array of non-empty strings ([] if none)');

    // Money rules: the reason this site exists. Be strict.
    positive('fee_amount'); positive('prize_value');
    if (l.currency !== undefined) oneOf('currency', CURRENCIES);
    if (l.entry_fee === 'Paid' && l.fee_amount === undefined) fail('entry_fee is "Paid" so fee_amount (the cheapest way in) is required');
    if (l.entry_fee === 'Paid' && l.fee_amount === 0) fail('entry_fee is "Paid" but fee_amount is 0 (use entry_fee "Free")');
    if (l.entry_fee !== 'Paid' && l.fee_amount !== undefined) fail('fee_amount is only for entry_fee "Paid"');
    if ((l.fee_amount !== undefined || l.prize_value !== undefined) && l.currency === undefined) fail('currency is required when fee_amount or prize_value is set');
    if (l.selected_fee === 'Yes' && !l.selected_fee_details) fail('selected_fee is "Yes" so selected_fee_details must say what selected artists pay');
    if (l.prize_value !== undefined && Array.isArray(l.prize_kinds) && !l.prize_kinds.includes('Cash')) fail('prize_value is set so prize_kinds must include "Cash"');
    if (Array.isArray(l.prize_kinds) && l.prize_kinds.length && Array.isArray(l.prizes) && !l.prizes.length) fail('prize_kinds is set but prizes is empty: list the prizes');

    // Dates: opportunities need a deadline, events need a start date.
    date('deadline'); date('start_date'); date('end_date'); date('added', true);
    const isOpp = (OPPORTUNITY_TYPES as readonly string[]).includes(l.type as string);
    if (isOpp && l.deadline === undefined) fail(`a ${l.type} needs a deadline`);
    if (!isOpp && l.start_date === undefined) fail(`a ${l.type} needs a start_date`);
    if (l.end_date !== undefined && l.start_date === undefined) fail('end_date needs a start_date');
    if (isDate(l.start_date) && isDate(l.end_date) && (l.end_date as string) < (l.start_date as string)) fail('end_date is before start_date');
    if (!isTimezone(l.timezone)) fail(`timezone "${l.timezone}" is not a valid IANA timezone (e.g. "Europe/London")`);

    // Place
    if (typeof l.city !== 'string') fail('city must be a string (empty for online)');
    if (typeof l.country !== 'string') fail('country must be a string');
    if (l.format === 'Online' && l.city) fail('city must be empty for online listings');
    if (l.format !== 'Online' && !l.city) fail('city is required for in-person and hybrid listings');
    for (const k of ['lat', 'lng']) if (l[k] !== undefined && typeof l[k] !== 'number') fail(`${k} must be a number`);
    if (l.format !== 'Online' && (l.lat === undefined || l.lng === undefined)) fail('lat and lng are required for in-person and hybrid listings (city centre is fine)');
    if (typeof l.lat === 'number' && (l.lat < -90 || l.lat > 90)) fail('lat must be between -90 and 90');
    if (typeof l.lng === 'number' && (l.lng < -180 || l.lng > 180)) fail('lng must be between -180 and 180');

    // Links
    if (!isUrl(l.apply_url)) fail('apply_url must be a full http(s) URL');
    if (!isUrl(l.source)) fail('source must be a full http(s) URL');
    if (l.image_url !== undefined && !isUrl(l.image_url)) fail('image_url must be a full http(s) URL');
    if (typeof l.apply_url === 'string') {
      const u = l.apply_url.replace(/\/+$/, '').toLowerCase();
      const other = seenUrls.get(u);
      if (other && other !== l.id) fail(`apply_url is the same as ${other} (duplicate listing?)`);
      seenUrls.set(u, l.id as string);
    }
  });
}

if (errors.length) {
  console.error(`\n✗ listings.json has ${errors.length} problem(s):\n`);
  for (const err of errors) console.error(`  - ${err}`);
  console.error('');
  process.exit(1);
}
const n = (data as unknown[]).length;
console.log(`✓ listings.json is valid (${n} ${n === 1 ? 'listing' : 'listings'})`);
