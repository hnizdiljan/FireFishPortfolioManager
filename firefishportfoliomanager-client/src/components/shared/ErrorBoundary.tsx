import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Space } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';

// Make sure this file is treated as a module
export {};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors in child components
 * and display a fallback UI instead of crashing the whole application
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <Alert
          message="Something went wrong"
          description={
            <Space direction="vertical">
              <span>{this.state.error?.message || 'An unexpected error occurred'}</span>
              <Button 
                type="primary" 
                danger 
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
              >
                Try again
              </Button>
            </Space>
          }
          type="error"
          icon={<ExclamationCircleOutlined />}
          showIcon
          style={{ margin: '16px' }}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
