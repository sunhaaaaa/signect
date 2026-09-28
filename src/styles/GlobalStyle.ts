import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.body};
    background-color: ${({ theme }) => theme.colors.bg};
    background-image:
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.06) 0px, rgba(255, 255, 255, 0.06) 1px, transparent 1px, transparent 4px),
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0px, rgba(255, 255, 255, 0.06) 1px, transparent 1px, transparent 4px);
    background-attachment: fixed;
    color: ${({ theme }) => theme.colors.text};
    image-rendering: pixelated;
  }

  h1, h2, h3 {
    font-family: ${({ theme }) => theme.fonts.heading};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.6;
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  ::selection {
    background: ${({ theme }) => theme.colors.gold};
    color: ${({ theme }) => theme.colors.outline};
  }
`
