// src/router/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import HomePage from '../pages/HomePage';
import ListingDetailPage from '../pages/ListingDetailPage';
import LoginPage from '../pages/LoginPage';
import CreateListingPage from '../pages/CreateListingPage';
import ChatPage from '../pages/ChatPage';
import { useAuth } from '../context/AuthContext';

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route element={<Layout />}>
          {/* Phase 1 Auth Gate: Route "/" when logged out renders ONLY the login page */}
          <Route
            path="/"
            element={isAuthenticated ? <HomePage /> : <LoginPage />}
          />

          {/* Item Detail Views */}
          <Route
            path="/item/:id"
            element={
              isAuthenticated ? <ListingDetailPage /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/listings/:id"
            element={
              isAuthenticated ? <ListingDetailPage /> : <Navigate to="/" replace />
            }
          />

          {/* Seller Flow: Create Listing */}
          <Route
            path="/sell/new"
            element={
              isAuthenticated ? <CreateListingPage /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/listings/new"
            element={
              isAuthenticated ? <CreateListingPage /> : <Navigate to="/" replace />
            }
          />

          {/* Chat System Route */}
          <Route
            path="/chat/:sessionId"
            element={isAuthenticated ? <ChatPage /> : <Navigate to="/" replace />}
          />

          {/* Direct Login route */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}