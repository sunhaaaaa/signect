import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
`

const Title = styled.h1`
  font-size: 22px;
  margin: 0 0 12px;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`

const GameIcon = styled.div<{ $bg: string }>`
  width: 40px;
  height: 40px;
  clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%);
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 18px;
`

const GameTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 13px;
`

const GameDesc = styled.p`
  margin: 0 0 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Difficulty = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  display: block;
  margin-bottom: 12px;
`

const StatsCard = styled(Card)`
  margin-top: 24px;
  display: flex;
  justify-content: space-around;
  text-align: center;
`

const StatNum = styled.div<{ $color: string }>`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 20px;
  color: ${({ $color }) => $color};
`

const StatLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 4px;
`

const games = [
  {
    icon: '🔢',
    bg: '#BFDBFE',
    title: '지숫자 스도쿠',
    desc: '수어 숫자를 입력하여 스도쿠를 풀어보세요',
    difficulty: '난이도: 쉬움 - 어려움',
    path: '/games/sign-sudoku',
    variant: 'primary' as const,
  },
  {
    icon: '💬',
    bg: '#BBF0C4',
    title: '수어 꼬들',
    desc: '지문자로 단어를 맞추는 게임',
    difficulty: '난이도: 보통',
    path: '/games/sign-kkoddle',
    variant: 'accent' as const,
  },
  {
    icon: '🧩',
    bg: '#FFE9A8',
    title: '맞춤형 단어 퀴즈',
    desc: '나만의 단어장으로 복습하기',
    difficulty: '난이도: 보통',
    path: '/games/word-quiz',
    variant: 'secondary' as const,
  },
]

const stats = [
  { value: 12, label: '스도쿠 클리어', color: '#3B82F6' },
  { value: 8, label: '꼬들 성공', color: '#3CB043' },
  { value: 156, label: '퀴즈 정답', color: '#C98A0C' },
]

export default function GamesHome() {
  const navigate = useNavigate()

  return (
    <>
      <Header>
        <Title>게임으로 복습하기</Title>
        <Sub>게임을 통해 배운 수어를 복습하고 실력을 향상시키세요</Sub>
      </Header>

      <Grid>
        {games.map((g) => (
          <Card key={g.title}>
            <GameIcon $bg={g.bg}>{g.icon}</GameIcon>
            <GameTitle>{g.title}</GameTitle>
            <GameDesc>{g.desc}</GameDesc>
            <Difficulty>{g.difficulty}</Difficulty>
            <Button $variant={g.variant} style={{ width: '100%' }} onClick={() => navigate(g.path)}>
              게임 시작 →
            </Button>
          </Card>
        ))}
      </Grid>

      <StatsCard>
        {stats.map((s) => (
          <div key={s.label}>
            <StatNum $color={s.color}>{s.value}</StatNum>
            <StatLabel>{s.label}</StatLabel>
          </div>
        ))}
      </StatsCard>
    </>
  )
}
