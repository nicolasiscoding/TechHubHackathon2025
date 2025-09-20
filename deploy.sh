#!/bin/bash

echo "🚀 Setting up TechHub Hackathon on Railway..."

# First commit the latest changes
echo "📝 Committing deployment files..."
git add .
git commit -m "Add Railway deployment configuration

- Added railway.json for monorepo configuration
- Created service-specific railway.toml files
- Added Dockerfile for Valhalla deployment
- Included environment variable templates
- Added comprehensive deployment documentation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push

echo "✅ Code pushed to GitHub"
echo ""
echo "🌐 Now setting up Railway services..."
echo ""
echo "📊 Project URL: https://railway.com/project/fa9a82fb-37ef-4ffd-b7a2-f8e65062c147"
echo ""
echo "⚡ Next steps (requires manual setup in Railway dashboard):"
echo "1. Go to your Railway project dashboard"
echo "2. The first service should already be deploying"
echo "3. Configure it as the backend:"
echo "   - Name: backend"
echo "   - Root Directory: /backend"
echo "   - Environment Variables:"
echo "     PORT=\${{PORT}}"
echo "     NODE_ENV=production"
echo "     VALHALLA_URL=https://valhalla1.openstreetmap.de"
echo "     FRONTEND_URL=https://\${{frontend.RAILWAY_PUBLIC_DOMAIN}}"
echo ""
echo "4. Create a new service for frontend:"
echo "   - Name: frontend"
echo "   - Root Directory: /reactapp"
echo "   - Environment Variables:"
echo "     NODE_ENV=production"
echo "     NEXT_PUBLIC_API_URL=https://\${{backend.RAILWAY_PUBLIC_DOMAIN}}"
echo ""
echo "5. Generate public domains for both services"
echo ""
echo "📖 See RAILWAY_SETUP.md for detailed instructions"

# Let's also try to get the first service deployed from the backend directory
echo ""
echo "🚢 Deploying from backend directory..."
cd backend

# Try to deploy
railway up --detach 2>/dev/null && echo "✅ Backend deployment started" || echo "⚠️  Please complete setup via dashboard"

cd ..
echo ""
echo "🎉 Setup initiated! Check your Railway dashboard to complete the configuration."