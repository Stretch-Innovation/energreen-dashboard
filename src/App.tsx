import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import DashboardOverview from '@/pages/DashboardOverview'
import CampaignPerformance from '@/pages/CampaignPerformance'
import SourceComparison from '@/pages/SourceComparison'
import FunnelView from '@/pages/FunnelView'
import BranchPerformance from '@/pages/BranchPerformance'
import PipelineForecast from '@/pages/PipelineForecast'
import SalesPerformance from '@/pages/SalesPerformance'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="campaigns" element={<CampaignPerformance />} />
            <Route path="sources" element={<SourceComparison />} />
            <Route path="funnel" element={<FunnelView />} />
            <Route path="branches" element={<BranchPerformance />} />
            <Route path="pipeline" element={<PipelineForecast />} />
            <Route path="sales" element={<SalesPerformance />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
