# TechHub Community Map - Railway Deployment Guide

## Overview

This monorepo contains three services that work together to provide intelligent routing with incident avoidance:

- **Frontend** (`/reactapp`) - Next.js application for the user interface
- **Backend** (`/backend`) - Express.js API server
- **Valhalla** (`/valhalla-docker`) - Self-hosted routing engine with exclusion support

## Quick Deployment (Recommended)

For the fastest deployment, we recommend starting with the public Valhalla API and deploying only the frontend and backend services.

### Step 1: Create Railway Project

1. Go to [Railway](https://railway.app) and create a new project
2. Choose "Empty Project"
3. Create two new services:
   - Click "+ New" → "GitHub Repo" → Select your repo → Name it "backend"
   - Click "+ New" → "GitHub Repo" → Select your repo → Name it "frontend"

### Step 2: Configure Backend Service

1. Click on the "backend" service
2. Go to Settings tab:
   - Set **Root Directory** to `/backend`
   - Set **Build Command** to `npm install && npm run build`
   - Set **Start Command** to `npm start`
3. Go to Variables tab and add:
   ```
   PORT=${{PORT}}
   FRONTEND_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
   NODE_ENV=production
   VALHALLA_URL=https://valhalla1.openstreetmap.de
   ```
4. Go to Settings → Networking → Generate Domain

### Step 3: Configure Frontend Service

1. Click on the "frontend" service
2. Go to Settings tab:
   - Set **Root Directory** to `/reactapp`
   - Set **Build Command** to `npm install && npm run build`
   - Set **Start Command** to `npm start`
3. Go to Variables tab and add:
   ```
   NEXT_PUBLIC_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
   NODE_ENV=production
   ```
4. Go to Settings → Networking → Generate Domain

### Step 4: Deploy

Railway will automatically deploy both services. The deployment will take a few minutes.

## Advanced: Self-Hosted Valhalla (Optional)

If you want full incident exclusion support, you can deploy your own Valhalla instance:

### Prerequisites
- Valhalla requires significant resources (4GB+ RAM)
- Initial tile building takes 10-20 minutes
- Consider using Railway's Pro plan for adequate resources

### Deploy Valhalla Service

1. Create a new service in your Railway project
2. Name it "valhalla"
3. Configure:
   - **Root Directory**: `/valhalla-docker`
   - **Dockerfile Path**: `./Dockerfile`
4. Add environment variables:
   ```
   PORT=8002
   ```
5. Deploy and wait for tiles to build (~20 minutes first time)

### Update Backend to Use Local Valhalla

Once Valhalla is running, update the backend environment variable:
```
VALHALLA_URL=http://${{valhalla.RAILWAY_PRIVATE_DOMAIN}}:8002
```

## Environment Variables Reference

### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port (auto-assigned by Railway) | `${{PORT}}` |
| FRONTEND_URL | Frontend URL for CORS | `https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}` |
| VALHALLA_URL | Valhalla routing server | `https://valhalla1.openstreetmap.de` |
| NODE_ENV | Environment | `production` |
| AGENTUITY_API_KEY | Optional AI features | `your-key-here` |

### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | `https://${{backend.RAILWAY_PUBLIC_DOMAIN}}` |
| NODE_ENV | Environment | `production` |

## Monitoring

### Health Checks
- Backend: `https://your-backend.railway.app/health`
- Valhalla: `https://your-valhalla.railway.app/status`

### Logs
View logs in Railway dashboard under each service's "Logs" tab.

## Troubleshooting

### Frontend can't connect to Backend
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend (`FRONTEND_URL`)
- Ensure both services have public domains

### Valhalla running out of memory
- Tile building requires 4GB+ RAM
- Consider using public API instead
- Or upgrade to Railway Pro plan

### Slow initial Valhalla startup
- First tile build takes 10-20 minutes
- This is normal and only happens once
- Subsequent restarts are much faster

## Cost Optimization

To minimize costs:
1. Use the public Valhalla API (free)
2. Enable "Sleep" for development environments
3. Use Railway's hobby plan ($5/month) for basic needs

## Support

For issues specific to:
- Railway deployment: Check [Railway docs](https://docs.railway.app)
- Valhalla routing: See [Valhalla docs](https://valhalla.github.io/valhalla/)
- This project: Open an issue on GitHub