import styled from 'styled-components'

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 3px solid ${({ theme }) => theme.colors.outline};
  box-shadow:
    5px 5px 0 ${({ theme }) => theme.colors.outline},
    inset 2px 2px 0 rgba(255, 255, 255, 0.5),
    inset -2px -2px 0 rgba(0, 0, 0, 0.08);
  padding: 20px;
`

export const AccentCard = styled(Card)<{ $accent?: 'primary' | 'success' }>`
  border-left-width: 8px;
  border-left-color: ${({ theme, $accent }) =>
    $accent === 'success' ? theme.colors.accent : theme.colors.primary};
`
