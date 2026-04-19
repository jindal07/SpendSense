import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import App from './App.jsx';
import { queryClient } from './lib/queryClient.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            className:
              'rounded-2xl border border-border bg-card text-card-foreground shadow-card',
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
