import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/atoms/ThemeProvider'
import { BillingGate } from '@/features/billing/components/BillingGate'
import { TableSkeleton } from '@/shared/components/LoadingSkeleton'
import { MainLayout } from '@/shared/components/MainLayout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { LoginPage } from './features/auth/pages/LoginPage'

const DashboardPage = lazy(() =>
  import('./features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const CustomersPage = lazy(() =>
  import('./features/customers/pages/CustomersPage').then((m) => ({ default: m.CustomersPage })),
)
const VehiclesPage = lazy(() =>
  import('./features/vehicles/pages/VehiclesPage').then((m) => ({ default: m.VehiclesPage })),
)
const TrackersPage = lazy(() =>
  import('./features/trackers/pages/TrackersPage').then((m) => ({ default: m.TrackersPage })),
)
const ChipsPage = lazy(() =>
  import('./features/chips/pages/ChipsPage').then((m) => ({ default: m.ChipsPage })),
)
const TeamPage = lazy(() =>
  import('./features/team/pages/TeamPage').then((m) => ({ default: m.TeamPage })),
)
const BillingPage = lazy(() =>
  import('./features/billing/pages/BillingPage').then((m) => ({ default: m.BillingPage })),
)

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <BillingGate>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                <Route
                  path="/dashboard"
                  element={
                    <Suspense fallback={<TableSkeleton />}>
                      <DashboardPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <Suspense fallback={<TableSkeleton />}>
                      <CustomersPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/vehicles"
                  element={
                    <Suspense fallback={<TableSkeleton />}>
                      <VehiclesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/trackers"
                  element={
                    <Suspense fallback={<TableSkeleton />}>
                      <TrackersPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/chips"
                  element={
                    <Suspense fallback={<TableSkeleton />}>
                      <ChipsPage />
                    </Suspense>
                  }
                />

                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route
                    path="/team"
                    element={
                      <Suspense fallback={<TableSkeleton />}>
                        <TeamPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/billing"
                    element={
                      <Suspense fallback={<TableSkeleton />}>
                        <BillingPage />
                      </Suspense>
                    }
                  />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BillingGate>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
