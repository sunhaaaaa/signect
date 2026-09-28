// Small decorative pixel sprites (clouds, coins) for filling out otherwise
// empty screens with game-title-screen kitsch. Same rect-grid SVG technique
// as PixelMascot.
const CLOUD_PIXELS: [number, number, number, number][] = [
  [4, 0, 6, 2],
  [11, 1, 4, 2],
  [1, 2, 14, 2],
  [0, 4, 16, 3],
]

export function PixelCloud({ size = 60, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={(size * 7) / 16} viewBox="0 0 16 7" shapeRendering="crispEdges">
      <g fill={color}>
        {CLOUD_PIXELS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  )
}

export function PixelCoin({
  size = 28,
  face = '★',
  gold = '#FFC531',
  outline = '#1B1B2F',
}: {
  size?: number
  face?: string
  gold?: string
  outline?: string
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        clipPath: 'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)',
        border: `${Math.max(2, Math.round(size / 12))}px solid ${outline}`,
        background: gold,
        fontSize: size * 0.5,
        color: outline,
        lineHeight: 1,
      }}
    >
      {face}
    </div>
  )
}
