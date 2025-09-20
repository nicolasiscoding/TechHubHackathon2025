# Railway Setup Instructions

## Project Created! 🎉

Your Railway project **techhub-hackathon** has been created and the initial deployment has started.

**Project URL:** https://railway.com/project/fa9a82fb-37ef-4ffd-b7a2-f8e65062c147

## Complete Setup via Web Dashboard

### 1. Go to your Railway project
Open: https://railway.com/project/fa9a82fb-37ef-4ffd-b7a2-f8e65062c147

### 2. Configure the Default Service (rename to Backend)
1. Click on the service that was just created
2. Go to **Settings** tab
3. Change service name to `backend`
4. Set **Root Directory** to `/backend`
5. Set **Build Command** to `npm install && npm run build`
6. Set **Start Command** to `npm start`

### 3. Add Backend Environment Variables
In the **Variables** tab, add:
```
PORT=${{PORT}}
FRONTEND_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
VALHALLA_URL=https://valhalla1.openstreetmap.de
```

### 4. Generate Backend Domain
1. Go to **Settings** → **Networking**
2. Click **Generate Domain**
3. Copy the generated URL

### 5. Create Frontend Service
1. Click **+ New** in your project
2. Select **GitHub Repo**
3. Choose your repository
4. Name it `frontend`

### 6. Configure Frontend Service
1. Go to **Settings** tab
2. Set **Root Directory** to `/reactapp`
3. Set **Build Command** to `npm install && npm run build`
4. Set **Start Command** to `npm start`

### 7. Add Frontend Environment Variables
In the **Variables** tab, add:
```
NEXT_PUBLIC_API_URL=https://backend-production-xxxx.up.railway.app
NODE_ENV=production
```
(Replace the backend URL with your actual backend domain from step 4)

### 8. Generate Frontend Domain
1. Go to **Settings** → **Networking**
2. Click **Generate Domain**

## Monitor Deployment

Both services will automatically deploy. You can monitor progress in the **Deployments** tab of each service.

- Backend deployment: ~3-5 minutes
- Frontend deployment: ~3-5 minutes

## Test Your Deployment

Once deployed:
1. Backend health check: `https://your-backend-domain.railway.app/health`
2. Frontend: `https://your-frontend-domain.railway.app`

## Troubleshooting

If deployments fail:
1. Check the build logs in the Deployments tab
2. Verify all environment variables are set correctly
3. Ensure root directories are correct (`/backend` and `/reactapp`)

## Optional: Deploy Valhalla

For full incident exclusion support, you can add a Valhalla service:
1. Create new service named `valhalla`
2. Set root directory to `/valhalla-docker`
3. Set Dockerfile path to `./Dockerfile`
4. Note: Requires 4GB+ RAM and takes ~20 minutes to build tiles

For now, the backend is configured to use the public Valhalla API which works well for demo purposes.