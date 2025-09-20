# Community Map Backend API

Express/TypeScript backend for the Community Map application with incident reporting and Valhalla routing integration.

## Features

- **POST** incidents with coordinates and descriptions
- **GET** all stored incidents
- **GET** Valhalla-formatted exclusion coordinates for hazards
- TypeScript with proper type definitions
- CORS enabled for frontend integration
- Health check endpoint

## API Endpoints

### Create Incident
```http
POST /api/incidents
Content-Type: application/json

{
  "type": "debris_road",
  "description": "Large tree blocking road",
  "location": { "lat": 40.7080, "lng": -74.0040 }
}
```

### Get All Incidents
```http
GET /api/incidents
```

### Get Valhalla Exclusions
```http
GET /api/incidents/exclusions

Response:
{
  "exclude_locations": [
    { "lat": 40.7080, "lon": -74.0040 }
  ]
}
```

## Getting Started

```bash
npm install
npm run dev
```

Server runs on http://localhost:3001

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `PORT=3001`
- `FRONTEND_URL=http://localhost:3000`

## Spatial Storage Integration

### Agentuity + Geohashing
- **Hybrid Storage**: Agentuity KV + in-memory fallback
- **Spatial Indexing**: Geohash-based keys for efficient location queries
- **Route Optimization**: Distance-based exclusion filtering

### Enhanced Exclusions Endpoint
```http
GET /api/incidents/exclusions?startLat=40.7&startLng=-74&endLat=40.8&endLng=-73.9&buffer=2
```
Returns only incidents within 2km buffer of the route for optimal Valhalla performance.

### Environment Setup
Add to `.env`:
```
AGENTUITY_API_KEY=your_api_key_here
```

## Geospatial Features

- **8-digit geohash precision** (~38m accuracy)
- **Bounding box queries** for route-specific incidents
- **Distance filtering** within specified radius
- **Automatic deduplication** of overlapping areas
- **TTL cleanup** for old incidents

## Future Enhancements

- WebSocket support for real-time updates
- Incident clustering for high-density areas
- Machine learning for incident prediction