// Pixel-art glyphs for Learn/Dictionary topic badges, replacing default
// system emoji (🏢🍚🎨…) with the same rect-grid SVG technique as
// PixelMascot/PixelDecor, so every icon in the app is drawn, not borrowed.
// Each glyph is a flat list of [x, y, w, h] rects on a 10x10 grid.

export type PixelGlyphKind =
  | 'handOpen'
  | 'handFist'
  | 'book'
  | 'building'
  | 'people'
  | 'person'
  | 'bowl'
  | 'leaf'
  | 'palette'
  | 'heart'
  | 'clock'
  | 'scale'
  | 'basket'
  | 'run'
  | 'hash'
  | 'hand'
  | 'cross'
  | 'ball'
  | 'folder'
  | 'helpingHand'
  | 'graduationCap'

type Rect = [number, number, number, number]

const GLYPHS: Record<PixelGlyphKind, Rect[]> = {
  handOpen: [
    [3, 0, 1, 4],
    [4.5, 0, 1, 4],
    [6, 0.5, 1, 3.5],
    [1, 4, 2, 2],
    [1.5, 5, 6, 4],
  ],
  handFist: [
    [2, 2, 6, 2],
    [2, 4, 6, 4],
    [0, 5, 2, 2],
  ],
  book: [
    [1, 2, 3, 6],
    [6, 2, 3, 6],
    [4, 3, 2, 4],
  ],
  building: [
    [2, 1, 6, 8],
    [3, 2, 1, 1],
    [6, 2, 1, 1],
    [3, 4, 1, 1],
    [6, 4, 1, 1],
    [3, 6, 1, 1],
    [6, 6, 1, 1],
    [4, 7, 2, 2],
  ],
  people: [
    [1, 2, 2, 2],
    [0.5, 4, 3, 4],
    [6, 1, 2, 2],
    [5, 3, 4, 5],
  ],
  person: [
    [3, 1, 4, 3],
    [2, 4, 6, 5],
  ],
  bowl: [
    [2, 4, 6, 1],
    [1, 5, 8, 3],
    [3, 1, 1, 2],
    [5, 0, 1, 3],
    [6.5, 1, 1, 2],
  ],
  leaf: [
    [4, 1, 2, 1],
    [3, 2, 4, 1],
    [2, 3, 6, 2],
    [3, 5, 4, 1],
    [4, 6, 2, 1],
    [4.5, 7, 1, 2],
  ],
  palette: [
    [1, 3, 7, 5],
    [2, 2, 5, 1],
    [2, 4, 1, 1],
    [4, 3, 1, 1],
    [6, 4, 1, 1],
    [3, 6, 1, 1],
    [5.5, 6, 1, 1],
  ],
  heart: [
    [2, 2, 2, 1],
    [5, 2, 2, 1],
    [1, 3, 7, 2],
    [2, 5, 5, 1],
    [3, 6, 3, 1],
    [4, 7, 1, 1],
  ],
  clock: [
    [4, 1, 1, 1],
    [4, 2, 1, 2],
    [4, 4, 2, 1],
  ],
  scale: [
    [4.5, 1, 1, 7],
    [1, 2, 8, 1],
    [1, 3, 1, 1],
    [0, 4, 3, 1],
    [7, 3, 1, 1],
    [6, 4, 3, 1],
    [2, 8, 5, 1],
  ],
  basket: [
    [1, 4, 8, 4],
    [3, 1, 1, 3],
    [6, 1, 1, 3],
    [3, 1, 4, 1],
    [2, 5, 1, 2],
    [4, 5, 1, 2],
    [6, 5, 1, 2],
  ],
  run: [
    [4, 1, 2, 2],
    [4, 3, 2, 2],
    [6, 3, 2, 1],
    [6, 5, 2, 2],
    [2, 6, 2, 2],
  ],
  hash: [
    [2, 1, 1, 8],
    [6, 1, 1, 8],
    [1, 3, 8, 1],
    [1, 6, 8, 1],
  ],
  hand: [
    [3, 1, 1, 3],
    [4, 0, 1, 4],
    [5, 0, 1, 4],
    [6, 1, 1, 3],
    [2, 4, 5, 4],
    [0, 5, 2, 2],
  ],
  cross: [
    [4, 1, 2, 8],
    [1, 4, 8, 2],
  ],
  ball: [
    [4, 3, 2, 2],
    [2, 2, 2, 1],
    [6, 2, 2, 1],
    [2, 5, 2, 1],
    [6, 5, 2, 1],
  ],
  folder: [
    [1, 2, 3, 1],
    [1, 3, 8, 5],
  ],
  helpingHand: [
    [4, 2, 2, 2],
    [3, 3, 4, 2],
    [1, 5, 8, 3],
  ],
  graduationCap: [
    [0, 2, 10, 2],
    [3, 4, 4, 2],
    [8, 1, 1, 4],
  ],
}

/** Maps a Learn/Dictionary topic label (or 'intro:*' for the tab picker) to a glyph. */
export const TOPIC_ICON_KIND: Record<string, PixelGlyphKind> = {
  'intro:number': 'handOpen',
  'intro:letter': 'handFist',
  'intro:word': 'book',
  전체: 'book',
  '기관·장소': 'building',
  '가족·관계': 'people',
  '사람·직업': 'person',
  음식: 'bowl',
  '동물·자연': 'leaf',
  '색깔·외형': 'palette',
  '감정·상태': 'heart',
  '시간·날짜': 'clock',
  '학교·교육': 'graduationCap',
  '복지·장애': 'helpingHand',
  '사회·법률·행정': 'scale',
  '사물·생활': 'basket',
  '동작·묘사': 'run',
  '숫자·수량': 'hash',
  신체: 'hand',
  '건강·의료': 'cross',
  '스포츠·운동': 'ball',
  기타: 'folder',
}

export function PixelGlyph({ kind, color = 'currentColor' }: { kind: PixelGlyphKind; color?: string }) {
  return (
    <svg width="60%" height="60%" viewBox="0 0 10 10" shapeRendering="crispEdges">
      <g fill={color}>
        {GLYPHS[kind].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  )
}

/** Looks up the glyph for a topic label, falling back to the 'folder' (기타) glyph. */
export function topicGlyphKind(label: string): PixelGlyphKind {
  return TOPIC_ICON_KIND[label] ?? 'folder'
}
