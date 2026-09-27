// Rebuilds public/favicon.svg from src/assets/monogram.svg, adding a
// prefers-color-scheme rule so the mark turns white on dark tab chrome.
//
// index.html points at the light and white monograms with `media` attributes;
// this file is the no-media fallback for browsers that ignore those, so it has
// to switch on its own. Run `npm run favicon` after changing the monogram.

import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'src/assets/monogram.svg'
const OUTPUT = 'public/favicon.svg'
const LIGHT = '#1a1a1a'
const DARK = '#fff'

const svg = readFileSync(SOURCE, 'utf8')

// The Illustrator export declares one fill class; find it rather than assume
// the name, so a re-export with different class names still works.
const rule = new RegExp(`\\.(\\w+)\\s*\\{\\s*fill:\\s*${LIGHT}\\s*;?\\s*\\}`, 'i')
const found = svg.match(rule)
if (!found) {
  console.error(`No "fill: ${LIGHT}" class found in ${SOURCE}. Favicon not rebuilt.`)
  process.exit(1)
}

const className = found[1]
const banner = `<!-- GENERATED from ${SOURCE} — do not edit by hand.
     It is that file plus a prefers-color-scheme rule, and serves as the
     no-media fallback in index.html. If the monogram changes, regenerate:
       npm run favicon
-->
`

const out = svg
  .replace(
    found[0],
    `${found[0]}

      @media (prefers-color-scheme: dark) {
        .${className} {
          fill: ${DARK};
        }
      }`,
  )
  .replace(/^(<\?xml[^>]*\?>\n)/, `$1${banner}`)

writeFileSync(OUTPUT, out)
console.log(`${OUTPUT} rebuilt from ${SOURCE} (fill class .${className})`)
