import React from 'react';
import { AuthState, useAuthStore } from '@store/authStore';
import { Layout, Avatar, Dropdown, Typography, Button } from 'antd';
import { UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const StyledHeader = styled(Layout.Header)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #001529;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 1000;
  
  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  @media (max-width: 768px) {
    gap: 12px;
  }
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
    
    @media (max-width: 576px) {
      font-size: 16px;
    }
  }
`;

const MenuToggleButton = styled(Button)`
  &&& {
    color: rgba(255, 255, 255, 0.85);
    border: none;
    background: transparent;
    box-shadow: none;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover, &:focus {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }
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

interface NavbarProps {
  onMenuToggle: () => void;
  isMobile: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle, isMobile }) => {
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
      <LeftSection>
        <MenuToggleButton 
          icon={<MenuOutlined />}
          onClick={onMenuToggle}
          size="large"
        />
        <LogoContainer to="/">
          <AppTitle level={3}>FireFish PM</AppTitle>
        </LogoContainer>
      </LeftSection>
      
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
