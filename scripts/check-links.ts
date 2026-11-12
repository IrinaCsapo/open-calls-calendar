// Checks that every apply_url and image_url still loads. Run by the daily scout, or by hand:
//   npm run check-links            all listings
//   npm run check-links -- <id>…   only these
// Prints one line per broken link; exits 1 if any are broken.
import { LISTINGS } from '../src/lib/listings';

const only = process.argv.slice(2);
const targets = LISTINGS.filter((l) => !only.length || only.includes(l.id));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

async function status(url: string): Promise<number> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
    return res.status;
  } catch {
    return 0;
  }
}

let broken = 0;
await Promise.all(targets.flatMap((l) => [
  ['apply_url', l.apply_url] as const,
  ...(l.image_url ? [['image_url', l.image_url] as const] : []),
].map(async ([field, url]) => {
  const s = await status(url);
  // 403/429 usually means the site blocks scripts, not that the page is gone.
  if (s >= 200 && s < 400) return;
  if (s === 403 || s === 429) { console.log(`?  ${l.id} ${field} ${s} (blocked by site, check by hand) ${url}`); return; }
  broken++;
  console.log(`✗  ${l.id} ${field} ${s || 'no response'} ${url}`);
})));
console.log(broken ? `\n${broken} broken link(s)` : `✓ all links load (${targets.length} listings)`);
process.exit(broken ? 1 : 0);
