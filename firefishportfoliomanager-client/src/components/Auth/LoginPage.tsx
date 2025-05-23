import React from 'react';
import { AuthState, useAuthStore } from '@store/authStore';
import { Button, Card, Typography, Alert } from 'antd';
import styled from 'styled-components';

const LoginPageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f2f5;
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const MicrosoftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 23 23"
    style={{ marginRight: '8px' }}
  >
    <rect x="1" y="1" width="10" height="10" fill="#f25022" />
    <rect x="12" y="1" width="10" height="10" fill="#00a4ef" />
    <rect x="1" y="12" width="10" height="10" fill="#7fba00" />
    <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
  </svg>
);

const LoginPage: React.FC = () => {
  const login = useAuthStore((state: AuthState) => state.login);
  const error = useAuthStore((state: AuthState) => state.error);
  const clearError = useAuthStore((state: AuthState) => state.clearError);

  return (
    <LoginPageContainer>
      <StyledCard>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Typography.Title level={2} style={{ marginBottom: '8px' }}>
            Fire Fish Portfolio Manager
          </Typography.Title>
          <Typography.Text type="secondary">
            Pro pokračování se přihlaste pomocí Microsoft účtu
          </Typography.Text>
        </div>

        {error && (
          <Alert
            message="Chyba přihlášení"
            description={error}
            type="error"
            showIcon
            closable
            onClose={clearError}
            style={{ marginBottom: '24px' }}
          />
        )}

        <Button
          type="primary"
          onClick={login}
          block
          size="large"
          icon={<MicrosoftIcon />}
        >
          Přihlásit se pomocí Microsoft
        </Button>
      </StyledCard>
    </LoginPageContainer>
  );
};

export default LoginPage;
