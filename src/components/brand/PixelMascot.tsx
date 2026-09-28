// "시니" (Sini) — Signect's mascot: a friendly open hand with a face, on a
// 16x18 grid. Rendered as layered rect groups (shadow → outline → fill →
// face) so it matches the app's hard-shadow / thick-outline pixel style. At
// icon sizes (header badge, favicon) the face and outline read as noise, so
// `simple` renders just the hand silhouette instead.
//
// `variant="full"` extends the same hand/face as a head onto a full body
// (torso, arms, legs) with equippable hat/necklace/outfit layers, used by
// the mascot-customization panel — see lib/mascotItems.ts for the item data.
type Rect = [number, number, number, number]

const HAND_PIXELS: Rect[] = [
  [7, 0, 2, 9], // middle finger
  [4, 2, 2, 7], // index finger
  [10, 2, 2, 7], // ring finger
  [13, 4, 2, 5], // pinky
  [0, 7, 3, 4], // thumb
  [2, 8, 12, 8], // palm
]

const FACE_PIXELS: Rect[] = [
  [5, 10, 2, 2], // left eye
  [9, 10, 2, 2], // right eye
  [6, 13, 4, 1], // smile
]

// --- full-body extension, same 16-wide grid, placed below the head ---
// 1px gaps between torso/arms and between the two legs so each limb gets its
// own outline seam (the outline is the union silhouette expanded by 1 — with
// zero gap, adjacent parts fuse into one undifferentiated blob).
const TORSO_PIXELS: Rect[] = [[5, 17, 6, 8]]
const ARM_PIXELS: Rect[] = [
  [1, 18, 3, 6], // left arm
  [12, 18, 3, 6], // right arm
]
const LEG_PIXELS: Rect[] = [
  [4, 25, 3, 7], // left leg
  [9, 25, 3, 7], // right leg
]
const BODY_PIXELS: Rect[] = [...TORSO_PIXELS, ...ARM_PIXELS, ...LEG_PIXELS]

// Torso/arms share the head's skin tone (`handColor`) — not part of the
// customizable "outfit" slot. `outfitColor` colors only the legs (shorts),
// see lib/mascotItems.ts.

export type HatId = 'none' | 'beanie' | 'ribbon' | 'crown'
export type NecklaceId = 'none' | 'chain' | 'pendant'

const HATS: Record<Exclude<HatId, 'none'>, { pixels: Rect[]; color: string }> = {
  beanie: { pixels: [[5, -4, 6, 4], [4, -1, 8, 1]], color: '#3B82F6' },
  ribbon: {
    pixels: [
      [5, -3, 3, 3],
      [8, -3, 3, 3],
      [7, -2, 2, 2],
    ],
    color: '#E5527A',
  },
  crown: {
    pixels: [
      [4, -2, 8, 2],
      [4, -4, 2, 2],
      [7, -5, 2, 3],
      [10, -4, 2, 2],
    ],
    color: '#FFC531',
  },
}

const NECKLACES: Record<Exclude<NecklaceId, 'none'>, { pixels: Rect[]; color: string }> = {
  chain: { pixels: [[5, 17, 6, 1]], color: '#C9D6E3' },
  pendant: {
    pixels: [
      [5, 17, 6, 1],
      [7, 18, 2, 2],
    ],
    color: '#FFC531',
  },
}

function expand(rects: Rect[], n = 1): Rect[] {
  return rects.map(([x, y, w, h]) => [x - n, y - n, w + 2 * n, h + 2 * n] as Rect)
}

function RectGroup({ rects, fill }: { rects: Rect[]; fill: string }) {
  return (
    <g fill={fill}>
      {rects.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} />
      ))}
    </g>
  )
}

export function PixelMascot({
  size = 96,
  handColor = '#FFC531',
  outlineColor = '#1B1B2F',
  simple = false,
  variant = 'icon',
  outfitColor = '#E5383B',
  hat = 'none',
  necklace = 'none',
}: {
  size?: number
  handColor?: string
  outlineColor?: string
  /** Silhouette only — no shadow/outline/face. For small icon contexts (header badge, favicon). Ignored when variant="full". */
  simple?: boolean
  /** "icon" (default): head/hand only, matches existing usage. "full": whole body + equipment. */
  variant?: 'icon' | 'full'
  /** Shorts color (legs only) — torso/arms follow `handColor` instead. */
  outfitColor?: string
  hat?: HatId
  necklace?: NecklaceId
}) {
  if (variant === 'full') {
    const bodyOutline = expand([...HAND_PIXELS, ...BODY_PIXELS])
    return (
      <svg
        width={(size * 16) / 34}
        height={size}
        viewBox="-2 -7 20 41"
        shapeRendering="crispEdges"
        role="img"
        aria-label="시니"
      >
        <g transform="translate(0.8,0.8)" fill="#00000040">
          {[...HAND_PIXELS, ...BODY_PIXELS].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} />
          ))}
        </g>
        <RectGroup rects={bodyOutline} fill={outlineColor} />
        <RectGroup rects={ARM_PIXELS} fill={handColor} />
        <RectGroup rects={TORSO_PIXELS} fill={handColor} />
        <RectGroup rects={LEG_PIXELS} fill={outfitColor} />
        <RectGroup rects={HAND_PIXELS} fill={handColor} />
        <RectGroup rects={FACE_PIXELS} fill={outlineColor} />
        {hat !== 'none' && (
          <>
            <RectGroup rects={expand(HATS[hat].pixels)} fill={outlineColor} />
            <RectGroup rects={HATS[hat].pixels} fill={HATS[hat].color} />
          </>
        )}
        {necklace !== 'none' && <RectGroup rects={NECKLACES[necklace].pixels} fill={NECKLACES[necklace].color} />}
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={(size * 18) / 16}
      viewBox="0 0 16 18"
      shapeRendering="crispEdges"
      role="img"
      aria-label="시니"
    >
      {!simple && (
        <g transform="translate(0.8,0.8)" fill="#00000040">
          {HAND_PIXELS.map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} />
          ))}
        </g>
      )}
      {!simple && (
        <g fill={outlineColor}>
          <rect x={6} y={-1} width={4} height={11} />
          <rect x={3} y={1} width={4} height={9} />
          <rect x={9} y={1} width={4} height={9} />
          <rect x={12} y={3} width={4} height={7} />
          <rect x={-1} y={6} width={5} height={6} />
          <rect x={1} y={7} width={14} height={10} />
        </g>
      )}
      <g fill={handColor}>
        {HAND_PIXELS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      {!simple && (
        <g fill={outlineColor}>
          {FACE_PIXELS.map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} />
          ))}
        </g>
      )}
    </svg>
  )
}
