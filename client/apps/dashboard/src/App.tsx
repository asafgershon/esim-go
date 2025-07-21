import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApolloProvider } from '@apollo/client'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ErrorBoundary } from '@/components/error-boundary'
import { LoginPage } from '@/pages/login'
import { AuthCallbackPage } from '@/pages/auth/callback'
import { HomePage } from '@/pages/home'
import { UsersPage } from '@/pages/users'
import { OrdersPage } from '@/pages/orders'
import { BundlesPage } from '@/pages/bundles'
import { TripsPage } from '@/pages/trips'
import { PackageAssignmentPage } from '@/pages/package-assignment'
import PricingPage from '@/pages/pricing'
import { PricingSummaryPage } from '@/pages/pricing/summary'
import { PricingMarkupPage } from '@/pages/pricing/markup'
import { PricingSimulatorPage } from '@/pages/pricing/simulator'
import { PricingProcessingFeePage } from '@/pages/pricing/processing-fee'
import { apolloClient } from '@/lib/apollo-client'


const queryClient = new QueryClient()

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                  <Route path="users" element={<ErrorBoundary><ProtectedRoute requiredRole="ADMIN"><UsersPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="orders" element={<ErrorBoundary><ProtectedRoute requiredRole="ADMIN"><OrdersPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="bundles" element={<BundlesPage />} />
                  <Route path="trips" element={<ErrorBoundary><TripsPage /></ErrorBoundary>} />
                  <Route path="package-assignment" element={<ErrorBoundary><ProtectedRoute requiredRole="ADMIN"><PackageAssignmentPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="pricing" element={<ErrorBoundary><ProtectedRoute requiredRole="ADMIN"><PricingPage /></ProtectedRoute></ErrorBoundary>}>
                    <Route index element={<Navigate to="summary" replace />} />
                    <Route path="summary" element={<PricingSummaryPage />} />
                    <Route path="markup" element={<PricingMarkupPage />} />
                    <Route path="simulator" element={<PricingSimulatorPage />} />
                    <Route path="processing-fee" element={<PricingProcessingFeePage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </AuthProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
