import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HomePage } from './pages/HomePage'
import { EvaluationPage } from './pages/EvaluationPage'
import { ResultsPage } from './pages/ResultsPage'
import { SearchPage } from './pages/SearchPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="/results/:id" element={<ResultsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
