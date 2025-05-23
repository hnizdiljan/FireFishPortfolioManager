import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventMessage, AuthenticationResult, EventType } from '@azure/msal-browser';
import { msalConfig } from './authConfig';
import AppRoutes from './routes';
import { ConfigProvider } from 'antd';
import { AuthState, useAuthStore } from './store/authStore';
import { SettingsState, useSettingsStore } from './store/settingsStore';
// import csCZ from 'antd/locale/cs_CZ';

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  const setMsalInstance = useAuthStore((state: AuthState) => state.setMsalInstance);
  const setAuthState = useAuthStore((state: AuthState) => state.setAuthState);
  const loadSettings = useSettingsStore((state: SettingsState) => state.loadSettings);

  useEffect(() => {
    // Initialize MSAL instance
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        setMsalInstance(msalInstance);
      } catch (error) {
        console.error('Error initializing MSAL:', error);
      }
    };

    initializeMsal();

    // Set up event callbacks for login/logout
    const callbackId = msalInstance.addEventCallback((message: EventMessage) => {
      if (message.eventType === EventType.LOGIN_SUCCESS && message.payload) {
        const payload = message.payload as AuthenticationResult;
        setAuthState(true, payload.account?.name || payload.account?.username || null);
        // loadSettings(); // Temporarily commented out
      } else if (
        message.eventType === EventType.LOGOUT_SUCCESS ||
        message.eventType === EventType.ACCOUNT_REMOVED
      ) {
        setAuthState(false, null);
      } else if (message.eventType === EventType.LOGIN_FAILURE) {
        console.error("Login failure:", message.error);
        const error = message.error ? (message.error as Error).message : "Login failed";
        setAuthState(false, null, error);
      }
    });

    return () => {
      if (callbackId) {
        msalInstance.removeEventCallback(callbackId);
      }
    };
  }, [setMsalInstance, setAuthState, loadSettings]);

  return (
    <ConfigProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MsalProvider instance={msalInstance}>
          <AppRoutes />
        </MsalProvider>
      </Router>
    </ConfigProvider>
  );
}

export default App;
