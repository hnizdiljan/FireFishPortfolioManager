import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check if MSAL is still initializing
    const checkInitialization = async () => {
      try {
        // Handle any pending redirect promise (this is the key fix)
        const response = await instance.handleRedirectPromise();
        
        if (response && response.account) {
          // If we got a response from redirect, set the active account
          instance.setActiveAccount(response.account);
        } else {
          // Otherwise, check for existing accounts
          const accounts = instance.getAllAccounts();
          if (accounts.length > 0) {
            instance.setActiveAccount(accounts[0]);
          }
        }
        
        setIsInitializing(false);
      } catch (error) {
        console.error('MSAL initialization error:', error);
        setIsInitializing(false);
      }
    };

    checkInitialization();
  }, [instance]);

  // Prevent redirect to /login if MSAL is processing a code or id_token fragment
  const hash = window.location.hash;
  const isMsalProcessing = hash.startsWith('#code=') || hash.startsWith('#id_token=') || hash.startsWith('#state=');

  // Show loading while MSAL is initializing
  if (isInitializing || isMsalProcessing) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute; 