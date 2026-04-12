"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  avatarInitials: string;
  avatarUrl?: string;
  favorites: string[]; // GTINs — Heart
  pinned: string[];    // GTINs — Pin (Merkliste)
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
  togglePin: (gtin: string) => void;
  isPinned: (gtin: string) => boolean;
  addSavedSearch: (query: string, category: string | null) => void;
  removeSavedSearch: (id: string) => void;
  addAlert: (alert: Omit<PriceAlert, "id" | "createdAt" | "isActive">) => void;
  updateAlert: (id: string, updates: Partial<PriceAlert>) => void;
  removeAlert: (id: string) => void;
  setAvatarUrl: (url: string | undefined) => void;
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

/** Build our User object from a Supabase auth user */
function fromSupabaseUser(su: SupabaseUser): User {
  const name =
    su.user_metadata?.full_name ??
    su.user_metadata?.name ??
    su.email?.split("@")[0] ??
    "User";
  return {
    id: su.id,
    email: su.email ?? "",
    name,
    avatarInitials: name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
    favorites: [],
    pinned: [],
    savedSearches: [],
    alerts: [],
  };
}

/** Merge Supabase user with locally-persisted user data */
function hydrateUser(su: SupabaseUser): User {
  const base = fromSupabaseUser(su);
  const stored = loadFromStorage(base.id);
  return {
    ...base,
    favorites: stored.favorites ?? base.favorites,
    pinned: stored.pinned ?? base.pinned,
    savedSearches: stored.savedSearches ?? base.savedSearches,
    alerts: stored.alerts ?? base.alerts,
    avatarUrl: stored.avatarUrl ?? base.avatarUrl,
  };
}

// ── localStorage helpers for per-user data persistence ──
const STORAGE_KEY = (uid: string) => `pa_user_${uid}`;

function loadFromStorage(uid: string): Partial<User> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(uid));
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
}

function saveToStorage(user: User) {
  try {
    const data = {
      favorites: user.favorites,
      pinned: user.pinned,
      alerts: user.alerts,
      savedSearches: user.savedSearches,
      avatarUrl: user.avatarUrl,
    };
    localStorage.setItem(STORAGE_KEY(user.id), JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Persist user data on every change
  useEffect(() => {
    if (user) saveToStorage(user);
  }, [user]);

  // ── Supabase session listener ──────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    // Check existing session on mount
    supabase.auth.getUser().then(({ data: { user: su } }) => {
      if (su) {
        setUser(hydrateUser(su));
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(hydrateUser(session.user));
        setShowAuthModal(false);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback((email: string, password: string): boolean => {
    const entry = MOCK_USERS[email];
    if (entry && entry.password === password) {
      setUser({
        id: "usr_" + email.replace(/[^a-z0-9]/g, ""),
        email,
        name: entry.name,
        avatarInitials: entry.name.split(" ").map((n) => n[0]).join("").toUpperCase(),
        favorites: [],
        pinned: [],
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
      pinned: [],
      savedSearches: [],
      alerts: [],
    });
    setShowAuthModal(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    const supabase = createClient();
    supabase.auth.signOut();
  }, []);

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

  const togglePin = useCallback((gtin: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const has = prev.pinned.includes(gtin);
      return { ...prev, pinned: has ? prev.pinned.filter((g) => g !== gtin) : [...prev.pinned, gtin] };
    });
  }, []);

  const isPinned = useCallback(
    (gtin: string) => user?.pinned.includes(gtin) ?? false,
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

  const setAvatarUrl = useCallback((url: string | undefined) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, avatarUrl: url };
      try { localStorage.setItem(`pa_avatar_${prev.id}`, url || ""); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  // Load persisted avatar on login
  useEffect(() => {
    if (!user?.id || user.avatarUrl) return;
    try {
      const saved = localStorage.getItem(`pa_avatar_${user.id}`);
      if (saved) setUser((prev) => prev ? { ...prev, avatarUrl: saved } : prev);
    } catch { /* ignore */ }
  }, [user?.id, user?.avatarUrl]);

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
        togglePin,
        isPinned,
        addSavedSearch,
        removeSavedSearch,
        addAlert,
        updateAlert,
        removeAlert,
        setAvatarUrl,
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
