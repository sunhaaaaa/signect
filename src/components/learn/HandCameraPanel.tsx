import type { RefObject } from 'react'
import styled from 'styled-components'
import { Button } from '../ui/Button'

const Box = styled.div<{ $status: 'idle' | 'correct' | 'incorrect' }>`
  position: relative;
  aspect-ratio: 4 / 3;
  background: #0d1020;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid
    ${({ $status, theme }) =>
      $status === 'correct'
        ? theme.colors.success
        : $status === 'incorrect'
          ? theme.colors.error
          : theme.colors.outline};
  transition: border-color 0.15s steps(1);
`

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
`

const LandmarkCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
  pointer-events: none;
`

const LiveBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  background: ${({ theme }) => theme.colors.error};
  border: 2px solid ${({ theme }) => theme.colors.outline};
  color: white;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 9px;
  padding: 4px 8px;
`

const StatusBadge = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.55);
  border: 2px solid ${({ theme }) => theme.colors.outline};
  color: #f1f1f5;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
`

const FooterBadgeSlot = styled.div`
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 2;
`

const Placeholder = styled.div`
  color: #9aa0c3;
  font-size: 13px;
  text-align: center;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

interface HandCameraPanelProps {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  isActive: boolean
  error: string | null
  onStart: () => void
  statusText?: string
  footer?: React.ReactNode
  borderStatus?: 'idle' | 'correct' | 'incorrect'
}

/** Reusable webcam + hand-landmark overlay panel, shared by Learn and the sign-input games. */
export function HandCameraPanel({
  videoRef,
  canvasRef,
  isActive,
  error,
  onStart,
  statusText,
  footer,
  borderStatus = 'idle',
}: HandCameraPanelProps) {
  return (
    <Box $status={isActive ? borderStatus : 'idle'}>
      {isActive && <LiveBadge>● LIVE</LiveBadge>}
      {isActive && statusText && <StatusBadge>{statusText}</StatusBadge>}
      <Video ref={videoRef} autoPlay playsInline muted style={{ display: isActive ? 'block' : 'none' }} />
      <LandmarkCanvas ref={canvasRef} />
      {!isActive && (
        <Placeholder>
          <span>{error ?? '카메라를 켜고 손 모양으로 입력해보세요'}</span>
          <Button onClick={onStart}>카메라 시작</Button>
        </Placeholder>
      )}
      {isActive && footer && <FooterBadgeSlot>{footer}</FooterBadgeSlot>}
    </Box>
  )
}
