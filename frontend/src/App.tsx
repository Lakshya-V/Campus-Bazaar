// src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { MarketProvider } from './context/MarketContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartSwipeProvider } from './context/CartSwipeContext';
import ScrollToTop from './components/common/ScrollToTop';
import AppRoutes from './router/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MarketProvider>
            <BrowserRouter>
              <ScrollToTop />
              <CartSwipeProvider>
                <AppRoutes />
              </CartSwipeProvider>
            </BrowserRouter>
          </MarketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}