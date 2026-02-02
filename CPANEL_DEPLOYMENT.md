# cPanel Deployment Guide — 9ja Buyer

This guide walks you through deploying the 9ja Buyer (Vite + React) app to cPanel hosting.

---

## Prerequisites

- cPanel hosting with **Apache** (most shared hosting)
- Node.js 18+ installed locally (for building)
- FTP/SFTP access or cPanel **File Manager**

---

## Part 1: Build Locally

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Set production environment variables

Create or update `.env` for production:

```env
# App Configuration
VITE_APP_NAME=9jaCart
VITE_APP_URL=https://yourdomain.com

# API Configuration (your backend API)
VITE_API_URL=https://api.9jacart.ng
VITE_API_BASIC_USERNAME=your_api_username
VITE_API_BASIC_PASSWORD=your_api_password

# Google OAuth (if used)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

Replace:

- `https://yourdomain.com` → your cPanel domain
- API credentials → your production API values

### Step 3: Build for production

```bash
npm run build
```

This creates a `dist` folder with:

- `index.html` (entry)
- `assets/` (JS, CSS, images)
- `.htaccess` (SPA routing — copied from `public/`)

Verify `.htaccess` exists in `dist/` before uploading. If missing, copy it from `public/.htaccess`.

---

## Part 2: Deploy to cPanel

### Step 4: Log into cPanel

1. Open `https://yourdomain.com/cpanel` (or your host’s cPanel URL)
2. Log in with your credentials

### Step 5: Open File Manager

1. Go to **Files** → **File Manager**
2. Open the `public_html` folder (root of your site)

### Step 6: Clean existing files (optional)

If `public_html` already has old site files:

- Backup any needed files
- Delete everything in `public_html` so the new build is clean

### Step 7: Upload the build

**Option A: Upload via File Manager**

1. Click **Upload**
2. Upload the **entire contents** of your local `dist` folder:
   - `index.html`
   - `assets/` folder
   - `vite.svg`
   - `.htaccess` (enable “Show Hidden Files” if needed)
3. Do **not** upload the `dist` folder itself; upload the files **inside** it

**Option B: Upload via FTP/SFTP**

1. Connect with FileZilla (or similar)
2. Go to `public_html` on the server
3. Upload all contents of your local `dist` folder
4. Ensure `.htaccess` is uploaded

### Step 8: Fix file permissions (if needed)

- Files: `644`
- Folders: `755`

Right‑click → **Change Permissions** in File Manager if required.

---

## Part 3: Subdirectory deployment (e.g. example.com/shop)

If the app should live at `https://example.com/shop` instead of the root:

### Step 1: Update Vite config

In `vite.config.ts`:

```ts
export default defineConfig({
  base: '/shop/',  // Add this line – must end with /
  plugins: [react(), tailwindcss()],
  // ...rest of config
})
```

### Step 2: Rebuild

```bash
npm run build
```

### Step 3: Upload to subdirectory

1. In `public_html`, create a folder named `shop`
2. Upload the contents of `dist` into `shop/`
3. The app will be at `https://example.com/shop`

---

## Part 4: Verify

1. Visit `https://yourdomain.com`
2. Check:
   - Homepage loads
   - Navigation works (e.g. Products, Cart)
   - Direct URLs work (e.g. `/products`, `/cart`)
   - Refresh on any route does not 404

---

## Troubleshooting

### 404 on direct URLs or refresh

- Ensure `.htaccess` was uploaded
- Confirm `mod_rewrite` is enabled (ask host if unsure)
- Check that `.htaccess` is in the same folder as `index.html`

### Blank page

- Check browser console for errors
- Verify `VITE_APP_URL` matches your domain
- Ensure `VITE_API_URL` is correct and reachable from the browser

### API / auth errors

- Confirm `VITE_API_URL` and API credentials in `.env` are correct
- Check CORS is configured on the API to allow your domain

### 403 Forbidden

- Set file permissions to `644` (files) and `755` (folders)
- Ensure `index.html` exists in the document root

---

## Summary Checklist

- [ ] `.env` configured with production URLs and credentials
- [ ] `npm run build` completed without errors
- [ ] All contents of `dist` uploaded to `public_html`
- [ ] `.htaccess` uploaded (enable hidden files if needed)
- [ ] Permissions set to 644 (files) and 755 (folders)
- [ ] Direct URLs and refresh tested
