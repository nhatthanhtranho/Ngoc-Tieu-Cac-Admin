import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // ✅ import BrowserRouter
import App from './app';
import './global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> {/* ✅ Wrap your app in BrowserRouter */}
      <App />
    </BrowserRouter>
  </StrictMode>
);
