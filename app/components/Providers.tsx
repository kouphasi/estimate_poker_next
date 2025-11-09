'use client';

import { UserProvider } from '@/contexts/UserContext';
import { ToastProvider } from './Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </UserProvider>
  );
}
