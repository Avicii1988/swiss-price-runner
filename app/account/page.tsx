"use client";

import Link from "next/link";
import {
  Pin,
  Heart,
  Bell,
  Search,
  Trash2,
  LogOut,
  User,
  Settings,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { getMockProductByGtin } from "@/lib/integrations/mock-service";

export default function AccountPage() {
  const {
    user,
    isLoggedIn,
    setShowAuthModal,
    logout,
    toggleFavorite,
    removeSavedSearch,
    updateAlert,
    removeAlert,
  } = useAuth();

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <header className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Preis<span className="text-red-600">Alarm</span>
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-md px-4 py-32 text-center">
          <User className="mx-auto h-12 w-12 text-gray-300" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Konto erforderlich</h1>
          <p className="mt-2 text-sm text-gray-500">
            Melde dich an, um deine Favoriten, Preisalarme und gespeicherten Suchen zu verwalten.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="mt-6 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Jetzt anmelden
          </button>
        </div>
      </div>
    );
  }

  const favoriteProducts = user.favorites
    .map((gtin) => getMockProductByGtin(gtin))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Preis<span className="text-red-600">Alarm</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
              {user.avatarInitials}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-xs text-gray-500 transition hover:text-gray-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white">
            {user.avatarInitials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
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
                  { label: "Merkliste", count: user.favorites.length, icon: Pin },
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
              {favoriteProducts.length === 0 ? (
                <p className="mt-4 text-center text-xs text-gray-400 py-6">
                  Noch keine Produkte gemerkt. Klicke auf das Pin-Symbol bei einem Produkt.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {favoriteProducts.map((item) => item && (
                    <Link key={item.product.gtin} href={`/product/${item.product.gtin}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 transition hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.product.imageUrl} alt="" className="h-10 w-10 rounded-lg object-contain bg-white" />
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{item.product.title}</p>
                          <p className="text-[10px] text-gray-400">CHF {item.bestPrice.totalChf.toFixed(2)}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); toggleFavorite(item.product.gtin); }}
                        className="text-gray-400 hover:text-red-500"
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
                  {favoriteProducts.map((item) => item && (
                    <Link key={item.product.gtin} href={`/product/${item.product.gtin}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 transition hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.product.imageUrl} alt="" className="h-10 w-10 rounded-lg object-contain bg-white" />
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{item.product.title}</p>
                          <p className="text-[10px] text-gray-400">CHF {item.bestPrice.totalChf.toFixed(2)} · {item.bestSource}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); toggleFavorite(item.product.gtin); }}
                        className="text-gray-400 hover:text-red-500"
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

            {/* Gespeicherte Suchen removed — only Merkliste + Favoriten remain */}
          </div>
        </div>
      </main>
    </div>
  );
}
