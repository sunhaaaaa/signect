import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PixelMascot } from '../components/brand/PixelMascot'
import { PixelCloud, PixelCoin } from '../components/brand/PixelDecor'

const blink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
`

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`

const Screen = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 0;
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

const Content = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Title = styled.h1`
  font-size: 36px;
  margin: 16px 0 8px;
  color: ${({ theme }) => theme.colors.primaryDark};
  text-shadow: 4px 4px 0 ${({ theme }) => theme.colors.outline};
`

const Star = styled.span`
  display: inline-block;
  color: ${({ theme }) => theme.colors.gold};
  animation: ${blink} 1.1s steps(1) infinite;
  text-shadow: none;
`

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 28px;
`

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`

const Ground = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 22px;
  margin-top: 36px;
  border-top: 4px solid ${({ theme }) => theme.colors.outline};
  background: repeating-linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.accent} 0 16px,
    ${({ theme }) => theme.colors.accentDark} 16px 32px
  );

  @media (max-width: 640px) {
    display: none;
  }
`

export default function Home() {
  const navigate = useNavigate()

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
      </Sky>

      <Content>
        <PixelMascot size={100} />
        <Title>
          <Star>★</Star> Signect <Star>★</Star>
        </Title>
        <Sub>Sign + Connect — AI 기반 수어 학습 플랫폼으로 즐겁게 배우고 연결하세요</Sub>

        <Actions>
          <Button onClick={() => navigate('/learn')}>학습 시작하기 →</Button>
          <Button $variant="secondary" onClick={() => navigate('/games')}>
            게임 둘러보기
          </Button>
        </Actions>
      </Content>

      <Ground />
    </Screen>
  )
}
