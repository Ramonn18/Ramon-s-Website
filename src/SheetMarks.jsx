const CORNERS = ['tl', 'tr', 'bl', 'br']

// Static crosshairs and edge labels for pages inside a `.sheet`.
// Figma draws two labels per edge — "RAMON N." and a page detail — and the
// bottom row is the top row rotated 180°, so they land on opposite corners.
export default function SheetMarks({ detail }) {
  return (
    <>
      {CORNERS.map((corner) => (
        <span key={corner} className={`crosshair crosshair--${corner}`} aria-hidden="true" />
      ))}
      {['top', 'bottom'].map((position) => (
        <p
          key={position}
          className={`meta meta--${position}`}
          style={position === 'bottom' ? { transform: 'rotate(180deg)' } : undefined}
          aria-hidden="true"
        >
          <span className="meta__start">RAMON N.</span>
          <span className="meta__end">{detail}</span>
        </p>
      ))}
    </>
  )
}
