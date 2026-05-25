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
Google admin sign-in is also supported when Google OAuth credentials are added.
Apple sign-in is shown as coming soon until an Apple Developer account is ready.

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
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"
GOOGLE_REDIRECT_URI="https://your-domain.com/api/admin-google-callback"
GOOGLE_ADMIN_EMAILS="admin@example.com"
```

Without `DATABASE_URL`, the storefront still shows demo fallback products, but `/api/products` cannot return saved database products.

Without the Cloudinary variables, admin image upload will not work.

Without the Google variables, the Google button stays visible but redirects back
to the admin screen with a setup message.

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

## Google Admin Sign-In

In Google Cloud Console, create an OAuth client for a web application and add
this redirect URI:

```txt
https://little-wonders-phi.vercel.app/api/admin-google-callback
```

Then add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_ADMIN_EMAILS`
in Vercel. If you later connect a real domain, add the new domain callback URL
to Google and update `GOOGLE_REDIRECT_URI`.

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
