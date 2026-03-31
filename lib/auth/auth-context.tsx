"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  avatarInitials: string;
  favorites: string[]; // GTINs
  savedSearches: SavedSearch[];
  alerts: PriceAlert[];
}

export interface SavedSearch {
  id: string;
  query: string;
  category: string | null;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  gtin: string;
  productTitle: string;
  targetPriceChf: number;
  condition: "below" | "drops_by_percent" | "drops_by_amount";
  conditionValue: number;
  notifyEmail: boolean;
  notifyPush: boolean;
  sourceFilter: string | null; // null = all sources
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  toggleFavorite: (gtin: string) => void;
  isFavorite: (gtin: string) => boolean;
  addSavedSearch: (query: string, category: string | null) => void;
  removeSavedSearch: (id: string) => void;
  addAlert: (alert: Omit<PriceAlert, "id" | "createdAt" | "isActive">) => void;
  updateAlert: (id: string, updates: Partial<PriceAlert>) => void;
  removeAlert: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Mock user database
// ---------------------------------------------------------------------------

const MOCK_USERS: Record<string, { password: string; name: string }> = {
  "demo@swisspricerunner.ch": { password: "demo123", name: "Max Muster" },
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const login = useCallback((email: string, password: string): boolean => {
    const entry = MOCK_USERS[email];
    if (entry && entry.password === password) {
      setUser({
        id: "usr_" + email.replace(/[^a-z0-9]/g, ""),
        email,
        name: entry.name,
        avatarInitials: entry.name.split(" ").map((n) => n[0]).join("").toUpperCase(),
        favorites: [],
        savedSearches: [],
        alerts: [],
      });
      setShowAuthModal(false);
      return true;
    }
    return false;
  }, []);

  const signup = useCallback((name: string, email: string, password: string): boolean => {
    if (MOCK_USERS[email]) return false;
    MOCK_USERS[email] = { password, name };
    setUser({
      id: "usr_" + Date.now(),
      email,
      name,
      avatarInitials: name.split(" ").map((n) => n[0]).join("").toUpperCase(),
      favorites: [],
      savedSearches: [],
      alerts: [],
    });
    setShowAuthModal(false);
    return true;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const toggleFavorite = useCallback((gtin: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const has = prev.favorites.includes(gtin);
      return {
        ...prev,
        favorites: has
          ? prev.favorites.filter((g) => g !== gtin)
          : [...prev.favorites, gtin],
      };
    });
  }, []);

  const isFavorite = useCallback(
    (gtin: string) => user?.favorites.includes(gtin) ?? false,
    [user],
  );

  const addSavedSearch = useCallback((query: string, category: string | null) => {
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        savedSearches: [
          ...prev.savedSearches,
          { id: "ss_" + Date.now(), query, category, createdAt: new Date().toISOString() },
        ],
      };
    });
  }, []);

  const removeSavedSearch = useCallback((id: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, savedSearches: prev.savedSearches.filter((s) => s.id !== id) };
    });
  }, []);

  const addAlert = useCallback((alert: Omit<PriceAlert, "id" | "createdAt" | "isActive">) => {
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        alerts: [
          ...prev.alerts,
          { ...alert, id: "al_" + Date.now(), createdAt: new Date().toISOString(), isActive: true },
        ],
      };
    });
  }, []);

  const updateAlert = useCallback((id: string, updates: Partial<PriceAlert>) => {
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        alerts: prev.alerts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      };
    });
  }, []);

  const removeAlert = useCallback((id: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, alerts: prev.alerts.filter((a) => a.id !== id) };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        showAuthModal,
        setShowAuthModal,
        login,
        signup,
        logout,
        toggleFavorite,
        isFavorite,
        addSavedSearch,
        removeSavedSearch,
        addAlert,
        updateAlert,
        removeAlert,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
