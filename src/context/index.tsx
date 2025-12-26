import React from 'react';
import { ClipboardProvider } from './ClipboardContext';
import { AuthProvider } from './AuthContext';
import { DialogProvider } from './DialogContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <DialogProvider>
        <ClipboardProvider>
          {children}
        </ClipboardProvider>
      </DialogProvider>
    </AuthProvider>
  );
};

export * from './ClipboardContext';
export * from './AuthContext';
export * from './DialogContext';

