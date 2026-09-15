---
name: blog-import
description: Turn a Word document (.docx) or PDF that Ramon drops in blog-inbox/ into a blog entry in src/posts/, putting each image where the document has a boxed placeholder like [exampleimage.jpeg]. Use when he says he added or uploaded a document to the inbox, asks to import or convert a doc or PDF into the blog, or mentions blog-inbox.
---

# Import a document into the blog

Ramon writes thesis entries in Word or as PDFs. Wherever an image belongs, the document has a box (or a line) with the image's file name in brackets, e.g. `[exampleimage.jpeg]`. The images sit next to the document in `blog-inbox/`. Read `WRITING.md` for the entry format (front matter, image and embed syntax).

## 1. Find the inputs

List `blog-inbox/` recursively, skipping `README.md` and `_imported/`. Each document plus the images in its folder is one entry. With several new documents, import each as its own entry.

## 2. Extract the text

- **.docx:** `node .claude/skills/blog-import/scripts/docx-to-markdown.mjs "<file>" --media-out "<scratchpad>/media"`. Text boxes come out as `[[BOX: ...]]` and pictures pasted into the document as `[[EMBEDDED IMAGE: name]]`, with the pictures extracted to the media folder.
- **.doc / .rtf:** convert first with `textutil -convert docx "<file>" -output "<scratchpad>/<name>.docx"`, then run the script.
- **.pdf:** read it with the Read tool (use `pages` for long files). Look at the page images as well as the text, because a boxed name can be missed by text extraction alone.
- **.pages or Google Docs:** ask Ramon to export as .docx (Pages: File → Export To → Word; Google Docs: File → Download → .docx).

## 3. Match placeholders to images

A placeholder is a bracketed file name, like `[exampleimage.jpeg]`, inside a box or on its own line.

- Match it to a file in the document's folder, ignoring case and tolerating extension variants (`.jpeg`/`.jpg`, `.heic`).
- If there's no matching file but the document has an embedded picture at that spot, use the embedded picture.
- A short line right under the box (or starting with "Caption:") is the caption.
- Look at each image and write short, factual alt text describing what it shows. Don't invent context.
- If a placeholder has no image, leave `<!-- MISSING IMAGE: name -->` at that spot and list it in the report.

## 4. Place the images

- **Entry slug:** kebab-case of the title (or of the document's file name if there's no title).
- **Copy images** to `public/blog/<slug>/` using lowercase kebab-case names.
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
- Keep Ramon's wording verbatim. Fix only formatting: headings (`##`), lists, bold/italic, links, and citations as footnotes or a `## Sources` list.
- Don't silently change grammar or spelling. List suggested fixes separately in the report.
- Put a Figma, YouTube or Vimeo link that sits on its own line into an `embed` block.

## 6. Verify in the browser

1. Make sure the dev server is running (`npm run dev`, http://localhost:5173).
2. With `playwright-cli`, capture `/blog/<slug>` at 1440px wide and at 390px wide.
3. Confirm every `<img>` loaded (`naturalWidth > 0`) and there are no console errors.
4. Look at the screenshots before reporting.

## 7. Report back

- The entry's file path, and which images went where.
- Missing images, and open questions such as the date or phase.
- Suggested spelling or grammar fixes.
- A reminder to set `draft: false`, then commit and push to publish.

Ask before moving processed documents to `blog-inbox/_imported/`. Don't commit unless Ramon asks.
