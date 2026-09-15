#!/usr/bin/env node
// Convert a spreadsheet to a Markdown table for a blog entry.
//
//   node sheet-to-markdown.mjs <file.xlsx|.csv|.tsv> [--sheet "<name>"]
//   node sheet-to-markdown.mjs <file.xlsx> --list-sheets
//
// - The first non-empty row is the header; empty rows and columns are dropped.
// - Without --sheet, the first visible sheet is used (other sheet names go to stderr).
// - Cells with an Excel date format become YYYY-MM-DD.
// Google Sheets: File → Download → Microsoft Excel (.xlsx) or CSV.
// Needs only Node and the macOS `unzip` command.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { markdownTable } from './table.mjs'

const args = process.argv.slice(2)
const file = args[0]
const sheetFlag = args.indexOf('--sheet')
const wantedSheet = sheetFlag === -1 ? null : args[sheetFlag + 1]
const listSheets = args.includes('--list-sheets')

if (!file) {
  console.error('Usage: node sheet-to-markdown.mjs <file.xlsx|.csv|.tsv> [--sheet "<name>"] [--list-sheets]')
  process.exit(1)
}

const attr = (tag, name) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1]
const decode = (text = '') =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&')

function parseDelimited(text, delimiter) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field || row.length) rows.push([...row, field])
  return rows
}

function readCsv() {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '')
  const firstLine = text.split(/\r?\n/, 1)[0]
  const delimiter = path.extname(file).toLowerCase() === '.tsv'
    ? '\t'
    : [',', ';', '\t'].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0]
  return parseDelimited(text, delimiter)
}

function readXlsx() {
  const readEntry = (entry) => {
    try {
      return execFileSync('unzip', ['-p', file, entry], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8')
    } catch {
      return null
    }
  }

  const workbook = readEntry('xl/workbook.xml')
  if (!workbook) {
    console.error(`Not a readable .xlsx file: ${file}`)
    process.exit(1)
  }

  const rels = Object.fromEntries(
    [...(readEntry('xl/_rels/workbook.xml.rels') ?? '').matchAll(/<Relationship\b[^>]*>/g)].map(([tag]) => [
      attr(tag, 'Id'),
      attr(tag, 'Target'),
    ]),
  )
  const sheets = [...workbook.matchAll(/<sheet\b[^>]*\/>/g)].map(([tag]) => {
    const target = rels[attr(tag, 'r:id')] ?? ''
    return {
      name: decode(attr(tag, 'name')),
      path: target.startsWith('/') ? target.slice(1) : `xl/${target}`,
      hidden: /hidden/.test(attr(tag, 'state') ?? ''),
    }
  })

  if (listSheets) {
    for (const sheet of sheets) console.log(sheet.hidden ? `${sheet.name} (hidden)` : sheet.name)
    process.exit(0)
  }

  const visible = sheets.filter((sheet) => !sheet.hidden)
  const sheet = wantedSheet ? sheets.find((s) => s.name === wantedSheet) : visible[0]
  if (!sheet) {
    console.error(`Sheet not found: ${wantedSheet}. Sheets: ${sheets.map((s) => s.name).join(', ')}`)
    process.exit(1)
  }
  if (!wantedSheet && visible.length > 1) {
    console.error(`Using sheet "${sheet.name}". Other sheets: ${visible.slice(1).map((s) => s.name).join(', ')}`)
  }

  const shared = [...(readEntry('xl/sharedStrings.xml') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(([, si]) =>
    decode([...si.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]).join('')),
  )

  // Which cell styles are dates
  const styles = readEntry('xl/styles.xml') ?? ''
  const customFormats = Object.fromEntries(
    [...styles.matchAll(/<numFmt\b[^>]*\/>/g)].map(([tag]) => [attr(tag, 'numFmtId'), decode(attr(tag, 'formatCode'))]),
  )
  const isDateFormat = (id) => {
    const n = Number(id)
    if ((n >= 14 && n <= 22) || (n >= 45 && n <= 47)) return true
    const code = (customFormats[id] ?? '').replace(/"[^"]*"|\[[^\]]*\]/g, '')
    return /[dmy]/i.test(code)
  }
  const cellXfs = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles)?.[1] ?? ''
  const dateStyles = [...cellXfs.matchAll(/<xf\b[^>]*>/g)].map(([tag]) => isDateFormat(attr(tag, 'numFmtId')))

  const columnIndex = (ref) => [...ref.replace(/\d+/g, '')].reduce((sum, ch) => sum * 26 + ch.charCodeAt(0) - 64, 0) - 1

  const xml = readEntry(sheet.path) ?? ''
  const rows = []
  for (const [, rowAttrs, rowBody = ''] of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowIndex = Number(attr(rowAttrs, 'r')) - 1 || rows.length
    const row = []
    let next = 0
    for (const [, cellAttrs, cellBody = ''] of rowBody.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attr(cellAttrs, 'r')
      const col = ref ? columnIndex(ref) : next
      next = col + 1
      const type = attr(cellAttrs, 't')
      const raw = decode(/<v>([\s\S]*?)<\/v>/.exec(cellBody)?.[1])
      let value = raw
      if (type === 's') value = shared[Number(raw)] ?? ''
      else if (type === 'inlineStr') value = decode([...cellBody.matchAll(/<t\b[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]).join(''))
      else if (type === 'b') value = raw === '1' ? 'TRUE' : 'FALSE'
      else if (type !== 'str' && type !== 'e' && raw !== '') {
        const number = Number(raw)
        if (dateStyles[Number(attr(cellAttrs, 's') ?? 0)] && Number.isFinite(number)) {
          value = new Date(Math.round((number - 25569) * 86400000)).toISOString().slice(0, 10)
        } else if (Number.isFinite(number)) {
          value = String(Number(number.toPrecision(12)))
        }
      }
      row[col] = value
    }
    rows[rowIndex] = row
  }
  return Array.from(rows, (row) => Array.from(row ?? [], (cell) => cell ?? ''))
}

const extension = path.extname(file).toLowerCase()
const rows = extension === '.csv' || extension === '.tsv' ? readCsv() : readXlsx()
const table = markdownTable(rows)

if (!table) {
  console.error('The sheet is empty.')
  process.exit(1)
}
process.stdout.write(`${table}\n`)
