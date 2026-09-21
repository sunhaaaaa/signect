import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { theme } from './styles/theme'
import { GlobalStyle } from './styles/GlobalStyle'
import { Layout } from './components/layout/Layout'
import Home from './pages/Home'
import Learn from './pages/Learn'
import MyPage from './pages/MyPage'
import GamesHome from './pages/games/GamesHome'
import SignSudoku from './pages/games/SignSudoku'
import SignKkoddle from './pages/games/SignKkoddle'
import WordQuiz from './pages/games/WordQuiz'
import CaptureReference from './pages/dev/CaptureReference'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/games" element={<GamesHome />} />
            <Route path="/games/sign-sudoku" element={<SignSudoku />} />
            <Route path="/games/sign-kkoddle" element={<SignKkoddle />} />
            <Route path="/games/word-quiz" element={<WordQuiz />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/dev/capture" element={<CaptureReference />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
