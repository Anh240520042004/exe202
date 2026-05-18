import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import { toggleSidebar } from '../../store/slices/uiSlice';

export default function Layout() {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state) => state.ui);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => dispatch(toggleSidebar())} 
      />
      <MobileMenu />
      
      <div
        className={`
          transition-all duration-300
          ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
        `}
      >
        <Header />
        
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
