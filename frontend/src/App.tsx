import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingSpinner } from './components/common/LoadingSpinner'

const HomePage = lazy(() => import('./pages/HomePage'))
const EvaluationPage = lazy(() => import('./pages/EvaluationPage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const PartnerApiGuidePage = lazy(() => import('./pages/PartnerApiGuidePage'))
const PartnerDashboardPage = lazy(() => import('./pages/PartnerDashboardPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen-75">
              <LoadingSpinner size="lg" text="Loading..." />
            </div>
          }>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/evaluation" element={<EvaluationPage />} />
              <Route path="/results/:id" element={<ResultsPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/partner-api-guide" element={<PartnerApiGuidePage />} />
              <Route path="/partner-dashboard" element={<PartnerDashboardPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
