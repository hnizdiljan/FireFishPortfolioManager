import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './authConfig';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import LoansPage from './components/Loans/LoansPage';
import LoanForm from './components/Loans/LoanForm';
import SellStrategyPage from './components/Loans/SellStrategyPage';
import SettingsPage from './components/Settings/SettingsPage';
import StatisticsPage from './components/Statistics/StatisticsPage';
import LoginPage from './components/Auth/LoginPage';
import SellOrdersPage from './components/Loans/SellOrdersPage';
import EditExitStrategyPage from './components/Loans/EditExitStrategyPage';
import './App.css';

// Inicializace MSAL
const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  return (
    <Router>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <SettingsProvider>
            <Routes>
              <Route path="/login" element={
                <UnauthenticatedTemplate>
                  <LoginPage />
                </UnauthenticatedTemplate>
              } />
                <Route path="/" element={
                <>
                  <AuthenticatedTemplate>
                    <Layout><Dashboard /></Layout>
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </>
              } />
              
              <Route path="/dashboard" element={
                <>
                  <AuthenticatedTemplate>
                    <Layout><Dashboard /></Layout>
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </>
              } />
              
              <Route path="/loans" element={
                <>
                  <AuthenticatedTemplate>
                    <Layout><LoansPage /></Layout>
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </>
              } />
              
              <Route path="/loans/new" element={
                <>
                  <AuthenticatedTemplate>
                    <Layout><LoanForm /></Layout>
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </>
              } />
              
              <Route path="/loans/:id/edit" element={
                <>
                  <AuthenticatedTemplate>
                    <Layout><LoanForm /></Layout>
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </>
              } />
              
              <Route path="/loans/:id/sell-strategy" element={
                <>
                  <AuthenticatedTemplate>
                    <Layout><SellStrategyPage /></Layout>
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </>
              } />
              
              <Route path="/loans/:id/exit-strategy" element={
                <>
                  <AuthenticatedTemplate>
                    <Layout><EditExitStrategyPage /></Layout>
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </>
              } />
              
              <Route path="/sellorders" element={
                <>
                  <AuthenticatedTemplate>
                    <Layout><SellOrdersPage /></Layout>
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </>
              } />
              
              <Route path="/settings" element={
                <>
                  <AuthenticatedTemplate>
                    <Layout><SettingsPage /></Layout>
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </>
              } />
              
              <Route path="/statistics" element={
                <>
                  <AuthenticatedTemplate>
                    <Layout><StatisticsPage /></Layout>
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <LoginPage />
                  </UnauthenticatedTemplate>
                </>
              } />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </SettingsProvider>
        </AuthProvider>
      </MsalProvider>
    </Router>
  );
}

export default App;
