import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { showApiError } from '@/lib/errorHandler';

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

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </React.StrictMode>,
);
