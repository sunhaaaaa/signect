import type { HatId, NecklaceId } from '../components/brand/PixelMascot'

// Unlockable mascot ("시니") customization, tied to the level path in lib/levelPath.ts.
// Four independent slots — palette (head/hand color), outfit (torso/arm/leg
// color), hat, necklace — each with its own unlock levels.
export type MascotSlot = 'palette' | 'outfit' | 'hat' | 'necklace'

export interface MascotItem {
  id: string
  slot: MascotSlot
  label: string
  /** Level (see lib/levelPath.ts) at which this item unlocks. 0 = always available. */
  unlockLevel: number
  /** Hex color for palette/outfit slots; sprite key for hat/necklace slots. */
  value: string
}

export const MASCOT_ITEMS: MascotItem[] = [
  { id: 'palette-default', slot: 'palette', label: '기본 노랑', unlockLevel: 0, value: '#FFC531' },
  { id: 'palette-sky', slot: 'palette', label: '하늘색', unlockLevel: 1, value: '#3B82F6' },
  { id: 'palette-mint', slot: 'palette', label: '민트', unlockLevel: 3, value: '#3CB043' },
  { id: 'palette-cherry', slot: 'palette', label: '체리핑크', unlockLevel: 5, value: '#E5527A' },
  { id: 'palette-amber', slot: 'palette', label: '앰버골드', unlockLevel: 8, value: '#C98A0C' },
  { id: 'palette-violet', slot: 'palette', label: '바이올렛', unlockLevel: 12, value: '#7132A8' },

  { id: 'outfit-default', slot: 'outfit', label: '기본', unlockLevel: 0, value: '#E7ECFB' },
  { id: 'outfit-tshirt', slot: 'outfit', label: '티셔츠', unlockLevel: 2, value: '#3CB043' },
  { id: 'outfit-hoodie', slot: 'outfit', label: '후드', unlockLevel: 6, value: '#3B82F6' },
  { id: 'outfit-suit', slot: 'outfit', label: '정장', unlockLevel: 11, value: '#1B1B2F' },

  { id: 'hat-none', slot: 'hat', label: '없음', unlockLevel: 0, value: 'none' },
  { id: 'hat-beanie', slot: 'hat', label: '비니', unlockLevel: 2, value: 'beanie' },
  { id: 'hat-ribbon', slot: 'hat', label: '리본', unlockLevel: 4, value: 'ribbon' },
  { id: 'hat-crown', slot: 'hat', label: '왕관', unlockLevel: 10, value: 'crown' },

  { id: 'necklace-none', slot: 'necklace', label: '없음', unlockLevel: 0, value: 'none' },
  { id: 'necklace-chain', slot: 'necklace', label: '목걸이', unlockLevel: 6, value: 'chain' },
  { id: 'necklace-pendant', slot: 'necklace', label: '펜던트', unlockLevel: 9, value: 'pendant' },
]

export const MASCOT_SLOTS: { slot: MascotSlot; label: string }[] = [
  { slot: 'palette', label: '피부색' },
  { slot: 'outfit', label: '옷' },
  { slot: 'hat', label: '모자' },
  { slot: 'necklace', label: '목걸이' },
]

export function itemsForSlot(slot: MascotSlot): MascotItem[] {
  return MASCOT_ITEMS.filter((i) => i.slot === slot)
}

export function isMascotItemUnlocked(item: MascotItem, level: number): boolean {
  return level >= item.unlockLevel
}

function defaultItemFor(slot: MascotSlot): MascotItem {
  return itemsForSlot(slot)[0]
}

/** Resolves what's actually equipped per slot, falling back to that slot's default if unequipped/invalid/locked. */
export function resolveEquippedItems(
  equipped: Record<string, string> | undefined,
  level: number,
): Record<MascotSlot, MascotItem> {
  const result = {} as Record<MascotSlot, MascotItem>
  for (const { slot } of MASCOT_SLOTS) {
    const equippedId = equipped?.[slot]
    const item = equippedId ? MASCOT_ITEMS.find((i) => i.id === equippedId && i.slot === slot) : undefined
    result[slot] = item && isMascotItemUnlocked(item, level) ? item : defaultItemFor(slot)
  }
  return result
}

export function resolvedToMascotProps(resolved: Record<MascotSlot, MascotItem>) {
  return {
    handColor: resolved.palette.value,
    outfitColor: resolved.outfit.value,
    hat: resolved.hat.value as HatId,
    necklace: resolved.necklace.value as NecklaceId,
  }
}
