import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import MiniApp from './MiniApp';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/admin/*" element={<App />} />
                <Route path="/" element={<MiniApp />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);