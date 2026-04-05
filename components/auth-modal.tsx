"use client";

import { useState } from "react";
import { X, Mail, Lock, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [socialToast, setSocialToast] = useState("");

  if (!showAuthModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      const ok = login(email, password);
      if (!ok) setError("E-Mail oder Passwort ungültig.");
    } else {
      if (!name.trim()) { setError("Name ist erforderlich"); return; }
      const ok = signup(name, email, password);
      if (!ok) setError("E-Mail bereits registriert");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowAuthModal(false); }}>
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <button onClick={() => setShowAuthModal(false)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
          <X className="h-4 w-4" />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none"><path d="M18 3C12.5 3 8 7.5 8 13V21C8 21 7 22 6 23V24H30V23C29 22 28 21 28 21V13C28 7.5 23.5 3 18 3Z" fill="#E30613"/><path d="M14.5 26C14.5 28 16 30 18 30C20 30 21.5 28 21.5 26H14.5Z" fill="#E30613"/><rect x="16" y="9" width="4" height="10" rx="0.8" fill="white"/><rect x="13" y="12" width="10" height="4" rx="0.8" fill="white"/></svg>
          <span className="text-xl font-black">Preis<span className="text-[#E30613]">Alarm</span></span>
        </div>

        <div className="mt-3 text-center">
          <h2 className="text-base font-bold text-gray-900">{mode === "login" ? "Anmelden" : "Konto erstellen"}</h2>
          <p className="mt-1 text-xs text-gray-400">
            {mode === "login" ? "Preisalarme und Favoriten verwalten." : "Kostenloses Konto für personalisierte Preisvergleiche."}
          </p>
        </div>

        {/* Social toast */}
        {socialToast && (
          <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-center text-xs text-blue-700">{socialToast}</div>
        )}

        {/* Social login */}
        <div className="mt-4 space-y-2">
          <button onClick={() => { setSocialToast("Google Login kommt bald!"); setTimeout(() => setSocialToast(""), 3000); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Mit Google anmelden
          </button>
          <button onClick={() => { setSocialToast("Apple Login kommt bald!"); setTimeout(() => setSocialToast(""), 3000); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.12 4.54-3.74 4.25z"/></svg>
            Mit Apple anmelden
          </button>
          <button onClick={() => { setSocialToast("Facebook Login kommt bald!"); setTimeout(() => setSocialToast(""), 3000); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Mit Facebook anmelden
          </button>
        </div>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-[10px] font-medium uppercase text-gray-400">oder per E-Mail</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <Mail className="h-4 w-4 text-gray-400" />
            <input type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <Lock className="h-4 w-4 text-gray-400" />
            <input type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
          </div>

          {/* Remember me + forgot password */}
          {mode === "login" && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-red-600" />
                Angemeldet bleiben
              </label>
              <button type="button" className="text-xs text-red-600 hover:underline">Passwort vergessen?</button>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

          <button type="submit" className="w-full rounded-xl bg-[#E30613] py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
            {mode === "login" ? "Anmelden" : "Registrieren"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          {mode === "login" ? (
            <>Noch kein Konto? <button onClick={() => { setMode("signup"); setError(""); }} className="font-semibold text-red-600 hover:underline">Registrieren</button></>
          ) : (
            <>Bereits registriert? <button onClick={() => { setMode("login"); setError(""); }} className="font-semibold text-red-600 hover:underline">Anmelden</button></>
          )}
        </p>

        <p className="mt-3 text-center text-[9px] text-gray-300">
          Mit der Anmeldung akzeptierst du unsere Datenschutzerklärung.
        </p>
      </div>
    </div>
  );
}
