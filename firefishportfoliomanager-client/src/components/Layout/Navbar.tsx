import React, { useState } from 'react';
// import { Link } from 'react-router-dom'; // Removed unused Link
import { useAuth } from '../../context/AuthContext';
// import { useMsal } from '@azure/msal-react'; // Keep this if needed, or remove if truly unused

const Navbar: React.FC = () => {
  const { userName, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  // Assuming 'accounts' is not actually needed here based on previous code
  // const name = accounts[0]?.name || userName || 'User'; 

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-white text-xl font-bold">FireFish PM</span>
          </div>

          <div className="flex items-center">
            <div className="relative ml-3">
              <div>
                <button 
                  type="button" 
                  onClick={toggleProfileMenu}
                  className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="ml-2 text-white text-sm font-medium hidden md:block">
                    {userName || "Uživatel"}
                  </span>
                </button>
              </div>

              {profileMenuOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex={-1}
                >
                  <button 
                    onClick={() => logout()} 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem" 
                    tabIndex={-1} 
                    id="user-menu-item-2"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
