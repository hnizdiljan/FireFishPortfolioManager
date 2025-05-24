import React, { useState } from 'react';
import { Layout as AntLayout } from 'antd';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import styled from 'styled-components';

const { Content } = AntLayout;

const StyledLayout = styled(AntLayout)`
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const StyledContent = styled(Content)<{ $isMobile: boolean; $sidebarCollapsed: boolean }>`
  padding: ${({ $isMobile }) => ($isMobile ? '16px 12px' : '24px')};
  margin: 0;
  background-color: #f5f5f5;
  transition: margin-left 0.3s ease;
  
  @media (max-width: 768px) {
    padding: 12px 8px;
    margin-left: 0 !important;
  }
  
  @media (min-width: 769px) {
    margin-left: ${({ $sidebarCollapsed }) => ($sidebarCollapsed ? '80px' : '256px')};
  }
`;

const MobileOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 999;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  transition: all 0.3s ease;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isMobile } = useBreakpoint();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(!isMobile);
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileSidebarVisible(!mobileSidebarVisible);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleMobileOverlayClick = () => {
    setMobileSidebarVisible(false);
  };

  return (
    <StyledLayout>
      <Navbar 
        onMenuToggle={handleSidebarToggle}
        isMobile={isMobile}
      />
      <AntLayout>
        <Sidebar 
          collapsed={isMobile ? false : sidebarCollapsed}
          isMobile={isMobile}
          mobileVisible={mobileSidebarVisible}
          onMobileClose={() => setMobileSidebarVisible(false)}
        />
        {isMobile && (
          <MobileOverlay 
            $visible={mobileSidebarVisible} 
            onClick={handleMobileOverlayClick}
          />
        )}
        <StyledContent 
          $isMobile={isMobile}
          $sidebarCollapsed={sidebarCollapsed}
        >
          {children}
        </StyledContent>
      </AntLayout>
    </StyledLayout>
  );
};

export default Layout;
