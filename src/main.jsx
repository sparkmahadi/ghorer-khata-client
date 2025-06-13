// src/main.jsx
import React from 'react';
import './index.css'
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ProductAndCategoryProvider } from './contexts/ProductAndCategoryContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ProductAndCategoryProvider>
      <App />
    </ProductAndCategoryProvider>
  </AuthProvider>
);
