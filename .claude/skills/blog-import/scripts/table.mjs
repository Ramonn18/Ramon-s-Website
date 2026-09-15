// Shared by the document and spreadsheet converters.

/** Rows of cell values → a Markdown table. The first row is the header; empty rows and columns are dropped. */
export function markdownTable(rows) {
  const clean = (value) =>
    String(value ?? '')
      .replace(/\s*\r?\n\s*/g, ' ')
      .replace(/\|/g, '\\|')
      .trim()

  const filled = rows.map((row) => row.map(clean)).filter((row) => row.some(Boolean))
  if (!filled.length) return ''

  const width = Math.max(...filled.map((row) => row.length))
  const columns = [...Array(width).keys()].filter((col) => filled.some((row) => row[col]))
  const table = filled.map((row) => columns.map((col) => row[col] ?? ''))

  const line = (cells) => `| ${cells.join(' | ')} |`
  return [line(table[0]), line(table[0].map(() => '---')), ...table.slice(1).map(line)].join('\n')
}
