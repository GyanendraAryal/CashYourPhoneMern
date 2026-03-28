import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App';
import './index.css';
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Support BOTH WordPress (#cyf-root) and Vite dev mode (#root)
function mountApp() {
  const rootEl =
    document.getElementById("cyf-root") ||
    document.getElementById("root");

  // If neither exists yet, retry (for WordPress DOM load)
  if (!rootEl) {
    return setTimeout(mountApp, 50);
  }

  createRoot(rootEl).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <CartProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
    </React.StrictMode>
  );
}

mountApp();
