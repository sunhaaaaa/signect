import styled from 'styled-components'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'

const Main = styled.main`
  max-width: 1120px;
  margin: 0 auto;
  padding: 40px 32px 80px;
`

export function Layout() {
  return (
    <>
      <Header />
      <Main>
        <Outlet />
      </Main>
    </>
  )
}
