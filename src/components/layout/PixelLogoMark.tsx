// Hand-authored pixel "S" monogram (7x9 grid) — crisp at any size, unlike a font glyph.
const S_PIXELS: [number, number, number, number][] = [
  [1, 0, 5, 2],
  [0, 1, 2, 3],
  [1, 3, 4, 3],
  [5, 5, 2, 3],
  [1, 7, 5, 2],
]

export function PixelLogoMark({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={(size * 9) / 7} viewBox="0 0 7 9" shapeRendering="crispEdges" aria-hidden="true">
      <g fill={color}>
        {S_PIXELS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  )
}
