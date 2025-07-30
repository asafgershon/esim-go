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
import { ESIMsPage } from '@/pages/esims'
import { CatalogPage } from '@/pages/catalog'
import { TripsPage } from '@/pages/trips'
import PricingPage from '@/pages/pricing'
import { PricingSummaryPage } from '@/pages/pricing/summary'
import { PricingSimulatorPage } from '@/pages/pricing/simulator'
import UnifiedPricingRulesPage from '@/pages/pricing/rules-unified'
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
                  <Route path="esims" element={<ErrorBoundary><ProtectedRoute requiredRole="ADMIN"><ESIMsPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="catalog" element={<ErrorBoundary><ProtectedRoute requiredRole="ADMIN"><CatalogPage /></ProtectedRoute></ErrorBoundary>} />
                  <Route path="trips" element={<ErrorBoundary><TripsPage /></ErrorBoundary>} />
                  <Route path="pricing" element={<ErrorBoundary><ProtectedRoute requiredRole="ADMIN"><PricingPage /></ProtectedRoute></ErrorBoundary>}>
                    <Route index element={<Navigate to="summary" replace />} />
                    <Route path="summary" element={<PricingSummaryPage />} />
                    <Route path="simulator" element={<PricingSimulatorPage />} />
                    <Route path="rules" element={<UnifiedPricingRulesPage />} />
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
