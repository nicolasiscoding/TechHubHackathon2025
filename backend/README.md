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

## Future Integration

- Replace in-memory storage with Agenuity SDK
- Add geospatial distance queries for route optimization
- WebSocket support for real-time updates