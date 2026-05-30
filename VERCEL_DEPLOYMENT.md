# Vercel Deployment Guide for PLSE Frontend

## Overview

The frontend has been configured for Vercel deployment with the following changes:

### Changes Made

1. **Created `vercel.json`** - Vercel configuration file with:
   - Next.js framework settings
   - CORS headers for API proxying
   - Build and install commands

2. **Updated `next.config.ts`** - Added Vercel-specific configurations:
   - Standalone output mode
   - Image optimization settings
   - Custom headers and redirects

3. **Created API proxy route** (`src/app/api/[...path]/route.ts`):
   - Proxies requests from `/api/*` to the backend
   - Handles GET and POST requests
   - Passes query parameters and request body

4. **Updated `src/lib/api.ts`**:
   - Added environment detection (development vs production)
   - In production, uses Next.js API routes as proxy
   - In development, uses direct backend URL
   - Added proper caching headers

5. **Created `.env.example`** - Documentation for environment variables

6. **Updated `.gitignore`** - Excludes `.env` files but includes `.env.example`

## Deployment Steps

### 1. Deploy Backend First

The backend needs to be deployed separately. Recommended platforms:

- **Render**: Free tier available, easy setup
- **Railway**: Good for Python apps
- **Fly.io**: Global edge deployment

Example for Render:
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd backend && pip install -r requirements.txt`
4. Set start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `DATABASE_URL=sqlite:///./plse.db`

### 2. Deploy Frontend to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your backend URL (e.g., `https://your-app.onrender.com`)
7. Deploy

### 3. Update Backend CORS

After deployment, update your backend's CORS configuration to allow your Vercel domain:

```python
# In backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",  # Add this
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Go to Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed

## Local Development

For local development:

1. Set environment variable in `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. Start the backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

The frontend will automatically use the direct backend URL in development mode.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Backend       │     │   Database      │
│   (Frontend)    │────▶│   (Render)      │────▶│   (SQLite)      │
│                 │     │                 │     │                 │
│   Next.js       │     │   FastAPI       │     │   PostgreSQL    │
│   API Routes    │     │   /api/*        │     │   (optional)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Request Flow

1. Frontend makes API call to `/api/search?q=...`
2. In production, Next.js API route intercepts the request
3. API route proxies the request to the backend URL
4. Backend processes the request and returns response
5. API route forwards the response back to the frontend

### Benefits

- **No CORS issues**: API calls go through the same origin
- **Server-side caching**: Next.js can cache API responses
- **Security**: Backend URL is not exposed to the client
- **Flexibility**: Can switch between direct and proxy modes

## Troubleshooting

### Build Errors

If the build fails:
1. Check that all dependencies are installed
2. Verify environment variables are set correctly
3. Check the build logs in Vercel dashboard

### API Errors

If API calls fail:
1. Verify the backend is running and accessible
2. Check CORS configuration on the backend
3. Verify the `NEXT_PUBLIC_API_URL` environment variable
4. Check the API route logs in Vercel dashboard

### Cold Starts

Serverless functions may have cold start delays:
1. Consider upgrading to a paid plan for faster cold starts
2. Use Vercel's Edge Functions for better performance
3. Implement client-side caching to reduce API calls

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (for local dev) | Yes (for dev) |
| `NODE_ENV` | Environment mode (set automatically by Vercel) | No |

## Performance Tips

1. **Enable ISR**: Use `next: { revalidate: 3600 }` for caching
2. **Use Edge Functions**: For better performance in specific regions
3. **Implement SWR**: For client-side caching and revalidation
4. **Optimize Images**: Use Next.js Image component for optimization

## Security Considerations

1. **Never commit `.env` files** - Use `.env.example` for documentation
2. **Use environment variables** - Don't hardcode URLs
3. **Implement rate limiting** - Protect your backend from abuse
4. **Use HTTPS** - Vercel provides free SSL certificates
5. **Validate inputs** - Always validate user inputs on the backend
