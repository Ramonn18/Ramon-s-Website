// Builds public/favicon.svg from src/assets/monogram.svg.
//
// The full monogram is the R plus an outlined ghost R and its extrusion lines.
// All that detail turns to mush at 16px, the size a browser tab actually shows,
// so the favicon uses only the solid R glyph, cropped square.
//
// One file, one ink color, no theme switching — index.html points at it and
// nothing else. Run `npm run favicon` after changing the monogram.

import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'src/assets/monogram.svg'
const OUTPUT = 'public/favicon.svg'
const FILL = '#1a1a1a'
const PADDING = 14 // user units of air around the glyph

const svg = readFileSync(SOURCE, 'utf8')

// The solid R is the first path; everything after it is outline and extrusion.
const paths = [...svg.matchAll(/<path[^>]*?\sd="([^"]*)"/g)].map((m) => m[1])
if (!paths.length) {
  console.error(`No <path> found in ${SOURCE}. Favicon not rebuilt.`)
  process.exit(1)
}
const glyph = paths[0]

// Walk the path to find its extent. The export uses absolute M, relative c/h/v
// and Z; control points are counted too, which only ever pads the crop.
function boundsOf(d) {
  const tokens = d.match(/[MmZzCcHhVvLl]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0
  let cmd = ''
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const see = (px, py) => {
    if (px < minX) minX = px
    if (px > maxX) maxX = px
    if (py < minY) minY = py
    if (py > maxY) maxY = py
  }

  for (let i = 0; i < tokens.length; ) {
    const t = tokens[i]
    if (/[A-Za-z]/.test(t)) {
      cmd = t
      i += 1
      if (cmd === 'Z' || cmd === 'z') {
        x = startX
        y = startY
        see(x, y)
      }
      continue
    }
    const n = () => Number(tokens[i++])
    switch (cmd) {
      case 'M':
      case 'L':
        x = n()
        y = n()
        if (cmd === 'M') { startX = x; startY = y }
        see(x, y)
        break
      case 'm':
      case 'l':
        x += n()
        y += n()
        if (cmd === 'm') { startX = x; startY = y }
        see(x, y)
        break
      case 'H': x = n(); see(x, y); break
      case 'h': x += n(); see(x, y); break
      case 'V': y = n(); see(x, y); break
      case 'v': y += n(); see(x, y); break
      case 'C': {
        const c1x = n(), c1y = n(), c2x = n(), c2y = n()
        x = n(); y = n()
        see(c1x, c1y); see(c2x, c2y); see(x, y)
        break
      }
      case 'c': {
        const c1x = x + n(), c1y = y + n(), c2x = x + n(), c2y = y + n()
        x += n(); y += n()
        see(c1x, c1y); see(c2x, c2y); see(x, y)
        break
      }
      default:
        i += 1 // unknown command: skip the number rather than spin
    }
  }
  return { minX, minY, maxX, maxY }
}

const b = boundsOf(glyph)
const width = b.maxX - b.minX
const height = b.maxY - b.minY
const side = Math.max(width, height) + PADDING * 2
const originX = b.minX + width / 2 - side / 2
const originY = b.minY + height / 2 - side / 2
const r = (v) => Number(v.toFixed(2))

const out = `<?xml version="1.0" encoding="UTF-8"?>
<!-- GENERATED from ${SOURCE} by scripts/build-favicon.mjs — do not edit by hand.
     Just the solid R, cropped square, so it stays legible at 16px.
     Regenerate with: npm run favicon -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(originX)} ${r(originY)} ${r(side)} ${r(side)}">
  <path fill="${FILL}" d="${glyph}"/>
</svg>
`

writeFileSync(OUTPUT, out)
console.log(
  `${OUTPUT} rebuilt — glyph ${r(width)}×${r(height)} at ${r(b.minX)},${r(b.minY)}; ` +
    `square viewBox ${r(side)}; ${out.length} bytes (was ${svg.length} for the full monogram)`,
)
