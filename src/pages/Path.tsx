import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useSignReferences } from '../hooks/useSignReferences'
import { buildLevelPath } from '../lib/levelPath'
import { loadProgress, type ProgressData } from '../lib/progressStore'

const LevelBig = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: clamp(32px, 9vw, 56px);
  text-align: center;
  color: ${({ theme }) => theme.colors.primaryDark};
  text-shadow: 4px 4px 0 ${({ theme }) => theme.colors.outline};
  margin: 8px 0 28px;
`

const PathTrack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0 40px;
`

const PathRowWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const PathConnector = styled.div<{ $filled: boolean }>`
  width: 4px;
  height: 22px;
  background: ${({ theme, $filled }) => ($filled ? theme.colors.accent : theme.colors.border)};
`

const NodeWrap = styled.div`
  position: relative;
`

const PathNodeButton = styled.button<{ $state: 'done' | 'current' | 'locked' }>`
  position: relative;
  width: 66px;
  height: 66px;
  flex-shrink: 0;
  clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%);
  border: 3px solid ${({ theme }) => theme.colors.outline};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 20px;
  background: ${({ theme, $state }) =>
    $state === 'done' ? theme.colors.accent : $state === 'current' ? theme.colors.gold : theme.colors.surface};
  color: ${({ theme, $state }) => ($state === 'done' ? '#fff' : theme.colors.outline)};
  box-shadow: ${({ theme, $state }) => ($state === 'locked' ? 'none' : theme.shadow.cardSm)};
  opacity: ${({ $state }) => ($state === 'locked' ? 0.45 : 1)};
  cursor: ${({ $state }) => ($state === 'locked' ? 'not-allowed' : 'pointer')};
  transition:
    transform 0.06s steps(1),
    box-shadow 0.06s steps(1);

  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
`

// NOT a child of PathNodeButton — that button's clip-path clips its own
// content box, so a badge positioned outside its bounds would get cut off.
// Sits on NodeWrap instead, which isn't clipped.
const DoneBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.success};
  border: 2px solid ${({ theme }) => theme.colors.outline};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #fff;
`

const MoreNote = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  margin: 8px 0 0;
`

// Rendering all ~500 nodes at once is wasted work for a path the learner
// walks linearly — show recent history behind + a solid run ahead instead.
const BEHIND = 3
const AHEAD = 20

export default function Path() {
  const navigate = useNavigate()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { references, isLoading: isReferencesLoading } = useSignReferences()
  const [progress, setProgress] = useState<ProgressData | null>(null)

  useEffect(() => {
    if (!isAuthLoading && !user) navigate('/login', { replace: true })
  }, [isAuthLoading, user, navigate])

  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  const levelPath = useMemo(
    () => (progress ? buildLevelPath(references, progress) : null),
    [references, progress],
  )

  if (isAuthLoading || !user || isReferencesLoading || !levelPath) {
    return (
      <Card>
        <p style={{ color: '#6B7290', fontSize: 13 }}>학습 경로를 불러오는 중...</p>
      </Card>
    )
  }

  const start = Math.max(0, levelPath.currentIndex - BEHIND)
  const end = Math.min(levelPath.nodes.length, levelPath.currentIndex + AHEAD)
  const visible = levelPath.nodes.slice(start, end)
  const remaining = levelPath.nodes.length - end

  return (
    <>
      <LevelBig>Lv.{levelPath.level}</LevelBig>

      <Card>
        <PathTrack>
          {visible.map((node, i) => {
            const globalIndex = start + i
            const state: 'done' | 'current' | 'locked' =
              node.done ? 'done' : globalIndex === levelPath.currentIndex ? 'current' : 'locked'
            const clickable = state !== 'locked'
            const offset = [0, 46, 0, -46][globalIndex % 4]

            return (
              <PathRowWrap key={node.id}>
                {i > 0 && <PathConnector $filled={visible[i - 1].done} />}
                <div style={{ transform: `translateX(${offset}px)`, marginBottom: 24 }}>
                  <NodeWrap>
                    <PathNodeButton
                      type="button"
                      $state={state}
                      disabled={!clickable}
                      onClick={() => clickable && navigate(`/lesson/${node.index}`)}
                      title={clickable ? `레슨 ${node.index} 시작하기` : '이전 레슨을 먼저 완료하세요'}
                    >
                      {node.index}
                    </PathNodeButton>
                    {state === 'done' && <DoneBadge>✓</DoneBadge>}
                  </NodeWrap>
                </div>
              </PathRowWrap>
            )
          })}
          {remaining > 0 && <MoreNote>+ {remaining}개 레슨 더 (계속 진행하면 나타납니다)</MoreNote>}
        </PathTrack>
      </Card>
    </>
  )
}
