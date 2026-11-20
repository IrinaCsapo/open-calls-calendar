# Setting up Brevo for the Magpie weekly email

Magpie's sign-up journey, adapted from BuilderBee:

1. Someone enters their email in **The weekly roundup** box (above the footer). The site sends it, with their rough place
   (UK, Europe, US…), straight to Magpie's Brevo form.
2. Brevo emails them **"Confirm your Magpie weekly email"** (our design, `scripts/brevo-templates.ts`).
3. They click **Yes, send me the weekly email** and land on **magpie.cool/subscribed**.
4. Brevo sends **"Welcome to Magpie"** with open calls near their place, or closing soon (refreshed daily).
5. Every Monday the **Weekly email** workflow saves that week's email as a draft campaign and sends you a test.
   You check it in Brevo and press send.

A separate free Brevo account for Magpie keeps its 300 emails a day apart from BuilderBee's.

## Once, in Brevo

1. **Account.** Sign up at brevo.com (free). Use `irina.csapo+magpie@gmail.com` (it lands in your Gmail) or
   hello@magpie.cool. Company name: Magpie.
2. **Domain.** Settings → Senders, Domains & Dedicated IPs → Domains → Add a domain → `magpie.cool` → authenticate it
   yourself. Brevo shows a `brevo-code` TXT record and two DKIM CNAMEs. **Paste them to Claude before adding them:**
   magpie.cool already has DKIM records from your other Brevo account (for Gmail replies), and a domain can only have
   one of each, so they may need swapping rather than adding.
3. **Sender.** Senders → Add a sender: name `Magpie`, email `hello@magpie.cool`.
4. **The place field.** Contacts → Settings → Contact attributes → Add a new attribute: name `PLACE`, type Text.
5. **The list.** Contacts → Lists → Create a list: `Magpie weekly`. Note its number (ID), e.g. `#2`.
6. **API key.** Settings → SMTP & API → API keys → Generate a new API key → name it `GitHub`. Copy it.

## Once, in GitHub (github.com/IrinaCsapo/open-calls-calendar → Settings → Secrets and variables → Actions)

- **Secrets** tab → New repository secret: `BREVO_API_KEY` = the key from step 6. Delete the old `BUTTONDOWN_API_KEY`.
- **Variables** tab → New repository variable: `BREVO_LIST_ID` = the list's number (just the digits),
  and `BREVO_TEST_EMAILS` = the address(es) that get test copies, comma-separated.
- **Actions** tab → **Brevo signup emails** → Run workflow. This creates the two email templates in Brevo.

## Then the form, in Brevo

7. Contacts → Forms → **Create a subscription form**, name `Magpie weekly`.
   - Fields: **Email**, plus add the **PLACE** attribute as a text field (it can be optional; nobody sees Brevo's own
     form, the site sends the value).
   - List: `Magpie weekly`.
   - Settings: turn on **Double opt-in**; confirmation email template **Magpie: confirm the weekly email**;
     redirect after confirmation **https://magpie.cool/subscribed**; turn on the **final confirmation email** with
     template **Magpie: welcome to the weekly email**.
   - Save and publish, then **Share → HTML code** and copy the form's `action` link (looks like
     `https://xxxx.sibforms.com/serve/MUIF...`). **Send it to Claude**: it goes in `NEWSLETTER_FORM_URL` in
     `src/lib/site.ts`, which turns the sign-up box on.

## Checking it

- Sign up on magpie.cool with a Gmail alias (e.g. `irina.csapo+test1@gmail.com`): confirm email, then
  magpie.cool/subscribed, then the welcome email.
- Actions → **Weekly email** → Run workflow (mode `draft`): a draft appears in Brevo → Campaigns and a test arrives.
- Previews without Brevo: `npx tsx scripts/brevo-templates.ts --preview` and `npx tsx scripts/weekly-email.ts --preview`
  write HTML files to `email-preview/`.
