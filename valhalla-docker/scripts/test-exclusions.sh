#!/bin/bash

# Test script for Valhalla exclusion functionality
# Tests incident avoidance capabilities

set -e

VALHALLA_URL="http://localhost:8002"

echo "🧪 Testing Valhalla Exclusion Capabilities..."

# Test 1: Basic status check
echo "1️⃣ Testing basic connectivity..."
if curl -s "$VALHALLA_URL/status" >/dev/null; then
    echo "   ✅ Valhalla is responding"
else
    echo "   ❌ Valhalla is not responding"
    exit 1
fi

# Test 2: Simple route (baseline)
echo "2️⃣ Testing simple route calculation..."
SIMPLE_ROUTE=$(curl -s -X POST "$VALHALLA_URL/route" \
  -H "Content-Type: application/json" \
  -d '{
    "locations": [
      {"lat": 26.2134, "lon": -80.2456},
      {"lat": 26.7153, "lon": -80.0534}
    ],
    "costing": "auto",
    "directions_options": {"units": "miles"}
  }')

if echo "$SIMPLE_ROUTE" | jq -e '.trip.summary.length' >/dev/null 2>&1; then
    SIMPLE_DISTANCE=$(echo "$SIMPLE_ROUTE" | jq -r '.trip.summary.length')
    SIMPLE_TIME=$(echo "$SIMPLE_ROUTE" | jq -r '.trip.summary.time')
    echo "   ✅ Simple route: ${SIMPLE_DISTANCE} miles, ${SIMPLE_TIME} seconds"
else
    echo "   ❌ Simple route failed"
    echo "$SIMPLE_ROUTE"
    exit 1
fi

# Test 3: Route with point exclusions
echo "3️⃣ Testing route with point exclusions..."
EXCLUDED_ROUTE=$(curl -s -X POST "$VALHALLA_URL/route" \
  -H "Content-Type: application/json" \
  -d '{
    "locations": [
      {"lat": 26.2134, "lon": -80.2456},
      {"lat": 26.7153, "lon": -80.0534}
    ],
    "costing": "auto",
    "directions_options": {"units": "miles"},
    "exclude": {
      "locations": [
        {"lat": 26.368136187015857, "lon": -80.17082661957613},
        {"lat": 26.5234, "lon": -80.1456}
      ]
    }
  }')

if echo "$EXCLUDED_ROUTE" | jq -e '.trip.summary.length' >/dev/null 2>&1; then
    EXCLUDED_DISTANCE=$(echo "$EXCLUDED_ROUTE" | jq -r '.trip.summary.length')
    EXCLUDED_TIME=$(echo "$EXCLUDED_ROUTE" | jq -r '.trip.summary.time')
    echo "   ✅ Excluded route: ${EXCLUDED_DISTANCE} miles, ${EXCLUDED_TIME} seconds"

    # Compare routes
    if [ "$EXCLUDED_DISTANCE" != "$SIMPLE_DISTANCE" ] || [ "$EXCLUDED_TIME" != "$SIMPLE_TIME" ]; then
        echo "   🎯 SUCCESS: Routes differ with exclusions!"
        echo "      • Simple:   ${SIMPLE_DISTANCE} miles, ${SIMPLE_TIME}s"
        echo "      • Excluded: ${EXCLUDED_DISTANCE} miles, ${EXCLUDED_TIME}s"
    else
        echo "   ⚠️  WARNING: Routes are identical (exclusions may not be working)"
    fi
else
    echo "   ❌ Excluded route failed"
    echo "$EXCLUDED_ROUTE"
fi

# Test 4: Route with polygon exclusions
echo "4️⃣ Testing route with polygon exclusions..."
POLYGON_ROUTE=$(curl -s -X POST "$VALHALLA_URL/route" \
  -H "Content-Type: application/json" \
  -d '{
    "locations": [
      {"lat": 26.2134, "lon": -80.2456},
      {"lat": 26.7153, "lon": -80.0534}
    ],
    "costing": "auto",
    "directions_options": {"units": "miles"},
    "exclude": {
      "polygons": [{
        "type": "Polygon",
        "coordinates": [[
          [-80.18, 26.36],
          [-80.16, 26.36],
          [-80.16, 26.38],
          [-80.18, 26.38],
          [-80.18, 26.36]
        ]]
      }]
    }
  }')

if echo "$POLYGON_ROUTE" | jq -e '.trip.summary.length' >/dev/null 2>&1; then
    POLYGON_DISTANCE=$(echo "$POLYGON_ROUTE" | jq -r '.trip.summary.length')
    POLYGON_TIME=$(echo "$POLYGON_ROUTE" | jq -r '.trip.summary.time')
    echo "   ✅ Polygon route: ${POLYGON_DISTANCE} miles, ${POLYGON_TIME} seconds"
else
    echo "   ❌ Polygon route failed"
    echo "$POLYGON_ROUTE" | head -5
fi

echo ""
echo "🎯 Test Summary:"
echo "   • Basic connectivity: ✅"
echo "   • Simple routing: ✅"
echo "   • Point exclusions: $([ "$EXCLUDED_DISTANCE" != "$SIMPLE_DISTANCE" ] && echo "✅" || echo "⚠️")"
echo "   • Polygon exclusions: $(echo "$POLYGON_ROUTE" | jq -e '.trip.summary.length' >/dev/null 2>&1 && echo "✅" || echo "❌")"
echo ""
echo "🔧 Integration:"
echo "   Update backend ValhallaClient to use: $VALHALLA_URL"