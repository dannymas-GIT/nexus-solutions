import React from 'react';
import Sidebar from '../navigation/Sidebar';
import NavBar from '../navigation/NavBar';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  return (
    <div className="flex h-screen bg-brand-neutral">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <NavBar />
        <main className="flex-1 overflow-auto p-6 pt-28">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 