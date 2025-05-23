import React from 'react';
import { Alert } from 'antd';

interface MessageAlertProps {
  message: { text: string; type: 'success' | 'error' } | null;
}

const MessageAlert: React.FC<MessageAlertProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <Alert
      message={message.text}
      type={message.type}
      showIcon
      style={{ marginBottom: 24 }}
    />
  );
};

export default MessageAlert; 