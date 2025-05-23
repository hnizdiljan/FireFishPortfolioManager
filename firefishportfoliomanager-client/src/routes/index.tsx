import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@components/Auth/ProtectedRoute';
import Layout from '@components/Layout/Layout';
import Dashboard from '@components/Dashboard/Dashboard';
import LoansPage from '@components/Loans/LoansPage';
import LoanForm from '@components/Loans/LoanForm';
import SellStrategyPage from '@components/Loans/SellStrategyPage';
import SettingsPage from '@components/Settings/SettingsPage';
import StatisticsPage from '@components/Statistics/StatisticsPage';
import LoginPage from '@components/Auth/LoginPage';
import SellOrdersPage from '@components/Loans/SellOrdersPage';
import EditExitStrategyPage from '@components/Loans/EditExitStrategyPage';
import { UnauthenticatedTemplate } from '@azure/msal-react';
import { useIsAuthenticated } from '@azure/msal-react';

const AppRoutes: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated
          ? <Navigate to="/" replace />
          : (
            <UnauthenticatedTemplate>
              <LoginPage />
            </UnauthenticatedTemplate>
          )
      } />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/loans" element={<Layout><LoansPage /></Layout>} />
        <Route path="/loans/new" element={<Layout><LoanForm /></Layout>} />
        <Route path="/loans/:id/edit" element={<Layout><LoanForm /></Layout>} />
        <Route path="/loans/:id/sell-strategy" element={<Layout><SellStrategyPage /></Layout>} />
        <Route path="/loans/:id/exit-strategy" element={<Layout><EditExitStrategyPage /></Layout>} />
        <Route path="/sellorders" element={<Layout><SellOrdersPage /></Layout>} />
        <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
        <Route path="/statistics" element={<Layout><StatisticsPage /></Layout>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes; 