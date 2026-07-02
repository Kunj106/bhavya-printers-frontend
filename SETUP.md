# Bhavya Printers Frontend — Setup & Deployment Guide

## Prerequisites
- [Node.js 18+](https://nodejs.org/) installed
- [VS Code](https://code.visualstudio.com/) (recommended)
- Your backend deployed on Render (the Spring Boot JAR)

---

## 1. Local Setup in VS Code

### Step 1 — Extract the ZIP
Extract the downloaded ZIP to a folder, e.g. `bhavya-printers-frontend/`.

Open VS Code, then open that folder:
```
File → Open Folder → select bhavya-printers-frontend/
```

### Step 2 — Install dependencies
Open the integrated terminal (`Ctrl+`` ` or `Terminal → New Terminal`) and run:
```bash
npm install
```
This installs all packages listed in `package.json`.

### Step 3 — Configure the environment
Copy the example env file:
```bash
cp .env.example .env
```
Open `.env` and set your backend URL:
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```
Replace `your-backend.onrender.com` with the actual URL of your deployed Spring Boot backend.

> **Local testing tip:** If your backend runs locally on port 8080, set:
> `VITE_API_BASE_URL=http://localhost:8080`

### Step 4 — Run the dev server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Step 5 — Login credentials (default)
- **Admin login** → `/admin/login` → username: `admin` / password: `bhavya1996`
- **Bank login** → `/register` to create a bank account, then `/login`

---

## 2. Building for Production

```bash
npm run build
```
This creates a `dist/` folder with static HTML/CSS/JS files ready to deploy.

---

## 3. Deploying the Frontend on Render

### Step 1 — Push to GitHub
Create a new GitHub repository and push your frontend folder:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/bhavya-printers-frontend.git
git push -u origin main
```

### Step 2 — Create a Static Site on Render
1. Go to [render.com](https://render.com) and log in
2. Click **New** → **Static Site**
3. Connect your GitHub repository
4. Fill in the settings:

| Setting | Value |
|---|---|
| **Name** | `bhavya-printers-frontend` |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### Step 3 — Add Environment Variable
In the Render dashboard for your site, go to **Environment** tab and add:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://your-backend-name.onrender.com` |

Click **Save Changes**, then **Manual Deploy → Deploy latest commit**.

### Step 4 — Your site will be live at:
```
https://bhavya-printers-frontend.onrender.com
```

---

## 4. Connecting to Your Backend

### Update Backend CORS
Your Spring Boot backend's `CorsConfig.java` currently only allows:
```java
.allowedOrigins("https://bhavya-printers-frontend.onrender.com")
```

If your Render frontend URL is different, update `CorsConfig.java` to match your actual URL:
```java
.allowedOrigins("https://YOUR-ACTUAL-FRONTEND-URL.onrender.com")
```
Then redeploy your backend.

### How the frontend calls the backend
All API calls use the `VITE_API_BASE_URL` environment variable + `/api` prefix.

Example: `VITE_API_BASE_URL=https://bhavya-printers-backend.onrender.com`
→ calls `https://bhavya-printers-backend.onrender.com/api/products`

The API service file is at `src/lib/api.ts` — you can review all endpoint definitions there.

---

## 5. Pages Reference

| URL | Description | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/catalog` | Browse products | Public |
| `/login` | Bank login (password + email OTP) | Public |
| `/register` | Bank registration | Public |
| `/dashboard` | My orders | Bank only |
| `/orders/new` | Place new order | Bank only |
| `/orders/:id` | Order detail + GST invoice | Bank only |
| `/admin/login` | Admin login | Public |
| `/admin/dashboard` | Stats + charts | Admin only |
| `/admin/products` | Products CRUD | Admin only |
| `/admin/banks` | Banks management | Admin only |
| `/admin/orders` | All orders + status | Admin only |
| `/admin/settings` | UPI, credentials, GST | Admin only |

---

## 6. Tech Stack

- **React 19** + **Vite 7** — frontend framework and build tool
- **TypeScript** — type safety
- **Tailwind CSS v4** — styling
- **next-themes** — dark/light mode toggle
- **wouter** — client-side routing
- **@tanstack/react-query** — server state management
- **react-hook-form** + **zod** — form validation
- **recharts** — admin dashboard charts
- **framer-motion** — animations
- **lucide-react** — icons
- **radix-ui** — accessible UI primitives

---

## 7. Troubleshooting

**CORS errors in browser console?**
→ Your backend is rejecting requests from your frontend's domain. Update `CorsConfig.java` with your actual frontend URL and redeploy the backend.

**"Network Error" or blank data?**
→ Check that `VITE_API_BASE_URL` is set correctly in your `.env` file (local) or Render environment variables (production). No trailing slash.

**Admin login fails with "Invalid credentials"?**
→ Default credentials are `admin` / `bhavya1996`. Change them from `/admin/settings` after first login.

**OTP email not received?**
→ Your backend uses Brevo (formerly Sendinblue) for email. Make sure the `BREVO_API_KEY` environment variable is set in your backend's Render service.

**Render build fails?**
→ Make sure `VITE_API_BASE_URL` is added as an environment variable in Render BEFORE building. Vite bakes env vars at build time.
