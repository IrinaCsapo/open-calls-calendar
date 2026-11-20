// Read-only health check of Magpie's Brevo account, for when sign-up emails don't arrive.
// Prints account status, recent email events, recent contacts and the PLACE attribute, with every email address
// masked (the Actions logs of this public repo are public). Sends and changes nothing.
//   Run: Actions → Brevo check → Run workflow (needs BREVO_API_KEY)
const key = process.env.BREVO_API_KEY;
if (!key) { console.error('BREVO_API_KEY must be set.'); process.exit(1); }

const mask = (s: unknown) => String(s ?? '').replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+)/g, '$1***@$2');
async function get(path: string) {
  const res = await fetch(`https://api.brevo.com/v3${path}`, { headers: { 'api-key': key!, accept: 'application/json' } });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text ? JSON.parse(text) : {} };
}

const acc = await get('/account');
console.log('== Account');
if (acc.ok) {
  const b = acc.body;
  console.log(`plan: ${JSON.stringify((b.plan ?? []).map((p: Record<string, unknown>) => ({ type: p.type, credits: p.credits, creditsType: p.creditsType })))}`);
  console.log(`relay (transactional) enabled: ${b.relay?.enabled}`);
} else console.log(`could not read account (${acc.status}): ${mask(JSON.stringify(acc.body))}`);

console.log('\n== Senders');
const senders = await get('/senders');
for (const s of senders.body.senders ?? []) console.log(`${mask(s.email)} active=${s.active}`);

console.log('\n== Domains');
const domains = await get('/senders/domains');
for (const d of domains.body.domains ?? []) console.log(`${d.domain_name} authenticated=${d.authenticated} verified=${d.verified}`);

console.log('\n== Templates');
const templates = await get('/smtp/templates?limit=50');
for (const t of templates.body.templates ?? []) console.log(`#${t.id} "${t.name}" active=${t.isActive} tag=${t.tag} sender=${mask(t.sender?.email)}`);

console.log('\n== Transactional email events, last 2 days (newest first)');
const ev = await get('/smtp/statistics/events?days=2&limit=50&sort=desc');
if (!ev.ok) console.log(`could not read events (${ev.status}): ${mask(JSON.stringify(ev.body))}`);
for (const e of ev.body.events ?? []) console.log(`${e.date} ${e.event} to=${mask(e.email)} template=${e.templateId ?? '-'} subject="${e.subject ?? ''}" ${e.reason ? `reason="${mask(e.reason)}"` : ''}`);
if (ev.ok && !(ev.body.events ?? []).length) console.log('(no events: Brevo has not tried to send any transactional email)');

console.log('\n== Contacts, newest 10');
const contacts = await get('/contacts?limit=10&sort=desc');
console.log(`total: ${contacts.body.count}`);
for (const c of contacts.body.contacts ?? []) console.log(`${mask(c.email)} created=${c.createdAt} lists=${JSON.stringify(c.listIds)} PLACE=${c.attributes?.PLACE ?? '-'} DOUBLE_OPT-IN=${c.attributes?.['DOUBLE_OPT-IN'] ?? '-'}`);

console.log('\n== Lists');
const lists = await get('/contacts/lists?limit=20');
for (const l of lists.body.lists ?? []) console.log(`#${l.id} "${l.name}" subscribers=${l.uniqueSubscribers ?? l.totalSubscribers}`);
