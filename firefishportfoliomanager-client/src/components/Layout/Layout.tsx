import React from 'react';
import { Layout as AntLayout } from 'antd';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import styled from 'styled-components';

const { Content } = AntLayout;

const StyledLayout = styled(AntLayout)`
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const StyledContent = styled(Content)`
  padding: 24px;
  margin: 0;
  background-color: #f5f5f5;
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <StyledLayout>
      <Navbar />
      <AntLayout>
        <Sidebar />
        <StyledContent>
          {children}
        </StyledContent>
      </AntLayout>
    </StyledLayout>
  );
};

export default Layout;
