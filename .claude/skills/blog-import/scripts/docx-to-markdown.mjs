#!/usr/bin/env node
// Convert a Word document (.docx) to Markdown for a blog entry.
//
//   node docx-to-markdown.mjs <file.docx> [--media-out <dir>]
//
// - Headings, bold, italic, bullet lists and links are kept.
// - Text boxes (e.g. a box containing "[sketch-01.jpeg]") become  [[BOX: ...]]
// - Pictures pasted into the document become  [[EMBEDDED IMAGE: image1.png]]
//   and are extracted to --media-out when given.
// Needs only Node and the macOS `unzip` command.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const file = args[0]
const mediaFlag = args.indexOf('--media-out')
const mediaOut = mediaFlag === -1 ? null : args[mediaFlag + 1]

if (!file) {
  console.error('Usage: node docx-to-markdown.mjs <file.docx> [--media-out <dir>]')
  process.exit(1)
}

const readEntry = (entry) => {
  try {
    return execFileSync('unzip', ['-p', file, entry], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
}

const attr = (tag, name) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1]
const decode = (text) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

let xml = readEntry('word/document.xml')?.toString('utf8')
if (!xml) {
  console.error(`Not a readable .docx file: ${file}`)
  process.exit(1)
}

const relsXml = readEntry('word/_rels/document.xml.rels')?.toString('utf8') ?? ''
const rels = Object.fromEntries(
  [...relsXml.matchAll(/<Relationship\b[^>]*>/g)].map(([tag]) => [attr(tag, 'Id'), attr(tag, 'Target')]),
)

// Plain text of a chunk of XML, one line per paragraph
const plainText = (chunk) =>
  [...chunk.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
    .map(([p]) => decode([...p.matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')).trim())
    .filter(Boolean)
    .join(' ')

// Word stores each drawing twice (modern + legacy fallback); keep one copy
xml = xml.replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, '')

// Replace drawings and legacy shapes with marker text before reading paragraphs,
// because text boxes contain paragraphs nested inside paragraphs.
const embedded = []
const markerRun = (text) => `<w:r><w:t>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</w:t></w:r>`
xml = xml.replace(/<w:drawing>[\s\S]*?<\/w:drawing>|<w:pict>[\s\S]*?<\/w:pict>/g, (block) => {
  const box = /<w:txbxContent>([\s\S]*?)<\/w:txbxContent>/.exec(block)
  if (box) return markerRun(`[[BOX: ${plainText(box[1])}]]`)
  const blip = /r:(?:embed|id)="([^"]+)"/.exec(block)
  const target = blip && rels[blip[1]]
  if (target && /media\//.test(target)) {
    const name = path.basename(target)
    embedded.push(target)
    return markerRun(`[[EMBEDDED IMAGE: ${name}]]`)
  }
  return ''
})

const isOn = (rPr, tag) => {
  const match = new RegExp(`<w:${tag}(\\s[^>]*)?/>`).exec(rPr)
  return Boolean(match) && !/w:val="(0|false|off|none)"/.test(match[0])
}

function runsOf(chunk, href) {
  return [...chunk.matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)].map(([, run]) => {
    const rPr = /<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(run)?.[1] ?? ''
    const text = [...run.matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>|<w:(tab|br)\b[^>]*\/>/g)]
      .map((m) => (m[2] === 'tab' ? ' ' : m[2] === 'br' ? '\n' : decode(m[1])))
      .join('')
    return { text, bold: isOn(rPr, 'b'), italic: isOn(rPr, 'i'), href }
  })
}

function formatSegments(segments) {
  const merged = []
  for (const seg of segments) {
    const last = merged.at(-1)
    if (last && last.bold === seg.bold && last.italic === seg.italic && last.href === seg.href) last.text += seg.text
    else merged.push({ ...seg })
  }
  return merged
    .map(({ text, bold, italic, href }) => {
      if (!text.trim()) return text
      const [, lead, core, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text)
      let out = core
      if (italic) out = `*${out}*`
      if (bold) out = `**${out}**`
      if (href) out = `[${out}](${href})`
      return lead + out + trail
    })
    .join('')
}

const blocks = []
for (const [paragraph] of xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)) {
  const pPr = /<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(paragraph)?.[1] ?? ''
  const style = attr(/<w:pStyle\b[^>]*\/>/.exec(pPr)?.[0] ?? '', 'w:val') ?? ''

  const segments = []
  const body = paragraph.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/, '')
  for (const part of body.matchAll(/<w:hyperlink\b([^>]*)>([\s\S]*?)<\/w:hyperlink>|<w:r\b[^>]*>[\s\S]*?<\/w:r>/g)) {
    if (part[2] !== undefined) {
      const id = attr(part[1], 'r:id')
      const anchor = attr(part[1], 'w:anchor')
      segments.push(...runsOf(part[2], id ? rels[id] : anchor ? `#${anchor}` : undefined))
    } else {
      segments.push(...runsOf(part[0]))
    }
  }

  const text = formatSegments(segments).trim()
  if (!text) continue

  const heading = /^heading\s?(\d)$/i.exec(style)
  if (/^title$/i.test(style)) blocks.push(`# ${text.replace(/\*\*/g, '')}`)
  else if (heading) blocks.push(`${'#'.repeat(Math.min(Number(heading[1]) + 1, 4))} ${text.replace(/\*\*/g, '')}`)
  else if (/<w:numPr>/.test(pPr) || /^list/i.test(style)) blocks.push(`- ${text}`)
  else blocks.push(text)
}

// Keep consecutive list items together
const markdown = blocks
  .map((block, i) => (i > 0 && block.startsWith('- ') && blocks[i - 1].startsWith('- ') ? `\n${block}` : `\n\n${block}`))
  .join('')
  .trim()

if (mediaOut && embedded.length) {
  fs.mkdirSync(mediaOut, { recursive: true })
  for (const target of new Set(embedded)) {
    const data = readEntry(`word/${target.replace(/^\.?\//, '')}`)
    if (data) fs.writeFileSync(path.join(mediaOut, path.basename(target)), data)
  }
}

process.stdout.write(`${markdown}\n`)
