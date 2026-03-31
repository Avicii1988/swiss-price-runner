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
  const [error, setError] = useState("");

  if (!showAuthModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      const ok = login(email, password);
      if (!ok) setError("E-Mail oder Passwort ungültig. Demo: demo@swisspricerunner.ch / demo123");
    } else {
      if (!name.trim()) { setError("Name ist erforderlich"); return; }
      const ok = signup(name, email, password);
      if (!ok) setError("E-Mail bereits registriert");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) setShowAuthModal(false); }}
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "login" ? "Anmelden" : "Konto erstellen"}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            {mode === "login"
              ? "Melde dich an, um Favoriten und Preisalarme zu verwalten."
              : "Erstelle ein kostenloses Konto für personalisierte Preisvergleiche."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <Mail className="h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <Lock className="h-4 w-4 text-gray-400" />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            {mode === "login" ? "Anmelden" : "Registrieren"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          {mode === "login" ? (
            <>
              Noch kein Konto?{" "}
              <button onClick={() => { setMode("signup"); setError(""); }} className="font-semibold text-red-600 hover:underline">
                Registrieren
              </button>
            </>
          ) : (
            <>
              Bereits registriert?{" "}
              <button onClick={() => { setMode("login"); setError(""); }} className="font-semibold text-red-600 hover:underline">
                Anmelden
              </button>
            </>
          )}
        </p>

        {mode === "login" && (
          <p className="mt-2 text-center text-[10px] text-gray-300">
            Demo: demo@swisspricerunner.ch / demo123
          </p>
        )}
      </div>
    </div>
  );
}
