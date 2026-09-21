import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const blink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
`

const Hero = styled.section`
  text-align: center;
  padding: 48px 0 40px;
`

const Title = styled.h1`
  font-size: 36px;
  margin: 0 0 16px;
  color: ${({ theme }) => theme.colors.primaryDark};
  text-shadow: 4px 4px 0 ${({ theme }) => theme.colors.outline};
`

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 24px;
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
`

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 40px 0;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

const FeatureIcon = styled.div`
  width: 40px;
  height: 40px;
  clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%);
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.gold};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 18px;
`

const FeatureTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 13px;
`

const FeatureDesc = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.5;
`

const StepsCard = styled(Card)`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
`

const StepsLabel = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 12px;
`

const Step = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
`

const StepNum = styled.span`
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.accent};
  color: white;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const features = [
  {
    icon: '📷',
    title: 'AI 실시간 인식',
    desc: 'MediaPipe를 활용한 실시간 손동작 인식으로 정확한 수어를 학습할 수 있습니다.',
  },
  {
    icon: '🎮',
    title: '게임화된 학습',
    desc: '스도쿠, 꼬들 등 재미있는 게임으로 꾸준하게 복습할 수 있습니다.',
  },
  {
    icon: '📈',
    title: '학습 분석',
    desc: '개인화된 학습 리포트와 오답 노트로 효율적인 학습을 지원합니다.',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <>
      <Hero>
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
      </Hero>

      <FeatureGrid>
        {features.map((f) => (
          <Card key={f.title}>
            <FeatureIcon>{f.icon}</FeatureIcon>
            <FeatureTitle>{f.title}</FeatureTitle>
            <FeatureDesc>{f.desc}</FeatureDesc>
          </Card>
        ))}
      </FeatureGrid>

      <StepsCard>
        <StepsLabel>학습 과정</StepsLabel>
        <Step>
          <StepNum>1</StepNum>
          기초 학습 — 지문자(자음, 모음)와 지숫자(0-9) 학습
        </Step>
        <Step>
          <StepNum>2</StepNum>
          심화 학습 — 일상생활 필수 단어 및 문장 학습
        </Step>
      </StepsCard>
    </>
  )
}
