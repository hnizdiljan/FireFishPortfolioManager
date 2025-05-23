import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  DollarOutlined,
  SettingOutlined,
  BarChartOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const { Sider } = Layout;

const StyledSider = styled(Sider)`
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  
  .ant-layout-sider-children {
    padding-top: 16px;
  }
`;

const Sidebar: React.FC = () => {
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
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: 'Statistics',
    },
    {
      key: '/sellorders',
      icon: <UnorderedListOutlined />,
      label: 'Sell Orders',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // Get current selected key based on location
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return '/dashboard';

    return path;
  };

  return (
    <StyledSider width={256} theme="light">
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ border: 'none' }}
      />
    </StyledSider>
  );
};

export default Sidebar;
