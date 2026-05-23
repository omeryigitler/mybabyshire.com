# Little Wonders Cloudinary + Database Start

Copy these files into your project.

Changed files:

- `package.json`
- `server/api.ts`
- `prisma/schema.prisma`
- `src/store/useStore.ts`
- `src/Storefront.tsx`
- `src/admin/ProductForm.tsx`
- `src/admin/ImageUploader.tsx`
- `src/admin/AdminProducts.tsx`
- `.env.example`
- `vercel.json`

Important setup:

1. Add these environment variables in Vercel Project Settings → Environment Variables:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="change-this-secret"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

2. Install new dependency:

npm install

3. Apply Prisma schema to the database:

npx prisma db push

4. Commit and push:

git add .
git commit -m "Connect products to Cloudinary and database"
git push origin main

5. Test:

- `/admin/products/new`
- Upload image
- Select cloud style
- Save product
- Homepage should fetch from `/api/products`

Notes:

# Vercel API Fix

Problem:
`/api/products` was returning the homepage because `vercel.json` rewrote every path to `/`.

Fix:
1. Replace `vercel.json`.
2. Add Vercel serverless API files.
3. Add `@vercel/node` to `devDependencies` in `package.json`.

Files to copy:

- `vercel.json`
- `lib/prisma.ts`
- `lib/auth.ts`
- `lib/products.ts`
- `api/products.ts`
- `api/admin/login.ts`
- `api/admin/products.ts`
- `api/admin/upload-image.ts`

Also update `package.json`:

```json
"devDependencies": {
  "@vercel/node": "^5.5.0"
}

- The current MVP still uses hardcoded admin login: `admin@boutique.com / admin`.
- Change this before real launch.
- The `card_bg_image` field was added to Prisma so the cloud background is stored properly.
