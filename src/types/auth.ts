// src/types/auth.ts

export interface User {
  id?: string | number;
  name?: string | null;
  email?: string | null;
  image?: string | null;

  hasProfile: boolean;
  hasSoulTest: boolean;
  isProfileComplete: boolean;
  needsProfileSetup: boolean;
  role?: string;
}

export interface Session {
  user: User;
  backendJwt?: string;
  userId?: string;
  message?: string;
}

/**
 * JWT shape used by backend for Google / auth flows.
 * Mirrors next-auth/jwt augmentation.
 */
export interface JWT {
  backendJwt?: string;
  userId?: string;
  message?: string;
  userData?: {
    hasProfile: boolean;
    hasSoulTest: boolean;
    isProfileComplete: boolean;
    needsProfileSetup: boolean;
    role?: string;
  };
}
