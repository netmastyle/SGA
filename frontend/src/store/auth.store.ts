import { create } from 'zustand';

export interface AuthUser {
  email: string;
  companyId: string;
  roleId: string;
  permissions: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

function decodeUser(token: string): AuthUser {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return {
    email: payload.email,
    companyId: payload.companyId,
    roleId: payload.roleId,
    permissions: payload.permissions ?? [],
  };
}

const storedAccess = localStorage.getItem('sga_access_token');
const storedRefresh = localStorage.getItem('sga_refresh_token');

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: storedAccess,
  refreshToken: storedRefresh,
  user: storedAccess ? decodeUser(storedAccess) : null,
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('sga_access_token', accessToken);
    localStorage.setItem('sga_refresh_token', refreshToken);
    set({ accessToken, refreshToken, user: decodeUser(accessToken) });
  },
  logout: () => {
    localStorage.removeItem('sga_access_token');
    localStorage.removeItem('sga_refresh_token');
    set({ accessToken: null, refreshToken: null, user: null });
  },
  hasPermission: (permission: string) => get().user?.permissions.includes(permission) ?? false,
}));
