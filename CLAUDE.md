# SwissPriceRunner

> API-first Affiliate Price Comparison Platform for the Swiss Market.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Validation**: Zod
- **Deployment**: Vercel

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── api/cron/sync-prices/     # Daily price sync endpoint (Vercel Cron)
│   ├── layout.tsx                # Root layout with SEO metadata
│   └── page.tsx                  # Landing page with search
├── lib/
│   ├── db.ts                     # Prisma singleton client
│   ├── pricing/
│   │   └── calculator.ts         # EUR→CHF conversion, DE-VAT removal, CH-VAT, customs
│   └── integrations/
│       ├── base-client.ts        # Abstract base + Zod schemas for all integrations
│       ├── amazon-client.ts      # Amazon.de Product Advertising API
│       ├── galaxus-client.ts     # Digitec/Galaxus API
│       └── zalando-client.ts     # Zalando Partner API
├── prisma/
│   └── schema.prisma             # Product, Price, UserAlert models
└── vercel.json                   # Cron schedule configuration
```

## Database Models

| Model       | Purpose                                   |
|-------------|-------------------------------------------|
| `Product`   | Canonical product record (GTIN, brand)    |
| `Price`     | Price snapshot per source per timestamp    |
| `UserAlert` | User price-drop alert subscriptions       |

## Swiss Pricing Logic (`lib/pricing/calculator.ts`)

1. **Remove DE-VAT** (19%) from gross EUR price
2. **Convert EUR → CHF** using live exchange rate
3. **Add CH-VAT** (8.1% standard / 2.6% reduced)
4. **Add customs fee** if above CHF 65 threshold
   - *Vollverzollung*: CHF 18 base + CHF 0.50/kg
   - *Vereinfacht*: CHF 11.50 flat

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` / `DIRECT_URL` – Supabase PostgreSQL connection strings
- `CRON_SECRET` – Bearer token for cron endpoint auth
- `EXCHANGE_RATE_API_KEY` – For live EUR/CHF rates
- API keys for Amazon, Galaxus, Zalando integrations

## Roadmap

### Phase 1 – Foundation (current)
- [x] Project scaffolding (Next.js + Prisma + Tailwind)
- [x] Database schema (Product, Price, UserAlert)
- [x] Swiss pricing calculator (VAT, customs, FX)
- [x] Integration base client with Zod validation
- [x] Cron sync endpoint
- [ ] Connect to Supabase and run initial migration
- [ ] Implement live exchange rate fetching

### Phase 2 – Integrations
- [ ] Amazon.de PA-API v5 integration
- [ ] Galaxus/Digitec scraping or API
- [ ] Zalando Partner API
- [ ] Price history tracking and charts

### Phase 3 – User Features
- [ ] Search with full-text + GTIN lookup
- [ ] Product detail page with price comparison table
- [ ] User alerts (email/push on price drop)
- [ ] Authentication (NextAuth.js / Supabase Auth)

### Phase 4 – Monetisation & SEO
- [ ] Affiliate link generation (Amazon PartnerNet, etc.)
- [ ] SEO: dynamic sitemap, structured data (JSON-LD)
- [ ] Performance: ISR/SSG for product pages
- [ ] Analytics dashboard

## Conventions

- Use `@/` path alias for imports
- Validate all external data with Zod schemas
- Keep API route handlers thin – delegate to `lib/` services
- Prisma client is a singleton via `lib/db.ts`
