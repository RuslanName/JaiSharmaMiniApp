import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const App = lazy(() => import('./App'));
const MiniApp = lazy(() => import('./MiniApp'));
const NotFound = () => <div>Page not found</div>;

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ToastContainer />
                <Suspense fallback={<div>Loading app...</div>}>
                    <Routes>
                        <Route path="/admin/*" element={<App />} />
                        <Route path="/" element={<MiniApp />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>
);