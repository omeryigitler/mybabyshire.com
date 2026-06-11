# MY BABY SHIRE

Personalized baby gift storefront with an admin product flow.

## What Is Connected

- Storefront product cards use cloud-style backgrounds.
- Admin product form uploads one product image, lets you choose cloud shape, inner panel, and six color styles, then previews the exact storefront card.
- Admin categories, personalization templates, order notes, and customer notes persist in PostgreSQL.
- Checkout supports test Stripe and PayPal flows.
- Order tracking supports manual carrier details and official USPS/UPS/FedEx/DHL tracking links.
- Product data is designed to persist in PostgreSQL through Prisma.
- Product images are designed to upload to Cloudinary.
- The app is ready to be imported into Vercel from GitHub.

## Repository

GitHub repo:

```txt
https://github.com/omeryigitler/mybabyshire.com
```

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

Admin login uses `ADMIN_EMAIL` / `GOOGLE_ADMIN_EMAILS` and `ADMIN_PASSWORD` from environment variables.
Google admin sign-in is also supported when Google OAuth credentials are added.
Apple sign-in is shown as coming soon until an Apple Developer account is ready.

## Required Environment Variables

Create `.env` locally and add the same values in Vercel Project Settings.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="change-this-secret"
PUBLIC_SITE_URL="https://mybabyshire.com"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
REMOVE_BG_API_KEY="your_remove_bg_key"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="use-a-strong-password"
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"
GOOGLE_REDIRECT_URI="https://your-domain.com/api/admin-google-callback"
GOOGLE_MEMBER_REDIRECT_URI="https://your-domain.com/login"
GOOGLE_ADMIN_EMAILS="admin@example.com,second-admin@example.com"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PAYPAL_ENV="sandbox"
PAYPAL_CLIENT_ID="your_paypal_sandbox_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_sandbox_client_secret"
RESEND_API_KEY="re_..."
FROM_EMAIL="MY BABY SHIRE <orders@your-domain.com>"
```

Without `DATABASE_URL`, the storefront still shows demo fallback products, but `/api/products` cannot return saved database products.

Without the Cloudinary variables, admin image upload will not work.

Without the Google variables, the Google button stays visible but redirects back
to the admin screen with a setup message.

Without `RESEND_API_KEY`, email templates stay ready in code but no real
payment/shipping/delivery email is sent. Add it only after the Resend domain is
verified in Cloudflare DNS.

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
4. Pick one of the cloud shapes, one inner panel style, and one of six colors.
5. Check the live storefront card preview.
6. Save product.
7. The product appears on the homepage through `/api/products`.

To create the full color set, enable **Create color set** before saving. This
creates six product variants using the selected cloud and panel shape.

## Google Admin Sign-In

In Google Cloud Console, create an OAuth client for a web application and add
this redirect URI:

```txt
https://mybabyshire.com/api/admin-google-callback
```

Then add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_ADMIN_EMAILS`
in Vercel. If you later connect a real domain, add the new domain callback URL
to Google and update `GOOGLE_REDIRECT_URI`.

For customer account Google sign-in, also add the member redirect URL configured
in the app:

```txt
https://mybabyshire.com/login
```

Then set `GOOGLE_MEMBER_REDIRECT_URI` to that URL in Vercel.

## Test Payments

Keep payment credentials in test/sandbox mode until the storefront is ready for
real orders:

- Stripe uses `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- PayPal uses `PAYPAL_ENV=sandbox`, `PAYPAL_CLIENT_ID`, and `PAYPAL_CLIENT_SECRET`.
- Hosted Stripe and PayPal page branding is configured in their dashboards.

## Email Status

Email code is ready, but real sending should stay disabled until
`mybabyshire.com` is verified in Resend. DNS is managed in Cloudflare, so add
Resend's generated SPF/DKIM records there. After verification, add:

```bash
RESEND_API_KEY="re_..."
FROM_EMAIL="MY BABY SHIRE <orders@mybabyshire.com>"
```

## Vercel Setup

1. Import the GitHub repo into Vercel:

```txt
omeryigitler/mybabyshire.com
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
