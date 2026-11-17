# LocalMarket — Phase 4 Milestone 1: Audit, Backup Inventory & PostgreSQL Setup

## 1. Existing Frontend Audit (Phases 1–3 Preserved Intact)

- **Framework & Tooling**: React 19, TypeScript, React Router DOM v7, Vite 8, Tailwind CSS v4, Lucide icons.
- **Design System Preserved**:
  - Golden Yellow: `#F5B82E`
  - Dark Brown: `#593B2A`
  - Cream: `#FFF9ED`
  - White: `#FFFFFF`
- **Preserved Routes**:
  - Public Marketplace: `/`, `/buy-sell`, `/services`, `/categories`, `/categories/:slug`, `/search`, `/favorites`, `/product/:id`, `/products/:id`, `/service/:id`, `/services/:id`, `/about`, `/blog`, `/privacy`, `/terms`.
  - Auth & Dashboards: `/login`, `/signup`, `/dashboard`, `/dashboard/customer`, `/dashboard/seller`, `/dashboard/provider`, `/dashboard/bookings`, `/dashboard/notifications`, `/dashboard/profile`, `/admin-blueprint`.

## 2. Pre-Migration Mock Data & Browser Storage Inventory (Non-Destructive Backup Reference)

All existing frontend mock modules remain untouched in `src/` during Milestone 1 as our backup reference and development fallback:

| Source Module | Contents | Migration Target (Milestone 2+) |
|---|---|---|
| `src/types/marketplace.ts` | `Product`, `ServiceItem`, `ServiceBooking`, `OrderRecord`, `MarketplaceEnquiry`, `NotificationItem`, `UserAccount`, `UserCapabilities`, `CategoryGroup` | Prisma schema models & API DTOs |
| `src/types/admin.ts` | `ADMIN_READY_MODULES`, `AdminUserSummary`, `AdminListingModerationItem`, `AdminReportRecord`, `AdminPlatformSettings` | Admin RBAC tables & `/api/admin/*` routes |
| `src/data/locations.ts` | `PAKISTAN_LOCATIONS` (provinces, cities, neighborhood areas) | Supported locations table / reference seed |
| `src/data/categories.ts` | `PRODUCT_CATEGORY_GROUP` (8 categories) + `SERVICE_CATEGORY_GROUPS` (5 groups) | `Category` table seed |
| `src/data/marketplaceData.ts` | `INITIAL_PRODUCTS`, `INITIAL_SERVICES` (24+ service trades), `INITIAL_NOTIFICATIONS` | Controlled demo listings seed (labeled demo) |
| `src/data/dashboardSeed.ts` | `DEMO_USER_ACCOUNT`, `DEMO_USER_PRODUCTS`, `DEMO_USER_SERVICES`, `DEMO_INITIAL_BOOKINGS`, `DEMO_INITIAL_ORDERS`, `DEMO_INITIAL_ENQUIRIES` | Demo seed reference (credentials never migrated as real verified users) |
| `src/App.tsx` (`localStorage`/`sessionStorage`) | `localmarket_fav_products`, `localmarket_fav_services`, `localmarket_session_profile` | PostgreSQL `Favorite` & HTTP-only cookie session (Milestone 3–5) |

## 3. PostgreSQL & Environment Setup Instructions

1. Install PostgreSQL locally (or provision a hosted PostgreSQL database) and create a database named `localmarket`:
   ```sql
   CREATE DATABASE localmarket;
   ```
2. Copy `.env.example` to `.env` (`.env` is already excluded by `.gitignore`):
   ```bash
   cp .env.example .env
   ```
3. Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, and optional `CLOUDINARY_*` keys inside `.env`.
4. Validate Prisma configuration and generate Prisma Client:
   ```bash
   npx prisma validate
   npx prisma generate
   ```
5. Start the unified full-stack development server on port `3000`:
   ```bash
   npm run dev
   ```
6. Verify health check endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```
