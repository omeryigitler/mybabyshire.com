# Little Wonders

Personalized baby gift storefront with an admin product flow.

## What Is Connected

- Storefront product cards use cloud-style backgrounds.
- Admin product form uploads one product image, lets you choose the cloud style, and previews the exact storefront card.
- Product data is designed to persist in PostgreSQL through Prisma.
- Product images are designed to upload to Cloudinary.
- The app is ready to be imported into Vercel from GitHub.

## Repository

GitHub repo:

```txt
https://github.com/omeryigitler/-Little-Wonders
```

The old source remote is kept locally as `omery-ship-it`.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Admin product form:

```txt
http://localhost:3000/admin/products/new
```

Admin login uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment variables.

## Required Environment Variables

Create `.env` locally and add the same values in Vercel Project Settings.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="change-this-secret"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="use-a-strong-password"
```

Without `DATABASE_URL`, the storefront still shows demo fallback products, but `/api/products` cannot return saved database products.

Without the Cloudinary variables, admin image upload will not work.

## Database Setup

After `DATABASE_URL` is added:

```bash
npx prisma db push
```

This creates the tables from `prisma/schema.prisma`.

## Product Flow

1. Go to `/admin/products/new`.
2. Fill product name, description, and price.
3. Upload one product image.
4. Pick Blue, Peach, or Mint cloud style.
5. Check the live storefront card preview.
6. Save product.
7. The product appears on the homepage through `/api/products`.

## Vercel Setup

1. Import the GitHub repo into Vercel:

```txt
omeryigitler/-Little-Wonders
```

2. Add the environment variables listed above.
3. Run `npx prisma db push` once against the production database.
4. Deploy.

The `vercel.json` file keeps `/admin` and `/admin/*` routes working as SPA routes while leaving `/api/*` available for serverless functions.

## Validation Commands

```bash
npm run lint
npm run build
```
