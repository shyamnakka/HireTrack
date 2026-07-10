import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Briefcase, Bell, User, Menu, X, LogOut } from 'lucide-react';

export const AppShell = () => {
  const { user, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeButtonRef = useRef(null);

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Applications', to: '/applications', icon: Briefcase },
    { name: 'Reminders', to: '/reminders', icon: Bell },
    { name: 'Profile', to: '/profile', icon: User },
  ];

  // Close mobile drawer on Escape keydown
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Accessibility: Focus close button when mobile menu opens
  useEffect(() => {
    if (mobileMenuOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-800 shadow-xl z-20">
        <div className="flex flex-col flex-grow h-screen justify-between overflow-y-auto">
          <div>
            {/* Brand Header */}
            <div className="flex items-center h-16 flex-shrink-0 px-6 bg-slate-950 border-b border-slate-800/80">
              <Briefcase className="h-6 w-6 text-indigo-500 mr-3" aria-hidden="true" />
              <span className="text-xl font-extrabold text-white tracking-wider">HireTrack</span>
            </div>
            
            {/* Sidebar Navigation */}
            <nav className="mt-6 flex-1 px-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-center px-4 py-3 text-sm font-semibold rounded-md transition-all duration-200 outline-none ${
                        isActive
                          ? 'bg-slate-800 text-white border-l-4 border-indigo-500 pl-3'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 pl-4'
                      }`
                    }
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          
          {/* User profile footer inside sidebar */}
          <div className="flex-shrink-0 border-t border-slate-850 p-4 bg-slate-950/40">
            <div className="flex items-center justify-between gap-3 min-w-0">
              {/* User Avatar Initial */}
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-inner">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">
                  {user?.name || 'Loading user...'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email || ''}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-md focus:outline-none transition-colors cursor-pointer shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Mobile Header (Top Bar) */}
        <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-slate-200 md:hidden px-6 items-center justify-between shadow-sm">
          <div className="flex items-center">
            <Briefcase className="h-5 w-5 text-indigo-600 mr-2" aria-hidden="true" />
            <span className="text-lg font-bold text-slate-900 tracking-wide">HireTrack</span>
          </div>
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-600 focus:outline-none rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Mobile Menu Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
        
        {/* Mobile Menu Drawer Container */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 flex flex-col justify-between transition-transform duration-300 ease-in-out transform md:hidden shadow-2xl ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            {/* Drawer Header */}
            <div className="flex items-center h-16 flex-shrink-0 px-6 bg-slate-950 border-b border-slate-800/80 justify-between">
              <div className="flex items-center">
                <Briefcase className="h-6 w-6 text-indigo-500 mr-3" aria-hidden="true" />
                <span className="text-xl font-extrabold text-white tracking-wider">HireTrack</span>
              </div>
              <button
                type="button"
                ref={closeButtonRef}
                className="p-1.5 text-slate-400 hover:text-slate-200 focus:outline-none hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Drawer Navigation Links */}
            <nav className="mt-6 px-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center px-4 py-3 text-base font-semibold rounded-md transition-all duration-200 outline-none ${
                        isActive
                          ? 'bg-slate-800 text-white border-l-4 border-indigo-500 pl-3'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 pl-4'
                      }`
                    }
                  >
                    <Icon className="mr-4 h-6 w-6 flex-shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          
          {/* Drawer Footer User Profile */}
          <div className="flex-shrink-0 border-t border-slate-850 p-4 bg-slate-950/40">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-md focus:outline-none transition-colors cursor-pointer shrink-0"
                aria-label="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Inner Content Outlet */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
