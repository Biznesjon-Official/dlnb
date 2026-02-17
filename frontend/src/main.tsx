import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { NetworkManager } from './lib/sync/NetworkManager'

// Initialize network manager
const networkManager = NetworkManager.getInstance();

// Network status listener
networkManager.onStatusChange(() => {
  // Silent network status changes
});

// Register Service Worker for PWA using vite-plugin-pwa
if ('serviceWorker' in navigator) {
  // Dynamic import to avoid build errors
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        // Silent refresh notification
      },
      onOfflineReady() {
        // Silent offline ready
      },
      onRegistered() {
        // Listen for SW messages
        if (navigator.serviceWorker) {
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SYNC_TRIGGER') {
              // Trigger sync when SW requests it
              window.dispatchEvent(new CustomEvent('online-sync-trigger'));
            }
          });
        }
      },
      onRegisterError() {
        // Silent error
      }
    });
  }).catch(() => {
    // Silent skip
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
