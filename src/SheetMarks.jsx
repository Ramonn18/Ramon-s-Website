const CORNERS = ['tl', 'tr', 'bl', 'br']

// Static crosshairs and edge labels for pages inside a `.sheet`
export default function SheetMarks({ label, details = [] }) {
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
          <span className="meta__start">RAMON NOIR</span>
          <span>{label}</span>
          <span className="meta__end">
            {details.map((detail) => (
              <span key={detail}>{detail}</span>
            ))}
          </span>
        </p>
      ))}
    </>
  )
}
