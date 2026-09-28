import styled from 'styled-components'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'

const Shell = styled.div<{ $lockHeight: boolean }>`
  display: flex;
  flex-direction: column;
  ${({ $lockHeight }) => ($lockHeight ? 'height: 100vh; overflow: hidden;' : 'min-height: 100vh;')}
`

const Main = styled.main<{ $flush: boolean }>`
  max-width: 1120px;
  margin: 0 auto;
  width: 100%;
  ${({ $flush }) =>
    $flush
      ? 'flex: 1; min-height: 0; overflow: hidden; padding: 0;'
      : 'padding: 40px 32px 80px;'}
`

export function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <Shell $lockHeight={isHome}>
      <Header />
      <Main $flush={isHome}>
        <Outlet />
      </Main>
    </Shell>
  )
}
