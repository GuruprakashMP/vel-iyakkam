# வேல் இயக்கம் · Vel Iyakkam

🌐 **https://guruprakashmp.github.io/vel-iyakkam/**

One page: help given (Sashtis served, education kits, members), the help list, next Sashti, folded monthly accounts, and the members wall (A to Z).
The site never shows what each person gave.

## How the data flows

```
Google Form  ->  "Members Form (Responses)" sheet   (private: phone, email, address stay here)
                       | column A code + name only (IMPORTRANGE)
                       v
"Vel Fund" sheet:  Accounts tab  +  Members tab     (shared "anyone with the link: viewer")
                       |
                       v
Website reads both tabs on every visit and calculates everything.
```

Nobody edits the website for the monthly work. Everything happens in the **Vel Fund** sheet:

| When | What to type in the `Accounts` tab (add at the bottom) |
|---|---|
| A member pays | `Date`, `Member Code`, `Received ₹` |
| Sashti day spending | `Date`, `Spent ₹`, `Details` (leave Member Code empty) |
| After each Sashti (`Help` tab) | `Date`, `Students`, `What was given` (no names or addresses) |

No Total / Remaining rows and no splitting a payment into a/b: the `Balance` column and the website work it out.
Rows are read in order, so always add at the bottom and never sort.

A new member is added by giving them a code (`VEL-0xx`) in column A of the form responses sheet.
They then appear in the `Members` tab and on the website automatically.

## Files

```
index.html             the page
assets/js/config.js    sheet ID, form link, WhatsApp link, privacy switches  <- the only file to edit
assets/js/app.js       reads the sheet, does the sums, draws the page
assets/js/panchang.js  Sashti date calculation (sunrise at Tiruchendur)
assets/css/style.css   look (follows the phone's light/dark setting)
data/snapshot.json     saved copy of the sheet, shown only if Google cannot be reached
photos/VEL-0xx.jpg     member photos, named by code
```

## Changing the code

After editing a CSS or JS file, change the `?v=` number on its line in `index.html`,
otherwise visitors' browsers keep the old file for up to 10 minutes.

## Photos

Save each photo as `photos/<code>.jpg` (for example `photos/VEL-007.jpg`), square if possible, about 400 x 400 px.
On GitHub: open the `photos` folder, **Add file -> Upload files**, drop the files, **Commit**.
Without a photo the member's initials are shown.

## Privacy

- Phone, email, address and date of birth never leave the private form sheet.
- The website shows only monthly totals; no per-person amounts, no codes next to amounts.

## Local preview

```bash
node .claude/serve.js .
```

Open http://localhost:4173
