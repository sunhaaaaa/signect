import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PixelMascot } from '../components/brand/PixelMascot'
import { useAuth } from '../hooks/useAuth'

const Screen = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 0;
`

const Title = styled.h1`
  font-size: 18px;
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const Panel = styled(Card)`
  margin-top: 24px;
  width: 100%;
  max-width: 340px;
  text-align: left;
`

const KakaoButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: #fee500;
  color: #191600;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 13px;
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  transition:
    transform 0.06s steps(1),
    box-shadow 0.06s steps(1);

  &:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const Notice = styled.p<{ $tone?: 'error' }>`
  margin: 12px 0 0;
  font-size: 14px;
  text-align: center;
  color: ${({ theme, $tone }) => ($tone === 'error' ? theme.colors.error : theme.colors.textMuted)};
`

export default function Login() {
  const navigate = useNavigate()
  const { user, isLoading, isFirebaseConfigured, signInWithKakao } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleKakaoLogin = async () => {
    setError(null)
    setIsSigningIn(true)
    try {
      await signInWithKakao()
      navigate('/mypage')
    } catch {
      setError('카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSigningIn(false)
    }
  }

  if (!isLoading && user) {
    return (
      <Screen>
        <PixelMascot size={72} />
        <Title>이미 로그인되어 있어요</Title>
        <Panel>
          <Button style={{ width: '100%' }} onClick={() => navigate('/mypage')}>
            마이페이지로 이동
          </Button>
        </Panel>
      </Screen>
    )
  }

  return (
    <Screen>
      <PixelMascot size={72} />
      <Title>로그인</Title>

      <Panel>
        <KakaoButton onClick={handleKakaoLogin} disabled={isSigningIn || !isFirebaseConfigured}>
          {isSigningIn ? '로그인 중...' : '카카오로 시작하기'}
        </KakaoButton>

        {error && <Notice $tone="error">{error}</Notice>}
        {!isFirebaseConfigured ? (
          <Notice $tone="error">아직 로그인 기능이 준비되지 않았어요.</Notice>
        ) : (
          <Notice>로그인하면 학습 기록이 기기와 상관없이 이어집니다.</Notice>
        )}
      </Panel>
    </Screen>
  )
}
