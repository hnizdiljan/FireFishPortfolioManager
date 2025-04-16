import React from 'react';
import { UserDto } from '../../types/userTypes';

interface UserInfoProps {
  user: UserDto | null;
}

const UserInfo: React.FC<UserInfoProps> = ({ user }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-gray-800 mb-2">User Information</h2>
    <p className="text-gray-600">
      Logged in as <span className="font-medium">{user?.name}</span> ({user?.email})
    </p>
  </div>
);

export default UserInfo; 