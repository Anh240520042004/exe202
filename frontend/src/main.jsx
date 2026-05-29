import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AppWithAuth = () => (
  <>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { background: '#333', color: '#fff' },
      }}
    />
  </>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            <AppWithAuth />
          </GoogleOAuthProvider>
        ) : (
          <AppWithAuth />
        )}
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
