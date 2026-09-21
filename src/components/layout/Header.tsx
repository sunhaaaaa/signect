import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import { PixelLogoMark } from './PixelLogoMark'

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

const Logo = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
`

const Mark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%);
  border: 3px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.gold};
  color: ${({ theme }) => theme.colors.outline};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 13px;
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
  font-size: 10px;
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
    font-size: 9px;
  }
`

export function Header() {
  return (
    <Bar>
      <Logo to="/">
        <Mark>
          <PixelLogoMark size={13} />
        </Mark>
        Signect
      </Logo>
      <Nav>
        <NavItem to="/" end>
          홈
        </NavItem>
        <NavItem to="/learn">학습하기</NavItem>
        <NavItem to="/games">게임</NavItem>
        <NavItem to="/mypage">마이페이지</NavItem>
      </Nav>
    </Bar>
  )
}
