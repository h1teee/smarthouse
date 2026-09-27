import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const userId = localStorage.getItem('user_id');
  if (userId) {
    init = init || {};
    init.headers = {
      ...init.headers,
      'X-User-ID': userId
    };
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
