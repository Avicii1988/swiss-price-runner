"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Pin, Heart, Bell, Trash2, LogOut, User, Settings,
  ToggleLeft, ToggleRight, Camera,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { SiteHeader } from "@/components/site-header";

interface AccountProduct {
  gtin: string;
  title: string;
  brand: string;
  category: string;
  categoryName?: string | null;
  imageUrl: string | null;
  shopName?: string | null;
  price: number | null;
}

function formatPrice(chf: number | null | undefined): string {
  if (!chf || chf <= 0) return "–";
  const rounded = Math.round(chf * 100) / 100;
  return rounded % 1 === 0 ? `${Math.floor(rounded)}.–` : rounded.toFixed(2);
}

function proxyUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder-product.svg";
  if (url.startsWith("/")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export default function AccountPage() {
  const {
    user, isLoggedIn, setShowAuthModal, logout,
    toggleFavorite, togglePin, updateAlert, removeAlert, setAvatarUrl,
  } = useAuth();
  const [query, setQuery] = useState("");
  const [productMap, setProductMap] = useState<Record<string, AccountProduct>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real product data for favorites + pinned from the DB
  useEffect(() => {
    if (!user) return;
    const allGtins = Array.from(new Set([...user.favorites, ...(user.pinned ?? [])]));
    if (allGtins.length === 0) return;
    fetch(`/api/products/by-gtins?gtins=${allGtins.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, AccountProduct> = {};
        for (const p of data.products ?? []) map[p.gtin] = p;
        setProductMap(map);
      })
      .catch(() => {});
  }, [user]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Bild zu gross (max. 2 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader query={query} onQueryChange={setQuery} />
        <div className="mx-auto max-w-md px-4 py-32 text-center">
          <User className="mx-auto h-12 w-12 text-gray-300" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Konto erforderlich</h1>
          <p className="mt-2 text-sm text-gray-500">
            Melde dich an, um deine Favoriten, Preisalarme und gespeicherten Suchen zu verwalten.
          </p>
          <button onClick={() => setShowAuthModal(true)}
            className="mt-6 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
            Jetzt anmelden
          </button>
        </div>
      </div>
    );
  }

  const favoriteProducts = user.favorites.map((gtin) => productMap[gtin]).filter(Boolean) as AccountProduct[];
  const pinnedProducts = (user.pinned ?? []).map((gtin) => productMap[gtin]).filter(Boolean) as AccountProduct[];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader query={query} onQueryChange={setQuery} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Profile header with editable avatar */}
        <div className="flex items-center gap-4">
          <div className="group relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-red-600 text-lg font-bold text-white transition hover:opacity-90"
              title="Profilbild ändern"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{user.avatarInitials}</span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                <Camera className="h-5 w-5 text-white" />
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
            {user.avatarUrl && (
              <button onClick={() => setAvatarUrl(undefined)} className="mt-1 text-[11px] text-gray-400 hover:text-gray-600">
                Profilbild entfernen
              </button>
            )}
          </div>
          <button onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 transition hover:border-gray-300 hover:text-gray-900">
            <LogOut className="h-3.5 w-3.5" /> Abmelden
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sidebar stats */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Settings className="h-4 w-4" /> Übersicht
              </h3>
              <div className="mt-3 space-y-2">
                {[
                  { label: "Merkliste", count: (user.pinned ?? []).length, icon: Pin },
                  { label: "Favoriten", count: user.favorites.length, icon: Heart },
                  { label: "Preisalarme", count: user.alerts.length, icon: Bell },
                ].map(({ label, count, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Favorites */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Pin className="h-4 w-4 text-blue-500" />
                Merkliste
              </h2>
              {pinnedProducts.length === 0 ? (
                <p className="mt-4 text-center text-xs text-gray-400 py-6">
                  Noch keine Produkte gemerkt. Klicke auf das Pin-Symbol bei einem Produkt.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {pinnedProducts.map((p) => (
                    <Link key={p.gtin} href={`/product/${p.gtin}`}
                      className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 transition hover:bg-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={proxyUrl(p.imageUrl)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain bg-white" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-900">
                            <span className="font-bold">{p.brand}</span> {p.title.replace(p.brand, "").trim()}
                          </p>
                          <p className="text-[10px] text-gray-400">{formatPrice(p.price)} {p.shopName ? `· ${p.shopName}` : ""}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(p.gtin); }}
                        className="shrink-0 text-gray-400 hover:text-red-500"
                        title="Aus Merkliste entfernen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Favoriten */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Heart className="h-4 w-4 text-red-500" />
                Favoriten
              </h2>
              {favoriteProducts.length === 0 ? (
                <p className="mt-4 text-center text-xs text-gray-400 py-6">
                  Noch keine Favoriten. Klicke auf das Herz-Symbol bei einem Produkt.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {favoriteProducts.map((p) => (
                    <Link key={p.gtin} href={`/product/${p.gtin}`}
                      className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 transition hover:bg-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={proxyUrl(p.imageUrl)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain bg-white" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-900">
                            <span className="font-bold">{p.brand}</span> {p.title.replace(p.brand, "").trim()}
                          </p>
                          <p className="text-[10px] text-gray-400">{formatPrice(p.price)} {p.shopName ? `· ${p.shopName}` : ""}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(p.gtin); }}
                        className="shrink-0 text-gray-400 hover:text-red-500"
                        title="Aus Favoriten entfernen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Price Alerts */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Bell className="h-4 w-4 text-red-500" />
                Meine Preisalarme
              </h2>
              {user.alerts.length === 0 ? (
                <p className="mt-4 text-center text-xs text-gray-400 py-6">
                  Keine aktiven Preisalarme. Richte einen Alarm auf einer Produktseite ein.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {user.alerts.map((alert) => (
                    <div key={alert.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{alert.productTitle}</p>
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {alert.condition === "below" && `Alarm bei unter CHF ${alert.conditionValue}`}
                            {alert.condition === "drops_by_percent" && `Alarm bei ${alert.conditionValue}% Preissenkung`}
                            {alert.condition === "drops_by_amount" && `Alarm bei CHF ${alert.conditionValue} Preissenkung`}
                            {alert.sourceFilter ? ` · nur ${alert.sourceFilter}` : " · alle Quellen"}
                          </p>
                          <div className="mt-1 flex gap-2">
                            {alert.notifyEmail && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">E-Mail</span>}
                            {alert.notifyPush && <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium text-purple-600">Push</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateAlert(alert.id, { isActive: !alert.isActive })}
                            className={alert.isActive ? "text-green-500" : "text-gray-300"}
                          >
                            {alert.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => removeAlert(alert.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
