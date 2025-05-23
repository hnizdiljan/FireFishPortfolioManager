import React from 'react';
import { Typography, Space } from 'antd';
import { UserDto } from '../../types/userTypes';

const { Title, Text } = Typography;

interface UserInfoProps {
  user: UserDto;
}

const UserInfo: React.FC<UserInfoProps> = ({ user }) => (
  <Space direction="vertical" size="small" style={{ marginBottom: 24 }}>
    <Title level={4} style={{ margin: 0 }}>User Information</Title>
    <Text type="secondary">
      Logged in as <Text strong>{user.name}</Text> ({user.email})
    </Text>
  </Space>
);

export default UserInfo; 