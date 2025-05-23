import React from 'react';
import { Card, Form, Input, Button, Typography, Space, Alert } from 'antd';

const { Title, Text, Paragraph } = Typography;

interface ApiSettingsProps {
  apiKey: string;
  setApiKey: (val: string) => void;
  apiSecret: string;
  setApiSecret: (val: string) => void;
  showSecret: boolean;
  setShowSecret: (val: boolean) => void;
  hasApiCredentials: boolean;
  handleSaveApiKeys: (e: React.FormEvent) => void;
  saving: boolean;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({
  apiKey,
  setApiKey,
  apiSecret,
  setApiSecret,
  showSecret,
  setShowSecret,
  hasApiCredentials,
  handleSaveApiKeys,
  saving,
}) => (
  <Card>
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={4} style={{ marginBottom: 8 }}>Coinmate API Integration</Title>
        <Paragraph style={{ marginBottom: 8 }}>
          Enter your Coinmate API credentials to enable automatic sell order execution.
        </Paragraph>
        <Alert
          message={hasApiCredentials ? '✓ API credentials seem to be configured (saved successfully).' : '✗ API credentials might not be set or need saving.'}
          type={hasApiCredentials ? 'success' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>

      <Form onFinish={handleSaveApiKeys} layout="vertical">
        <Form.Item
          label="Coinmate API Key"
          required
        >
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Coinmate API key"
            style={{ maxWidth: 400 }}
            required
          />
        </Form.Item>

        <Form.Item
          label="Coinmate API Secret"
          required
        >
          <Input.Password
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter your Coinmate API secret"
            visibilityToggle={{
              visible: showSecret,
              onVisibleChange: setShowSecret,
            }}
            style={{ maxWidth: 400 }}
            required
          />
          <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            Your API secret will be securely stored and never displayed again.
          </Text>
        </Form.Item>

        <Alert
          message="API Permissions Required"
          description={
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              <li>View account balance</li>
              <li>Place buy/sell orders</li>
              <li>View order status</li>
            </ul>
          }
          type="info"
          style={{ marginBottom: 24 }}
        />

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
          >
            {saving ? 'Saving...' : 'Save API Keys'}
          </Button>
        </Form.Item>
      </Form>
    </Space>
  </Card>
);

export default ApiSettings; 