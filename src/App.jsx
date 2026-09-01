import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/platform/auth.jsx';
import { ToastProvider } from '@/components/cq';
import AppRoutes from './routes.jsx';
import ErrorBoundary from './shell/ErrorBoundary.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
