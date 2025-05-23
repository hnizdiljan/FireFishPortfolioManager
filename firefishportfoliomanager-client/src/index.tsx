import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Handle uncaught promise rejections (often from browser extensions)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && 
      typeof event.reason === 'object' && 
      event.reason.message && 
      event.reason.message.includes('message port closed')) {
    // Prevent the error from being logged - it's likely from a browser extension
    event.preventDefault();
    // eslint-disable-next-line no-console
    console.debug('Suppressed extension-related promise rejection:', event.reason.message);
  }
});

// Handle runtime errors from extensions
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('runtime.lastError')) {
    // Prevent the error from being logged - it's likely from a browser extension
    event.preventDefault();
    // eslint-disable-next-line no-console
    console.debug('Suppressed extension-related error:', event.message);
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
