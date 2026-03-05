import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { showApiError } from '@/lib/errorHandler';
import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,          // 1 minute before data is considered stale
            retry: 1,                   // retry failed queries once
            refetchOnWindowFocus: false, // avoid spamming requests on tab switch
        },
        mutations: {
            onError: (error) => {
                // Global fallback — individual mutations can override
                showApiError(error);
            },
        },
    },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </GoogleOAuthProvider>
    </React.StrictMode>,
);
