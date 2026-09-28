import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { PixelMascot } from '../brand/PixelMascot'
import { useSignReferences } from '../../hooks/useSignReferences'
import { loadProgress, type ProgressData } from '../../lib/progressStore'
import { buildLevelPath } from '../../lib/levelPath'
import { resolveEquippedItems } from '../../lib/mascotItems'

const Bar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 32px;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 4px solid ${({ theme }) => theme.colors.outline};

  @media (max-width: 480px) {
    padding: 10px 16px;
  }
`

const BackNavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 900;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadow.cardSm};
  transition: transform 0.06s steps(1), box-shadow 0.06s steps(1);

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
`

const Logo = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text};
`

const Mark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const Nav = styled.nav`
  display: flex;
  gap: 8px;

  @media (max-width: 480px) {
    gap: 4px;
  }
`

const NavItem = styled(NavLink)`
  padding: 8px 12px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 12px;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textMuted};
  border: 3px solid transparent;

  &.active {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.gold};
    border-color: ${({ theme }) => theme.colors.outline};
  }

  @media (max-width: 480px) {
    padding: 6px 8px;
    font-size: 11px;
  }
`

export function Header() {
  const { references } = useSignReferences()
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  const level = useMemo(
    () => (progress ? buildLevelPath(references, progress).level : 0),
    [references, progress],
  )
  const equippedColor = resolveEquippedItems(progress?.equippedMascotItems, level).palette.value

  return (
    <Bar>
      {location.pathname === '/' ? (
        <Logo to="/" aria-label="Signect">
          <Mark>
            <PixelMascot size={34} handColor={equippedColor} />
          </Mark>
        </Logo>
      ) : (
        <BackNavButton aria-label="뒤로가기" onClick={() => navigate(-1)}>
          ←
        </BackNavButton>
      )}
      <Nav>
        <NavItem to="/" end>
          홈
        </NavItem>
        <NavItem to="/dictionary">수어사전</NavItem>
        <NavItem to="/learn">학습하기</NavItem>
        <NavItem to="/games">게임</NavItem>
        <NavItem to="/mypage">마이페이지</NavItem>
      </Nav>
    </Bar>
  )
}
