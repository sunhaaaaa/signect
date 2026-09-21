import styled, { css } from 'styled-components'

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'accent' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 18px;
  border: 3px solid ${({ theme }) => theme.colors.outline};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow:
    4px 4px 0 ${({ theme }) => theme.colors.outline},
    inset 2px 2px 0 rgba(255, 255, 255, 0.4),
    inset -2px -2px 0 rgba(0, 0, 0, 0.25);
  transition:
    transform 0.06s steps(1),
    box-shadow 0.06s steps(1);

  &:active:not(:disabled) {
    transform: translate(4px, 4px);
    box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.25);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ theme, $variant = 'primary' }) => {
    if ($variant === 'secondary') {
      return css`
        background: ${theme.colors.surface};
        color: ${theme.colors.text};
      `
    }
    if ($variant === 'accent') {
      return css`
        background: ${theme.colors.accent};
        color: white;
      `
    }
    return css`
      background: ${theme.colors.primary};
      color: white;
    `
  }}
`
