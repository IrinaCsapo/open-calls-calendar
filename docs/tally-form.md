# The Tally submission form

The Submit page will show a Tally form, so artists and organisers can send an open call without a GitHub
account. Entries arrive in Tally (and by email, if notifications are on). Add them to
`src/data/listings.json`, or ask Claude to ("add the new Tally submissions").

## Make the form

1. Sign in at https://tally.so and create a blank form called **Submit an open call to Magpie**.
2. Start with a **Text** block:
   > Know an open call, prize, residency, grant or event for artists that we're missing? Tell us.
   > Please include **every fee**, including anything artists pay if they're selected. That's the point of Magpie.
3. Add these questions, in this order. Keep the wording short; we fill in the rest (time zone, region,
   coordinates, image) when we add the listing.

### The basics

| # | Question | Tally block | Required | Options / help text |
|---|---|---|---|---|
| 1 | Name of the open call or event | Short answer | Yes | Placeholder: *John Ruskin Prize 2027* |
| 2 | Link to apply or register | Link | Yes | Help: *The official page, rather than an Instagram post* |
| 3 | Organiser | Short answer | Yes | Placeholder: *Parker Harris* |
| 4 | What kind is it? | Multiple choice | Yes | Open call, Prize, Residency, Grant, Fellowship or programme, Commission, Event, Meetup, Workshop |
| 5 | Deadline | Date | Yes | Help: *When applications close. For events, the date it starts.* |
| 6 | Exhibition or event dates | Short answer | No | Placeholder: *16 April to 3 May 2027* |
| 7 | Where is it? | Multiple choice | Yes | Online, In person, Hybrid |
| 8 | City and country | Short answer | Yes, but only shown if 7 isn't "Online" (conditional logic) | Placeholder: *London, United Kingdom* |
| 9 | Which disciplines? | Checkboxes | Yes | Any medium, Painting, Drawing, Printmaking, Collage, Mixed media, Illustration, Sculpture, Ceramics, Textiles, Craft, Photography, Film & video, Digital art, Design, Music, Sound, Writing, Performance |
| 10 | Who can apply? | Short answer | Yes | Placeholder: *UK-based artists over 18* |

### The money (add a **Heading** block: "The money")

| # | Question | Tally block | Required | Options / help text |
|---|---|---|---|---|
| 11 | Is there an entry fee? | Multiple choice | Yes | Free to enter, Paid, Not sure |
| 12 | Entry fee details | Short answer | Yes, but only shown if 11 is "Paid" | Placeholder: *£15 per work, 3 for £35* |
| 13 | Do selected artists have to pay anything? | Multiple choice | Yes | No, nothing; Yes; Not sure. Help: *Hanging, exhibition or participation fees, "secure your space", or framing or shipping you must buy from them* |
| 14 | What do selected artists pay? | Short answer | Yes, but only shown if 13 is "Yes" | Placeholder: *£250 hanging fee* |
| 15 | Commission on sales | Short answer | No | Placeholder: *30%* |
| 16 | Prizes | Long answer | No | Help: *One per line, e.g. £5,000 first prize, solo show in London* |

### About you

| # | Question | Tally block | Required | Options / help text |
|---|---|---|---|---|
| 17 | Poster or image | File upload | No | Help: *Optional. We'll use the organiser's image if there is one* |
| 18 | Are you the organiser? | Multiple choice | No | I'm the organiser; I spotted it |
| 19 | Your email | Email | No | Help: *Only to tell you when it's live* |
| 20 | I've included every fee I know about | Checkbox | Yes | |

4. **Settings:** under Notifications, turn on **Self email notifications** so you hear about each entry.
5. **Publish**, then copy the form's link, e.g. `https://tally.so/r/wA1bC2`, and send it to Claude to put it on the
   Submit page.
