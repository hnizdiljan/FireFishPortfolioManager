import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useMsal } from "@azure/msal-react";
import { apiConfig, loginRequest } from "../authConfig";

interface AuthContextProps {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  userName: string | null;
  error: string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { instance, accounts } = useMsal();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (accounts.length > 0) {
      setIsAuthenticated(true);
      setUserName(accounts[0].name || accounts[0].username);
    } else {
      setIsAuthenticated(false);
      setUserName(null);
    }
  }, [accounts]);
  
  const login = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      setError("Přihlášení se nezdařilo. Zkuste to prosím znovu.");
      console.error(error);
    }
  };

  const logout = () => {
    instance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
    });
  };
  
  const getAccessToken = async (): Promise<string | null> => {
    if (!isAuthenticated) {
      return null;
    }
      try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: apiConfig.scopes,
        account: accounts[0]
      });
      
      return tokenResponse.accessToken;
    } catch (error) {
      // Pokud tiché získání tokenu selže
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const tokenResponse = await instance.acquireTokenPopup({
            scopes: apiConfig.scopes,
            account: accounts[0]
          });
          return tokenResponse.accessToken;
        } catch (popupError) {
          console.error(popupError);
          setError("Nepodařilo se získat přístupový token");
          return null;
        }
      }
      console.error(error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        getAccessToken,
        userName,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth musí být použit uvnitř AuthProvider");
  }
  return context;
};
