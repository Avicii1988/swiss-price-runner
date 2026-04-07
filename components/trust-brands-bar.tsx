"use client";

/**
 * Premium "Featured Brands" bar — grayscale wordmarks
 * Signals to brand managers that we are a curated, high-end directory.
 */
export function TrustBrandsBar() {
  return (
    <section className="border-b border-gray-100 bg-gray-50/60 py-6">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-5 lg:px-6">
        <p className="text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          Beliebte Marken im Preisvergleich
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {BRANDS.map((brand) => (
            <div
              key={brand.name}
              className="flex items-center opacity-50 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
              title={brand.name}
            >
              <svg viewBox={brand.viewBox} className="h-5 sm:h-6" fill="none">
                <text
                  x={brand.x ?? "0"}
                  y={brand.y ?? "18"}
                  fontFamily={brand.font ?? "Helvetica Neue, Helvetica, Arial, sans-serif"}
                  fontSize={brand.size ?? "18"}
                  fontWeight={brand.weight ?? "700"}
                  fill={brand.fill ?? "#1a1a1a"}
                  letterSpacing={brand.spacing ?? "-0.3"}
                >
                  {brand.name}
                </text>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const BRANDS: BrandDef[] = [
  { name: "Sephora", viewBox: "0 0 100 24", size: "16", weight: "700", fill: "#555", spacing: "3.5" },
  { name: "Douglas", viewBox: "0 0 95 24", size: "18", weight: "700", fill: "#555", spacing: "1" },
  { name: "MediaMarkt", viewBox: "0 0 135 24", size: "17", weight: "800", fill: "#555", spacing: "0" },
  { name: "Apple", viewBox: "0 0 70 24", size: "20", weight: "600", fill: "#555", spacing: "-0.5" },
  { name: "Dyson", viewBox: "0 0 70 24", size: "19", weight: "600", fill: "#555", spacing: "0" },
  { name: "Nike", viewBox: "0 0 55 24", size: "20", weight: "800", fill: "#555", spacing: "0.5" },
  { name: "Samsung", viewBox: "0 0 105 24", size: "18", weight: "700", fill: "#555", spacing: "1" },
  { name: "Sony", viewBox: "0 0 60 24", size: "20", weight: "800", fill: "#555", spacing: "0.5" },
];

interface BrandDef {
  name: string;
  viewBox: string;
  size?: string;
  weight?: string;
  fill?: string;
  spacing?: string;
  font?: string;
  x?: string;
  y?: string;
}
