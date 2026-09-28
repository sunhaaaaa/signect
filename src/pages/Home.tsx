import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PixelMascot } from '../components/brand/PixelMascot'
import { PixelCloud, PixelCoin, PixelBush, PixelFlower, PixelTree } from '../components/brand/PixelDecor'
import { useSignReferences } from '../hooks/useSignReferences'
import { loadProgress, type ProgressData } from '../lib/progressStore'
import { buildLevelPath } from '../lib/levelPath'
import { resolveEquippedItems, resolvedToMascotProps } from '../lib/mascotItems'

const blink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
`

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`

const walkBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`

const Screen = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px 0 90px;
  text-align: center;
  overflow: hidden;
`

const Sky = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
`

const Floaty = styled.div<{ $top?: string; $left?: string; $right?: string; $bottom?: string; $delay?: string }>`
  position: absolute;
  top: ${({ $top }) => $top ?? 'auto'};
  left: ${({ $left }) => $left ?? 'auto'};
  right: ${({ $right }) => $right ?? 'auto'};
  bottom: ${({ $bottom }) => $bottom ?? 'auto'};
  animation: ${float} 3.6s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay ?? '0s'};

  @media (max-width: 640px) {
    display: none;
  }
`

const Sparkle = styled.span<{ $size?: string }>`
  display: inline-block;
  font-size: ${({ $size }) => $size ?? '22px'};
  color: ${({ theme }) => theme.colors.gold};
  animation: ${blink} 1.3s steps(1) infinite;
`

const RoamLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
`

const RoamWrap = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
`

const RoamBob = styled.div<{ $flip: boolean }>`
  animation: ${walkBob} 0.5s ease-in-out infinite;
  transform: ${({ $flip }) => ($flip ? 'scaleX(-1)' : 'none')};
`

const Content = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Title = styled.h1`
  font-size: clamp(32px, 9vw, 56px);
  margin: 16px 0 28px;
  color: ${({ theme }) => theme.colors.primaryDark};
  text-shadow: 4px 4px 0 ${({ theme }) => theme.colors.outline};
`

const Star = styled.span`
  display: inline-block;
  color: ${({ theme }) => theme.colors.gold};
  animation: ${blink} 1.1s steps(1) infinite;
  text-shadow: none;
`

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`

const SearchForm = styled.form`
  display: flex;
  width: 100%;
  max-width: 420px;
  margin: 0 0 20px;
`

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 16px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  border-right: none;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    outline: none;
  }
`

const SearchButton = styled.button`
  flex-shrink: 0;
  padding: 0 18px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 13px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.gold};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  transition: transform 0.06s steps(1), box-shadow 0.06s steps(1);

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
`

const Ground = styled.div`
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background-repeat: repeat-x;
  background-size: 24px 40px;
  image-rendering: pixelated;
  background-image: ${({ theme }) => {
    const topProfile = '0,6 6,6 6,28 12,28 12,10 18,10 18,22 24,22'
    const fillPoints = `0,40 ${topProfile} 24,40`
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='40'><polygon points='${fillPoints}' fill='${theme.colors.accent}'/><polyline points='${topProfile}' fill='none' stroke='${theme.colors.outline}' stroke-width='1.5' stroke-linejoin='miter' /></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }};

  @media (max-width: 640px) {
    display: none;
  }
`

const TreeSpot = styled.div<{ $left?: string; $right?: string; $delay?: string }>`
  position: absolute;
  z-index: 1;
  bottom: 40px;
  left: ${({ $left }) => $left ?? 'auto'};
  right: ${({ $right }) => $right ?? 'auto'};
  animation: ${float} 4.2s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay ?? '0s'};

  @media (max-width: 900px) {
    display: none;
  }
`

const GroundDecorRow = styled.div`
  position: absolute;
  z-index: 1;
  bottom: 40px;
  left: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  padding: 0 4%;
  height: 44px;

  @media (max-width: 640px) {
    display: none;
  }
`

const MASCOT_W = 70
const MASCOT_H = 160
const ROAM_SPEED = 55 // px/sec

export default function Home() {
  const navigate = useNavigate()
  const { references } = useSignReferences()
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [flip, setFlip] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const roamStageRef = useRef<HTMLDivElement>(null)
  const roamWrapRef = useRef<HTMLDivElement>(null)

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    navigate(q ? `/dictionary?q=${encodeURIComponent(q)}` : '/dictionary')
  }

  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  useEffect(() => {
    const stage = roamStageRef.current
    const wrap = roamWrapRef.current
    if (!stage || !wrap) return

    const bounds = () => {
      const w = stage.clientWidth
      const h = stage.clientHeight
      return {
        minX: 0,
        maxX: Math.max(0, w - MASCOT_W),
        groundY: Math.max(0, h - MASCOT_H - 6),
      }
    }

    const pickTarget = () => {
      const b = bounds()
      return {
        x: b.minX + Math.random() * (b.maxX - b.minX),
        y: b.groundY,
      }
    }

    const startBounds = bounds()
    const pos = { x: (startBounds.minX + startBounds.maxX) / 2, y: startBounds.groundY }
    let target = pickTarget()
    setFlip(target.x < pos.x)
    let last = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const dx = target.x - pos.x
      const dy = target.y - pos.y
      const dist = Math.hypot(dx, dy)
      if (dist < 4) {
        target = pickTarget()
        setFlip(target.x < pos.x)
      } else {
        const step = Math.min(dist, ROAM_SPEED * dt)
        pos.x += (dx / dist) * step
        pos.y += (dy / dist) * step
      }
      wrap.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const level = useMemo(
    () => (progress ? buildLevelPath(references, progress).level : 0),
    [references, progress],
  )
  const mascotProps = resolvedToMascotProps(resolveEquippedItems(progress?.equippedMascotItems, level))

  return (
    <Screen>
      <Sky>
        <Floaty $top="4%" $left="6%">
          <PixelCloud size={72} />
        </Floaty>
        <Floaty $top="10%" $right="8%" $delay="0.6s">
          <PixelCloud size={50} />
        </Floaty>
        <Floaty $bottom="14%" $left="4%" $delay="1.2s">
          <PixelCloud size={44} />
        </Floaty>

        <Floaty $top="38%" $left="10%" $delay="1s">
          <PixelCoin size={26} />
        </Floaty>
        <Floaty $top="52%" $right="10%" $delay="0.3s">
          <PixelCoin size={30} face="♪" gold="#3CB043" />
        </Floaty>
        <Floaty $bottom="20%" $right="16%" $delay="0.8s">
          <PixelCoin size={24} face="♥" gold="#E5383B" />
        </Floaty>
        <Floaty $bottom="10%" $left="18%" $delay="1.6s">
          <PixelCoin size={22} face="✦" />
        </Floaty>

        <Floaty $top="24%" $left="26%" $delay="1.8s">
          <Sparkle $size="18px">✦</Sparkle>
        </Floaty>
        <Floaty $top="60%" $left="30%" $delay="0.5s">
          <Sparkle $size="14px">✦</Sparkle>
        </Floaty>
        <Floaty $top="18%" $right="26%" $delay="1.1s">
          <Sparkle $size="16px">✦</Sparkle>
        </Floaty>

        <Floaty $top="6%" $left="40%" $delay="0.9s">
          <PixelCloud size={38} />
        </Floaty>
        <Floaty $top="30%" $right="30%" $delay="1.4s">
          <PixelCloud size={34} />
        </Floaty>
        <Floaty $bottom="30%" $left="34%" $delay="0.4s">
          <Sparkle $size="12px">✦</Sparkle>
        </Floaty>
        <Floaty $top="44%" $left="18%" $delay="1.6s">
          <PixelCoin size={20} face="♬" gold="#3CB043" />
        </Floaty>
        <Floaty $top="16%" $left="16%" $delay="1.3s">
          <PixelCoin size={18} face="✦" />
        </Floaty>
        <Floaty $bottom="26%" $right="6%" $delay="1s">
          <PixelCoin size={22} face="★" />
        </Floaty>

        <Floaty $top="8%" $left="20%" $delay="0.7s">
          <Sparkle $size="14px">✦</Sparkle>
        </Floaty>
        <Floaty $top="4%" $right="18%" $delay="1.5s">
          <PixelCloud size={30} />
        </Floaty>
        <Floaty $bottom="42%" $left="24%" $delay="1.2s">
          <PixelCoin size={18} face="✦" gold="#3CB043" />
        </Floaty>
        <Floaty $bottom="40%" $right="22%" $delay="0.5s">
          <Sparkle $size="14px">✦</Sparkle>
        </Floaty>
        <Floaty $top="46%" $right="4%" $delay="1.7s">
          <PixelCloud size={26} />
        </Floaty>
      </Sky>

      <TreeSpot $left="1%" $delay="0.3s">
        <PixelTree size={130} />
      </TreeSpot>
      <TreeSpot $left="7%" $delay="1.1s">
        <PixelTree size={80} color="#237A2C" />
      </TreeSpot>
      <TreeSpot $right="1%" $delay="0.8s">
        <PixelTree size={150} />
      </TreeSpot>
      <TreeSpot $right="8%" $delay="1.6s">
        <PixelTree size={90} color="#237A2C" />
      </TreeSpot>
      <RoamLayer ref={roamStageRef}>
        <RoamWrap ref={roamWrapRef}>
          <RoamBob $flip={flip}>
            <PixelMascot size={150} variant="full" {...mascotProps} />
          </RoamBob>
        </RoamWrap>
      </RoamLayer>

      <Content>
        <Title>
          <Star>★</Star> Signect <Star>★</Star>
        </Title>

        <SearchForm onSubmit={handleSearchSubmit}>
          <SearchInput
            type="text"
            placeholder="궁금한 단어를 검색해보세요 (예: 가족, 감사)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchButton type="submit">검색</SearchButton>
        </SearchForm>

        <Actions>
          <Button onClick={() => navigate('/path')}>학습 시작하기 →</Button>
          <Button $variant="secondary" onClick={() => navigate('/games')}>
            게임 둘러보기
          </Button>
        </Actions>
      </Content>

      <GroundDecorRow>
        <PixelBush size={36} />
        <PixelFlower size={20} petalColor="#FFC531" />
        <PixelBush size={26} color="#237A2C" />
        <PixelFlower size={22} />
        <PixelBush size={40} />
        <PixelFlower size={18} petalColor="#3B82F6" />
        <PixelBush size={30} color="#237A2C" />
      </GroundDecorRow>
      <Ground />
    </Screen>
  )
}
