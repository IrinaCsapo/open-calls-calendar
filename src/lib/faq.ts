// Questions artists actually ask (and type into Google and ChatGPT), answered plainly.
// Shown on magpie.cool/faq, and written into that page's HTML and FAQPage structured data by scripts/build-pages.ts.
// Links are written [like this](/path); keep answers short, true, and self-contained (each one may be quoted alone).

export interface Faq { q: string; a: string[] }

export const FAQ: Faq[] = [
  {
    q: 'What is an open call for artists?',
    a: [
      'An open call is an invitation for any artist who fits the brief to apply, rather than the organiser picking artists themselves. Galleries, museums, festivals, publications and funders use them to find work for exhibitions, prizes, residencies, commissions and grants.',
      'You usually send images of your work, a short statement and sometimes a CV, before a deadline. Some are free to enter; some charge an entry fee; a few charge a fee if you are selected.',
    ],
  },
  {
    q: 'Where can I find open calls for artists?',
    a: [
      'Magpie collects open calls, prizes, residencies, grants and events for artists from around the world in one calendar, closing soonest first, with every fee shown up front. It is free and updated every morning. You can [browse by discipline, place or kind](/open-calls), for example [photography](/open-calls/photography), [the UK](/open-calls/uk) or [residencies](/open-calls/residencies).',
    ],
  },
  {
    q: 'Where can I find free open calls for artists?',
    a: [
      'Magpie has a page of [free open calls](/open-calls/free): calls that cost nothing to enter and charge nothing if you are selected. On the main calendar, the Price filter can show only “Free to enter” or “Totally free” calls.',
    ],
  },
  {
    q: 'Should I pay to enter an open call?',
    a: [
      'Entry fees are common, especially for prizes, where they often fund the prize money and judging. A small fee from an established gallery, museum or charity can be worth it. Before you pay, check three things: who is running it, what you get if selected, and whether there are more fees later.',
      'Be careful with calls that are free or cheap to enter but then ask selected artists for a large “hanging fee”, “exhibition fee” or a fee to “secure your space”. That is pay-to-exhibit: the organiser makes money from artists rather than from selling or showing the work.',
    ],
  },
  {
    q: 'What is pay-to-exhibit, and how do I spot it?',
    a: [
      'Pay-to-exhibit is when artists pay to be shown: a fee charged once you are “selected”, often hundreds of pounds, for a wall space, a page in a book or a place in an online show. Signs include almost everyone being accepted, a venue that rents its walls, vague selection, and fees that only appear after you apply.',
      'Magpie shows any fee if selected on every listing, and lists operators who sell exhibitions or awards to artists separately, under “Commercial opportunities”, with a price tag.',
    ],
  },
  {
    q: 'How does Magpie label fees?',
    a: [
      'Every listing shows two things: what it costs to enter, and what you would pay if you are selected. “Free, no fees if selected” means nothing to pay at all. “Free to enter, pay if selected” means a fee comes later, and the amount is on the listing. Paid entry shows the cheapest way in, in the organiser’s currency. “Not stated” means the organiser’s page does not say. [More on how we label fees](/how-it-works#fees).',
    ],
  },
  {
    q: 'What is an artist residency?',
    a: [
      'An artist residency gives you time and space to make work, usually somewhere new: a studio, accommodation and sometimes a fee, materials budget or exhibition at the end. Some are fully funded, some ask you to pay your own costs, and some charge a fee. Magpie lists [residencies taking applications now](/open-calls/residencies) with what each one costs.',
    ],
  },
  {
    q: 'How often is Magpie updated?',
    a: [
      'Every morning. At 7:00 London time, new open calls are found on artist opportunity sites, organisers’ own pages and social posts, and each deadline and fee is checked on the organiser’s own page before it is added. Closed calls drop off the calendar automatically.',
    ],
  },
  {
    q: 'Can I get open call deadlines by email or in my calendar?',
    a: [
      'Yes, both for free. The Magpie weekly email arrives every Monday with calls closing that week, new calls, and calls near you; sign up at the bottom of any page. You can also [subscribe to every deadline](/subscribe) in Google Calendar, Apple Calendar or Outlook, and new deadlines appear by themselves.',
    ],
  },
  {
    q: 'How do I submit an open call to Magpie?',
    a: [
      'Organisers and artists can [send us an open call](/submit), prize, residency or event. It is free to list. We check the deadline and fees on the organiser’s own page before it goes live.',
    ],
  },
  {
    q: 'Is Magpie free?',
    a: [
      'Yes. Magpie is free for artists, with no account, no ads and no tracking cookies. It is an independent project by designer and artist Irina Csapo.',
    ],
  },
];

/** "[text](/path)" → parts, for the page (React) and the static HTML. */
export function linkParts(s: string): ({ text: string } | { text: string; href: string })[] {
  const out: ({ text: string } | { text: string; href: string })[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    out.push({ text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}

/** The answer as plain text (for structured data and llms.txt). */
export const plainAnswer = (f: Faq) => f.a.map((p) => linkParts(p).map((x) => x.text).join('')).join(' ');
