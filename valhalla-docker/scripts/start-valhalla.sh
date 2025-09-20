#!/bin/bash

# TechHub Valhalla Startup Script
# Starts Valhalla with proper exclusion support for emergency routing

set -e

echo "🚀 Starting TechHub Valhalla Routing Server..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ docker-compose not found. Please install docker-compose."
    exit 1
fi

# Navigate to valhalla-docker directory
cd "$(dirname "$0")/.."

# Create directories if they don't exist
mkdir -p valhalla_tiles custom_files/config

# Copy config if it doesn't exist
if [ ! -f "custom_files/config/valhalla.json" ]; then
    echo "📄 Copying Valhalla configuration..."
    cp config/valhalla.json custom_files/config/
fi

# Check if OSM data exists
if [ ! -f "osm_data/florida-latest.osm.pbf" ]; then
    echo "📡 OSM data not found. Downloading Florida data (~500MB)..."
    echo "   This may take a few minutes depending on your connection."
    echo "   Future startups will be faster with local data."
fi

# Check if tiles exist
if [ ! -d "valhalla_tiles" ] || [ -z "$(ls -A valhalla_tiles 2>/dev/null)" ]; then
    echo "🗺️  No tiles found. First startup will build tiles for Florida (~10-20 minutes)..."
    echo "   Using local OSM data to build routing tiles."
    echo "⏳ Please be patient during the initial tile building."
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo "📊 Checking service status..."
sleep 5

# Wait for service to be ready
echo "⏳ Waiting for Valhalla to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:8002/status >/dev/null 2>&1; then
        echo "✅ Valhalla is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Valhalla failed to start within 5 minutes."
        echo "📝 Check logs with: docker-compose logs valhalla"
        exit 1
    fi
    echo "   Attempt $i/60 - waiting 5 seconds..."
    sleep 5
done

# Test basic functionality
echo "🧪 Testing Valhalla functionality..."
STATUS=$(curl -s http://localhost:8002/status | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

if [ "$STATUS" = "ok" ]; then
    echo "✅ Valhalla is working correctly!"
    echo ""
    echo "🎯 Server Details:"
    echo "   • URL: http://localhost:8002"
    echo "   • Status: http://localhost:8002/status"
    echo "   • Route: POST http://localhost:8002/route"
    echo ""
    echo "🔧 Next Steps:"
    echo "   1. Update backend/src/services/valhallaClient.ts:"
    echo "      constructor(baseUrl: string = 'http://localhost:8002')"
    echo "   2. Restart your backend server"
    echo "   3. Test incident avoidance routing!"
    echo ""
    echo "📋 Management Commands:"
    echo "   • View logs: docker-compose logs -f valhalla"
    echo "   • Stop: docker-compose down"
    echo "   • Restart: docker-compose restart"
else
    echo "⚠️  Valhalla started but status is: $STATUS"
    echo "📝 Check logs with: docker-compose logs valhalla"
fi