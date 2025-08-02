import React from 'react';
import { LogOut, BookOpen, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <img 
              src="/Untitled (185 x 55 px).png" 
              alt="Pantafy Logo" 
              className="h-8 w-auto"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-700">
                {isAdmin ? 'এডমিন' : 'শিক্ষার্থী'}
              </span>
            </div>
            
            {isAdmin && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 rounded-full">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">এডমিন প্যানেল</span>
              </div>
            )}
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;