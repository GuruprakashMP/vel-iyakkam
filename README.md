# வேல் இயக்கம் · Vel Iyakkam

Website for **Vel Iyakkam**, a trust running in the name of Lord Murugan that supports the
education of children raised by a single parent. Every month on **Sashti day** the collected
amount is spent, and every rupee in and out is published openly — using **donor codes, never names**.

🌐 **https://guruprakashmp.github.io/vel-iyakkam/**

📖 **[தமிழில் முழு கையேடு — docs/SETUP-TAMIL.md](docs/SETUP-TAMIL.md)** ← start here

---

## What the site does

| Section | Description |
|---|---|
| **முகப்பு** / Home | Live totals — collected, given, balance — and a countdown to the next Sashti |
| **நன்கொடை கணக்கு** / Accounts | Code-wise donations, expenses, monthly summary with running balance, CSV export, print |
| **சஷ்டி நாட்காட்டி** / Sashti calendar | Sashti dates **calculated from scratch**, years ahead, with Kanda Sashti marked and `.ics` export |
| **கல்வி வழிகாட்டி** / Career guide | What to study after 12th — courses, entrance exams, scholarships, practical tips, in Tamil |
| **கதைக் களஞ்சியம்** / Story library | Moral and spiritual stories being collected for a future book |

Tamil is the default language; a single button switches the whole site to English.
Dark mode, mobile layout, and printing are all supported.

---

## How it is built

Plain HTML, CSS and JavaScript. **No build step, no framework, no server, no database, no cost.**
GitHub Pages serves the files exactly as they are in this repository.

```
index.html  donations.html  calendar.html  guidance.html  stories.html  about.html
assets/
  css/style.css        design system (light + dark)
  js/config.js         ← the only file you normally edit
  js/i18n.js           every Tamil and English string
  js/panchang.js       Sashti / tithi astronomy engine
  js/data.js           Google Sheets CSV loader
  js/app.js            header, footer, language, theme
data/
  *.sample.csv         fallback data, used until your Sheet is connected
  guidance.json        career-guidance content
docs/SETUP-TAMIL.md    the handbook (Tamil)
```

### Data flow

```
Google Sheet  ──published as CSV──►  browser fetches  ──►  page renders
```

Nothing is stored on a server. If a Sheet link is missing or fails, the site falls back
to the sample CSVs in `data/` so a page is never broken.

---

## The Sashti calculation

Sashti dates are **not** stored in a file — they are computed in the browser:

- **Sun's apparent longitude** — Meeus, *Astronomical Algorithms*, ch. 25
- **Moon's longitude** — Meeus ch. 47, full 60-term series
- **Tithi** = `floor(((moon − sun) mod 360) / 12)`; Shukla Shashti is index 5 (elongation 60°–72°)
- **Sunrise** — the standard sunrise equation, for the configured latitude/longitude
- **The Sashti day** is the civil date whose **sunrise falls inside the Shashti tithi** — the Tamil convention
- **Kanda Sashti** is the Shashti of the lunar month whose new moon fell with the Sun in Thulam (Aippasi amavasai)

Accuracy is better than about a minute. Verified against traditional dates:

| Year | Computed Kanda Sashti |
|---|---|
| 2024 | 7 November |
| 2025 | 27 October |
| 2026 | 15 November |
| 2027 | 4 November |

Days where the tithi begins or ends within half an hour of sunrise are flagged internally as
`borderline` — those are exactly the days on which two panchangams can legitimately differ.
The default location is **Tiruchendur**; change it in `config.js`.

---

## Privacy by design

- Donor **names never appear** anywhere in this repository or on the site — only codes (`VI-001`).
- Children who receive help are also referred to only by code (`ST-01`).
- Keep the code ↔ name register **outside** this repo and outside the published Sheet.
- Amounts are public so that the accounts are auditable; the identity behind each amount is not,
  so that nobody feels they gave too little or too much.

---

## Local preview

```bash
node .claude/serve.js .
```

Then open <http://localhost:4173>.

---

## Licence

Content (stories, guidance text) © Vel Iyakkam. The code may be reused freely by any
trust that wants to run its accounts this openly.
