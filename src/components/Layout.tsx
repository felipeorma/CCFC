import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, LogOut, TriangleAlert as AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { setActiveTab } = useAppContext();
  const { signOut, user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    setActiveTab(path);
  }, [location, setActiveTab]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-primary">
      <button
        className="fixed z-50 top-4 left-4 p-2 rounded-full bg-surface border border-border md:hidden"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 glassmorphism transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-center h-16 border-b border-border">
          <div className="flex items-center gap-3">
            <img
              src="/CAVS_FC.png"
              alt="Cavalry FC Logo"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-lg font-bold leading-tight">Cavalry Football<br/>Centre</h1>
          </div>
        </div>
        <Sidebar />
      </div>

      <div className="flex-1 md:ml-64 p-4 flex flex-col">
        <header className="flex justify-between items-center py-4 mb-4 border-b border-border">
          <div className="flex items-center">
            <div className="ml-4 md:ml-0">
              <h1 className="text-2xl font-bold">
                {location.pathname === '/' && 'Dashboard'}
                {location.pathname === '/season-analysis' && 'Season Analysis'}
                {location.pathname === '/set-pieces-register' && 'Register Set Pieces'}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={handleSignOut}
                className="btn-secondary flex items-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Read-only warning banner */}
        {!isAdmin() && (
          <div className="bg-warning/10 border border-warning text-warning px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p>You have read-only access. You cannot modify or delete data from the database.</p>
          </div>
        )}

        <main className="container mx-auto pb-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;