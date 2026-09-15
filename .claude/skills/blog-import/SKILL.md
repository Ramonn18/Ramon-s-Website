---
name: blog-import
description: Turn a Word document (.docx) or PDF that Ramon drops in blog-inbox/ into a blog entry in src/posts/, putting each image, spreadsheet table (.xlsx / .csv / Google Sheets export) or column map where the document has a boxed placeholder like [exampleimage.jpeg] or [column-map.xlsx]. Use when he says he added or uploaded a document or spreadsheet to the inbox, asks to import or convert a doc, PDF or sheet into the blog, or mentions blog-inbox.
---

# Import a document into the blog

Ramon writes thesis entries in Word or as PDFs. Wherever an image or table belongs, the document has a box (or a line) with the file name in brackets, like `[exampleimage.jpeg]` or `[column-map.xlsx]`. Those files sit next to the document in `blog-inbox/`. He often posts column maps, which are wide tables. Read `WRITING.md` for the entry format (front matter, image, embed and table syntax).

## 1. Find the inputs

List `blog-inbox/` recursively, skipping `README.md` and `_imported/`. Each document plus the images and spreadsheets in its folder is one entry. With several new documents, import each as its own entry. A spreadsheet dropped in with no document can become its own entry, or a table in an existing one; ask Ramon which.

## 2. Extract the text

- **.docx:** `node .claude/skills/blog-import/scripts/docx-to-markdown.mjs "<file>" --media-out "<scratchpad>/media"`. Text boxes come out as `[[BOX: ...]]` and pasted pictures as `[[EMBEDDED IMAGE: name]]`, extracted to the media folder. Tables typed directly in Word come out as Markdown tables.
- **.doc / .rtf:** convert first with `textutil -convert docx "<file>" -output "<scratchpad>/<name>.docx"`, then run the script.
- **.pdf:** read it with the Read tool (use `pages` for long files). Look at the page images as well as the text: a boxed name or a table's column structure can be lost in text extraction. Rebuild PDF tables as Markdown tables from what the page shows, keeping every cell's text exactly.
- **.pages or Google Docs:** ask Ramon to export as .docx (Pages: File → Export To → Word; Google Docs: File → Download → .docx).

## 3. Match placeholders to files

A placeholder is a bracketed file name, like `[exampleimage.jpeg]` or `[column-map.xlsx]`, inside a box or on its own line. Match it to a file in the document's folder, ignoring case and tolerating extension variants (`.jpeg`/`.jpg`, `.heic`). A short line right under the box (or starting with "Caption:") is its caption.

- **Images:** if there's no matching file but the document has an embedded picture at that spot, use the embedded picture. Look at each image and write short, factual alt text. Don't invent context.
- **Spreadsheets** (`.xlsx`, `.csv`, `.tsv`; Google Sheets exported as .xlsx or .csv):
  - Run `node .claude/skills/blog-import/scripts/sheet-to-markdown.mjs "<file>"` and put the table at that spot.
  - For a workbook with several sheets, run `--list-sheets` first. A placeholder can name the sheet, like `[column-map.xlsx: Sheet2]`; pass that name with `--sheet "<name>"`. With no sheet named and several visible sheets, ask which ones to include.
  - The first row is used as the header, and empty rows and columns are dropped. If the real header isn't in the first row, or cells are merged, check the output against the file and fix the table by hand. Never change cell contents.
  - For a large table (roughly 60+ rows), ask whether to include all of it. Also offer a download link to the original: copy it to `public/blog/<slug>/` and add `[Download the column map (.xlsx)](column-map.xlsx)`.
  - Put the caption, if any, on its own line directly under the table.
- **Missing files:** leave `<!-- MISSING FILE: name -->` at that spot and list it in the report.

## 4. Place the files

- **Entry slug:** kebab-case of the title (or of the document's file name if there's no title).
- **Copy images and downloadable spreadsheets** to `public/blog/<slug>/` using lowercase kebab-case names.
- **Convert** HEIC or TIFF to JPEG with `sips -s format jpeg`.
- **Downscale** photos whose longer edge is over 2400px with `sips -Z 2400`.
- **Keep PNG** for screenshots.
- **Write each image** as `![alt](file.jpg "caption")` on its own line.

## 5. Write the entry

Create `src/posts/<slug>.md` with this front matter:

- **title:** the document's title or first heading.
- **date:** a date stated in the document; otherwise use today's date and confirm it with Ramon.
- **phase:** one of Research, Concept, Prototype or Critique. Use what the document says; if it doesn't say, ask.
- **summary:** Ramon's own opening sentence or two, lightly trimmed. Don't write promotional copy.
- **draft:** `true` until Ramon approves.

**Content rules:**
- Keep Ramon's wording and every table cell verbatim. Fix only formatting: headings (`##`), lists, bold/italic, links, tables, and citations as footnotes or a `## Sources` list.
- Don't silently change grammar or spelling. List suggested fixes separately in the report.
- Put a Figma, YouTube or Vimeo link that sits on its own line into an `embed` block.

## 6. Verify in the browser

1. Make sure the dev server is running (`npm run dev`, http://localhost:5173).
2. With `playwright-cli`, capture `/blog/<slug>` at 1440px wide and at 390px wide.
3. Confirm every `<img>` loaded (`naturalWidth > 0`), each table has the expected number of rows and columns, and there are no console errors.
4. Look at the screenshots before reporting. Wide tables should scroll sideways inside their box, not push the page wider.

## 7. Report back

- The entry's file path, and which images and tables went where.
- Missing files, and open questions such as the date, phase, or which sheet to use.
- Suggested spelling or grammar fixes.
- A reminder to set `draft: false`, then commit and push to publish.

Ask before moving processed documents to `blog-inbox/_imported/`. Don't commit unless Ramon asks.
