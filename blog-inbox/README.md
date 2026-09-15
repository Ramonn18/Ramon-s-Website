# Blog inbox

Drop documents here and Claude turns them into blog entries.

1. **Make a folder for each entry**, e.g. `blog-inbox/user-interviews/`. You can also drop files straight into this folder.
2. **Put your document inside**: a Word file (.docx) or a PDF.
3. **Put every image and spreadsheet the document mentions** in the same folder.
4. **Mark where each one goes:** add a box (or a line) containing the exact file name in brackets.
   - Image: `[sketch-01.jpeg]`
   - Spreadsheet or column map: `[column-map.xlsx]`, or name a specific sheet with `[column-map.xlsx: Sheet2]`
   - For a caption, write it on the line right under the box.
5. **Ask Claude**, e.g. "import blog-inbox/user-interviews into the blog".

Claude keeps your wording and every table cell as written, places the images and tables, saves the entry as a draft, and shows you a preview. When you're happy with it, set `draft: false`, then commit and push.

**Tables typed directly in Word** come across too. You don't need a separate spreadsheet for those.

**Exporting from other apps:**
- **Google Docs:** File → Download → Microsoft Word (.docx).
- **Google Sheets:** File → Download → Microsoft Excel (.xlsx) or Comma-separated values (.csv).
- **Pages:** File → Export To → Word or PDF.
- **Numbers:** File → Export To → Excel or CSV.

This folder stays on your computer. Only the finished entry and its images go to GitHub.
