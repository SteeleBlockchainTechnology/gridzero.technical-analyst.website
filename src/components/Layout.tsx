import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800">
      {children}
    </div>
  );
}