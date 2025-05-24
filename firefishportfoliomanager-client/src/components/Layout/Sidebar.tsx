import React from 'react';
import { Layout, Menu, Drawer } from 'antd';
import {
  DashboardOutlined,
  DollarOutlined,
  SettingOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const { Sider } = Layout;

const StyledSider = styled(Sider)`
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  position: fixed;
  left: 0;
  top: 64px;
  height: calc(100vh - 64px);
  z-index: 1001;
  transition: all 0.3s ease;
  
  .ant-layout-sider-children {
    padding-top: 16px;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileSidebar = styled(Drawer)`
  .ant-drawer-content-wrapper {
    width: 256px !important;
  }
  
  .ant-drawer-body {
    padding: 0;
    background: #fff;
  }
  
  .ant-drawer-header {
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 24px;
  }
`;

const StyledMenu = styled(Menu)`
  border: none;
  height: 100%;
  
  .ant-menu-item {
    margin: 0;
    padding: 12px 24px;
    height: 48px;
    display: flex;
    align-items: center;
    
    @media (max-width: 768px) {
      padding: 16px 24px;
      height: 56px;
    }
  }
  
  .ant-menu-item-selected {
    background-color: #e6f7ff;
    border-right: 3px solid #1890ff;
  }
`;

interface SidebarProps {
  collapsed: boolean;
  isMobile: boolean;
  mobileVisible: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  isMobile, 
  mobileVisible, 
  onMobileClose 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/loans',
      icon: <DollarOutlined />,
      label: 'Loans',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      key: '/sellorders',
      icon: <UnorderedListOutlined />,
      label: 'Sell Orders',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    if (isMobile) {
      onMobileClose();
    }
  };

  // Get current selected key based on location
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return '/dashboard';
    return path;
  };

  const menuComponent = (
    <StyledMenu
      mode="inline"
      selectedKeys={[getSelectedKey()]}
      items={menuItems}
      onClick={handleMenuClick}
    />
  );

  if (isMobile) {
    return (
      <MobileSidebar
        title="Navigation"
        placement="left"
        onClose={onMobileClose}
        open={mobileVisible}
        closable={true} // We handle overlay in Layout component
        mask={false}
        getContainer={false}
        style={{ position: 'absolute' }}
      >
        {menuComponent}
      </MobileSidebar>
    );
  }

  return (
    <StyledSider 
      width={256} 
      theme="light" 
      collapsed={collapsed}
      collapsedWidth={80}
    >
      {menuComponent}
    </StyledSider>
  );
};

export default Sidebar;
