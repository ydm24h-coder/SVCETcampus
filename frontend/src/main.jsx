import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.jsx'
import './index.css'
import { monkeyPatchLocalStorage } from './utils/secureStorage';

// Apply AES encryption to localStorage globally
monkeyPatchLocalStorage();

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>
)
