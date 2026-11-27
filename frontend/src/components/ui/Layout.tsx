import React, { useState } from 'react';
import Sidebar from '../navigation/Sidebar';
import Navbar from '../navigation/Navbar';
import SaasTourOverlay from '../SaasTourOverlay';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {showSidebar && (
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onOpenTour={() => {
            setMobileSidebarOpen(false);
            setTourOpen(true);
          }}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onOpenMobileSidebar={
            showSidebar ? () => setMobileSidebarOpen(true) : undefined
          }
          onOpenTour={() => setTourOpen(true)}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
      <SaasTourOverlay open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
};

export default Layout;
