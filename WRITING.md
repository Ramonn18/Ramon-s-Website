# Writing blog entries

Each entry is one Markdown file in `src/posts/`. The file name becomes the web address:
`src/posts/user-interviews.md` → `/blog/user-interviews`.

## 1. Start a new entry

Copy `src/posts/thesis-kickoff.md`, rename it (lowercase, words joined with dashes), and edit the top block:

```md
---
title: User interviews
date: 2026-09-28
phase: Research
summary: What I learned from talking to five people about the problem.
draft: true
---
```

| Field | What it does |
|---|---|
| `title` | The entry's headline |
| `date` | `YEAR-MONTH-DAY`. Entries are numbered in date order (01, 02, 03…) |
| `phase` | `Research`, `Concept`, `Prototype` or `Critique` (any other word also works and gets its own filter) |
| `summary` | One or two sentences shown in the entry list |
| `draft` | `true` shows it only on your computer; `false` publishes it |

## 2. Write

Everything under the top block is normal Markdown:

```md
## A section heading

A paragraph with **bold**, *italic*, and a [link](https://example.com).

- A bullet
- [ ] A to-do item

> A quote from an interview or reading.
```

## 3. Images and sketches

1. Make a folder named after the entry in `public/blog/`, e.g. `public/blog/user-interviews/`.
2. Put the image there.
3. Write the image on its own line. The text in brackets describes the image for screen readers; the quoted text is the caption.

```md
![Paper sketches of the onboarding flow](sketches-01.jpg "First round of onboarding sketches")
```

## 4. Figma prototypes and videos

Use an `embed` block with the link on the first line and an optional caption on the second:

````md
```embed
https://www.figma.com/proto/abc123/My-prototype
Clickable prototype, version 1
```
````

Works with Figma links (set the file to "Anyone with the link can view"), YouTube, Vimeo, or a video file (`.mp4` / `.webm`) placed in the entry's `public/blog/` folder.

## 5. Sources and citations

List sources under a `## Sources` heading, or cite inline with footnotes:

```md
Accessibility is a baseline, not a feature.[^1]

[^1]: Kat Holmes, *Mismatch: How Inclusion Shapes Design*, 2018.
```

## 6. Tables and column maps

Write a table with pipes. The first row is the header:

```md
| Old field | New field | Type |
| --- | --- | --- |
| user_name | fullName | text |
| zip_code | postalCode | text |
```

Wide tables scroll sideways on the page, so column maps with many columns are fine. To turn an Excel or Google Sheets file into a table, use the import in step 7.

## 7. Or import a Word document, PDF or spreadsheet

Put the document in a folder inside `blog-inbox/` together with its images and spreadsheets (.xlsx or .csv). Mark each spot with the file name in brackets, like `[sketch-01.jpeg]` or `[column-map.xlsx]`, then ask Claude to import it. Details: `blog-inbox/README.md`.

## 8. Preview and publish

- Preview while writing: `npm run dev`, then open http://localhost:5173/blog
- Publish: set `draft: false`, commit, and push to GitHub. Netlify rebuilds the live site automatically in about a minute.
