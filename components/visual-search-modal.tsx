"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  Loader2,
  ImageIcon,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface VisualSearchModalProps {
  onClose: () => void;
  allProducts: MockProductWithHistory[];
}

type Stage = "upload" | "analyzing" | "results";

export function VisualSearchModal({ onClose, allProducts }: VisualSearchModalProps) {
  const [stage, setStage] = useState<Stage>("upload");
  const [mode, setMode] = useState<"file" | "url">("file");
  const [imageUrl, setImageUrl] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [results, setResults] = useState<MockProductWithHistory[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewSrc(e.target?.result as string);
      runAnalysis();
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUrlSubmit = useCallback(() => {
    if (!imageUrl.trim()) return;
    setPreviewSrc(imageUrl);
    runAnalysis();
  }, [imageUrl]);

  const runAnalysis = useCallback(() => {
    setStage("analyzing");

    // Mock: simulate AI analysis with a 2s delay, then return random products
    setTimeout(() => {
      const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
      setResults(shuffled.slice(0, 5));
      setStage("results");
    }, 2000);

    // In production: POST to /api/search/visual with the image
    // const formData = new FormData();
    // formData.append("image", file);
    // const res = await fetch("/api/search/visual", { method: "POST", body: formData });
  }, [allProducts]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                KI-Bildsuche
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700">Beta</span>
              </h2>
              <p className="text-xs text-gray-500">Foto hochladen, Produkt erkennen, Preise vergleichen</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── UPLOAD stage ── */}
        {stage === "upload" && (
          <div className="p-5">
            {/* Mode toggle */}
            <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-0.5">
              <button onClick={() => setMode("file")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition ${mode === "file" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                <Upload className="h-3.5 w-3.5" /> Bild hochladen
              </button>
              <button onClick={() => setMode("url")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition ${mode === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                <LinkIcon className="h-3.5 w-3.5" /> Bild-URL einfügen
              </button>
            </div>

            {mode === "file" ? (
              /* Drop zone */
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 transition hover:border-blue-400 hover:bg-blue-50/30"
              >
                <ImageIcon className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-700">Bild hierher ziehen</p>
                <p className="mt-1 text-xs text-gray-400">oder klicken zum Auswählen</p>
                <p className="mt-2 text-[10px] text-gray-400">JPG, PNG, WebP · max. 10 MB</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            ) : (
              /* URL input */
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                  <LinkIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/bild.jpg"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={handleUrlSubmit}
                  disabled={!imageUrl.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" /> Bild analysieren
                </button>
              </div>
            )}

            <p className="mt-4 text-center text-[10px] text-gray-400">
              Unsere KI erkennt Produkte und findet den besten Schweizer Preis.
            </p>
          </div>
        )}

        {/* ── ANALYZING stage ── */}
        {stage === "analyzing" && (
          <div className="flex flex-col items-center py-16">
            {previewSrc && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={previewSrc} alt="Upload" className="mb-6 h-24 w-24 rounded-xl object-cover shadow-lg" />
            )}
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-medium text-gray-900">Bild wird analysiert...</p>
            <p className="mt-1 text-xs text-gray-400">KI erkennt Produkt und sucht Preise</p>
            <div className="mt-4 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS stage ── */}
        {stage === "results" && (
          <div className="p-5">
            {/* Preview thumbnail */}
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              {previewSrc && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewSrc} alt="Uploaded" className="h-14 w-14 rounded-lg object-cover" />
              )}
              <div>
                <p className="text-xs font-medium text-gray-900">KI-Erkennung abgeschlossen</p>
                <p className="text-[11px] text-gray-400">{results.length} ähnliche Produkte gefunden</p>
              </div>
              <button onClick={() => { setStage("upload"); setPreviewSrc(null); setResults([]); }}
                className="ml-auto text-xs text-blue-600 hover:underline">Neues Bild</button>
            </div>

            {/* Result cards */}
            <div className="space-y-2">
              {results.map((item) => (
                <Link
                  key={item.product.gtin}
                  href={`/product/${item.product.gtin}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition hover:border-gray-200 hover:bg-gray-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.product.imageUrl} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.product.title}</p>
                    <p className="text-[11px] text-gray-400">{item.product.brand} · {item.product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">CHF {item.bestPrice.totalChf.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">{item.bestSource}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-3 border-t border-gray-100 pt-3 text-center">
              <button onClick={onClose} className="flex w-full items-center justify-center gap-1 text-xs font-medium text-blue-600">
                Alle Ergebnisse anzeigen <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
