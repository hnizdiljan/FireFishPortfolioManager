import React from 'react';
import { AuthState, useAuthStore } from '@store/authStore';
import { Layout, Avatar, Dropdown, Typography } from 'antd'; // Space není potřeba
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const StyledHeader = styled(Layout.Header)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #001529;
  padding: 0 24px; 
`;

const LogoContainer = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  &:hover {
    text-decoration: none;
  }
`;

const AppTitle = styled(Typography.Title)`
  &&& {
    color: white;
    margin: 0 !important;
    font-size: 20px;
  }
`;

const UserMenuContainer = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const UserNameText = styled(Typography.Text)`
  color: rgba(255, 255, 255, 0.85);
  margin-left: 8px;
  display: none;
  @media (min-width: 768px) {
    display: inline;
  }
`;

const Navbar: React.FC = () => {
  const userName = useAuthStore((state: AuthState) => state.userName);
  const logout = useAuthStore((state: AuthState) => state.logout);

  const items = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign out',
      onClick: () => logout(),
    }
  ];

  return (
    <StyledHeader>
      <LogoContainer to="/">
        <AppTitle level={3}>FireFish PM</AppTitle>
      </LogoContainer>
      
      <Dropdown menu={{ items: items }} trigger={['click']}>
        <UserMenuContainer>
          <Avatar icon={userName ? null : <UserOutlined />} size="default">
            {userName ? userName.charAt(0).toUpperCase() : null}
          </Avatar>
          {userName && <UserNameText>{userName}</UserNameText>}
        </UserMenuContainer>
      </Dropdown>
    </StyledHeader>
  );
};

export default Navbar;
