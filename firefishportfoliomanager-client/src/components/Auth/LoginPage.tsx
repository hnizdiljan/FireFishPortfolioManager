import React from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login, error } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Fire Fish Portfolio Manager</h1>
          <p className="text-gray-600">Pro pokračování se přihlaste pomocí Microsoft účtu</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <button
          onClick={login}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 23 23"
            className="mr-2"
          >
            <rect x="1" y="1" width="10" height="10" fill="#f25022" />
            <rect x="12" y="1" width="10" height="10" fill="#00a4ef" />
            <rect x="1" y="12" width="10" height="10" fill="#7fba00" />
            <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
          </svg>
          Přihlásit se pomocí Microsoft
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
