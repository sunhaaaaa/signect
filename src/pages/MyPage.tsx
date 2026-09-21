import styled from 'styled-components'
import { Card, AccentCard } from '../components/ui/Card'

const Title = styled.h1`
  font-size: 18px;
  margin: 0 0 20px;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`

const StatCard = styled.div<{ $bg: string; $fg: string }>`
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  border: 3px solid ${({ theme }) => theme.colors.outline};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  padding: 18px;
`

const StatLabel = styled.div`
  font-size: 11px;
  opacity: 0.9;
`

const StatValue = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 20px;
  margin: 8px 0 4px;
`

const StatHint = styled.div`
  font-size: 11px;
  opacity: 0.7;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`

const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`

const ChartPlaceholder = styled.div`
  height: 120px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: repeating-linear-gradient(
    45deg,
    ${({ theme }) => theme.colors.bg},
    ${({ theme }) => theme.colors.bg} 10px,
    #e3f1ff 10px,
    #e3f1ff 20px
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  margin-bottom: 16px;
`

const MiniStats = styled.div`
  display: flex;
  justify-content: space-around;
  text-align: center;
`

const MiniValue = styled.div`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 15px;
`

const MiniLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const WordRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }
`

const stats = [
  { label: '연속 학습', value: '12일', hint: '오늘까지 꾸준히 학습하고 있어요', bg: '#3B82F6', fg: '#fff' },
  { label: '학습한 단어', value: '156개', hint: '지난 주에 23개 추가', bg: '#3CB043', fg: '#fff' },
  { label: '총 학습 시간', value: '18시간', hint: '이번 달 누적 시간', bg: '#FFC531', fg: '#1B1B2F' },
]

const miniStats = [
  { value: '45분', label: '주간 평균' },
  { value: '89%', label: '정답률' },
  { value: '23', label: '새단어' },
]

const words = [
  { word: '안녕하세요', updated: '2일 전' },
  { word: '감사합니다', updated: '3일 전' },
  { word: '가족', updated: '5일 전' },
  { word: '친구', updated: '5일 전' },
]

export default function MyPage() {
  return (
    <>
      <Title>마이페이지</Title>

      <StatsRow>
        {stats.map((s) => (
          <StatCard key={s.label} $bg={s.bg} $fg={s.fg}>
            <StatLabel>{s.label}</StatLabel>
            <StatValue>{s.value}</StatValue>
            <StatHint>{s.hint}</StatHint>
          </StatCard>
        ))}
      </StatsRow>

      <Grid>
        <Card>
          <CardHead>
            <strong>학습 리포트</strong>
            <span style={{ fontSize: 12, color: '#6B7290' }}>상세 보기</span>
          </CardHead>
          <ChartPlaceholder>주간 학습 시간 차트</ChartPlaceholder>
          <MiniStats>
            {miniStats.map((m) => (
              <div key={m.label}>
                <MiniValue>{m.value}</MiniValue>
                <MiniLabel>{m.label}</MiniLabel>
              </div>
            ))}
          </MiniStats>
        </Card>

        <Card>
          <CardHead>
            <strong>개인 단어장</strong>
            <span style={{ fontSize: 12, color: '#6B7290' }}>14개</span>
          </CardHead>
          {words.map((w) => (
            <WordRow key={w.word}>
              <span>{w.word}</span>
              <span style={{ color: '#6B7290' }}>{w.updated}</span>
            </WordRow>
          ))}
        </Card>
      </Grid>

      <div style={{ marginTop: 20 }}>
        <AccentCard $accent="success">
          <strong>업적</strong>
          <p style={{ color: '#6B7290', fontSize: 13, marginTop: 8 }}>
            달성한 배지와 진행 중인 도전 과제가 여기에 표시됩니다.
          </p>
        </AccentCard>
      </div>
    </>
  )
}
