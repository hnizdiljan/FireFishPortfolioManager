import React from 'react';

interface MessageAlertProps {
  message: { text: string; type: 'success' | 'error' } | null;
}

const MessageAlert: React.FC<MessageAlertProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
      {message.text}
    </div>
  );
};

export default MessageAlert; 