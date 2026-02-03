"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

interface AppContainerProps {
  children: React.ReactNode;
}

export default function AppContainer({ children }: AppContainerProps) {
  const pathname = usePathname();
  // Full screen pages (optional logic, if we want camera to really be full screen even on desktop)
  // For now, consistent app simulator everywhere feels better.
  
  return (
    <div className="app-wrapper">
      <div className="app-content">
        {children}
      </div>
    </div>
  );
}
