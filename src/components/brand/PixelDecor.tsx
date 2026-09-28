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

const BUSH_PIXELS: [number, number, number, number][] = [
  [3, 1, 8, 3],
  [0, 3, 14, 4],
  [1, 2, 4, 2],
  [9, 2, 4, 2],
]

export function PixelBush({
  size = 40,
  color = '#3CB043',
  outline = '#1B1B2F',
}: {
  size?: number
  color?: string
  outline?: string
}) {
  return (
    <svg width={size} height={(size * 7) / 14} viewBox="-1 0 16 8" shapeRendering="crispEdges">
      <g fill={outline}>
        {BUSH_PIXELS.map(([x, y, w, h], i) => (
          <rect key={i} x={x - 1} y={y - 1} width={w + 2} height={h + 2} />
        ))}
      </g>
      <g fill={color}>
        {BUSH_PIXELS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  )
}

const FLOWER_PETALS: [number, number, number, number][] = [
  [1, 0, 2, 2],
  [0, 1, 4, 2],
  [1, 3, 2, 2],
]

export function PixelFlower({
  size = 24,
  petalColor = '#E5527A',
  stemColor = '#3CB043',
}: {
  size?: number
  petalColor?: string
  stemColor?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 6 12" shapeRendering="crispEdges">
      <g fill={stemColor}>
        <rect x={2} y={5} width={2} height={7} />
      </g>
      <g fill={petalColor}>
        {FLOWER_PETALS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <rect x={2} y={2} width={2} height={2} fill="#FFC531" />
    </svg>
  )
}

const TREE_TRUNK_PIXELS: [number, number, number, number][] = [[5, 12, 4, 7]]

const TREE_CANOPY_PIXELS: [number, number, number, number][] = [
  [4, 0, 6, 3],
  [1, 3, 12, 4],
  [0, 7, 14, 5],
]

export function PixelTree({
  size = 90,
  color = '#3CB043',
  trunkColor = '#8A5A32',
  outline = '#1B1B2F',
}: {
  size?: number
  color?: string
  trunkColor?: string
  outline?: string
}) {
  const all = [...TREE_TRUNK_PIXELS, ...TREE_CANOPY_PIXELS]
  return (
    <svg width={(size * 14) / 19} height={size} viewBox="-1 -1 16 21" shapeRendering="crispEdges">
      <g fill={outline}>
        {all.map(([x, y, w, h], i) => (
          <rect key={i} x={x - 1} y={y - 1} width={w + 2} height={h + 2} />
        ))}
      </g>
      <g fill={trunkColor}>
        {TREE_TRUNK_PIXELS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g fill={color}>
        {TREE_CANOPY_PIXELS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  )
}

const HOUSE_ROOF_PIXELS: [number, number, number, number][] = [
  [7, 0, 4, 2],
  [5, 2, 8, 2],
  [3, 4, 12, 2],
]

const HOUSE_WALL_PIXELS: [number, number, number, number][] = [[3, 6, 12, 9]]

const HOUSE_DOOR_PIXELS: [number, number, number, number][] = [[8, 10, 3, 5]]

const HOUSE_WINDOW_PIXELS: [number, number, number, number][] = [
  [5, 9, 3, 3],
  [11, 9, 3, 3],
]

export function PixelHouse({
  size = 80,
  roofColor = '#E5527A',
  wallColor = '#FFFDF6',
  doorColor = '#8A5A32',
  windowColor = '#FFC531',
  outline = '#1B1B2F',
}: {
  size?: number
  roofColor?: string
  wallColor?: string
  doorColor?: string
  windowColor?: string
  outline?: string
}) {
  const all = [...HOUSE_ROOF_PIXELS, ...HOUSE_WALL_PIXELS, ...HOUSE_DOOR_PIXELS, ...HOUSE_WINDOW_PIXELS]
  return (
    <svg width={size} height={size} viewBox="-2 -2 20 20" shapeRendering="crispEdges">
      <g fill={outline}>
        {all.map(([x, y, w, h], i) => (
          <rect key={i} x={x - 1} y={y - 1} width={w + 2} height={h + 2} />
        ))}
      </g>
      <g fill={roofColor}>
        {HOUSE_ROOF_PIXELS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g fill={wallColor}>
        {HOUSE_WALL_PIXELS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g fill={windowColor}>
        {HOUSE_WINDOW_PIXELS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g fill={doorColor}>
        {HOUSE_DOOR_PIXELS.map(([x, y, w, h], i) => (
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
