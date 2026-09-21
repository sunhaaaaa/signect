import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'

const Back = styled(Link)`
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
  display: inline-block;
  margin-bottom: 16px;
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 20px;
`

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.primaryDark};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`

const CameraBox = styled.div`
  aspect-ratio: 4 / 3;
  background: #0d1020;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa0c3;
  font-size: 13px;
`

export function GameShell({
  title,
  actions,
  board,
  camera,
  children,
}: {
  title: string
  actions?: React.ReactNode
  board: React.ReactNode
  /** Overrides the default static camera placeholder with a real camera panel. */
  camera?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <>
      <Back to="/games">← 게임 목록으로 돌아가기</Back>
      <TitleRow>
        <Title>{title}</Title>
        {actions}
      </TitleRow>
      <Grid>
        <Card>{board}</Card>
        <div>
          {camera ?? (
            <Card>
              <CameraBox>📷 카메라</CameraBox>
            </Card>
          )}
          {children}
        </div>
      </Grid>
    </>
  )
}
