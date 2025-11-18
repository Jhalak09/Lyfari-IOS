import React from 'react';
import { AuthProvider } from '../auth/AuthContext';

type Props = {
  children: React.ReactNode;
};

/**
 * React Native equivalent of Next.js SessionProviderClient.
 * Keeps the same component name and signature so imports remain compatible.
 */
export default function SessionProviderClient({ children }: Props) {
  return <AuthProvider>{children}</AuthProvider>;
}
