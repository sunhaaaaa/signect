import styled from 'styled-components'
import { GameShell } from './GameShell'

const Prompt = styled.div`
  text-align: center;
  padding: 40px 0;
`

const Word = styled.h2`
  font-size: 32px;
  margin: 0 0 8px;
`

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
`

export default function WordQuiz() {
  return (
    <GameShell
      title="맞춤형 단어 퀴즈"
      board={
        <Prompt>
          <Word>안녕하세요</Word>
          <Sub>내 단어장에 저장된 단어로 퀴즈가 출제됩니다</Sub>
        </Prompt>
      }
    />
  )
}
