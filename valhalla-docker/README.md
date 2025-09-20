# Valhalla Docker Setup for TechHub Emergency Routing

This directory contains a Docker setup for running Valhalla routing engine with full exclusion and avoidance capabilities enabled.

## Features

- **Hard Exclusions Enabled**: `"allow_hard_exclusions": true` allows proper incident avoidance
- **Florida OSM Data**: Pre-configured to download and build tiles for Florida
- **High Limits**: Configured for emergency routing scenarios with:
  - Up to 50 exclusion locations per request
  - Up to 10 exclusion polygons
  - 5000km max distance for auto routing
  - Real-time incident avoidance capabilities

## Quick Start

1. **Start Valhalla Server**:
   ```bash
   cd valhalla-docker
   docker-compose up -d
   ```

2. **Wait for Tile Building** (first run only):
   - Initial setup downloads Florida OSM data (~500MB)
   - Building tiles takes 10-20 minutes
   - Monitor progress: `docker-compose logs -f valhalla`

3. **Test Server**:
   ```bash
   curl "http://localhost:8002/status"
   ```

4. **Update Backend Configuration**:
   In `backend/src/services/valhallaClient.ts`, change:
   ```typescript
   constructor(baseUrl: string = 'http://localhost:8002') {
   ```

## API Endpoints

- **Health Check**: `GET http://localhost:8002/status`
- **Route**: `POST http://localhost:8002/route`
- **Isochrone**: `POST http://localhost:8002/isochrone`

## Exclusion Features

This setup supports:

### Point Exclusions
```json
{
  "locations": [...],
  "exclude": {
    "locations": [{"lat": 26.368, "lon": -80.170}]
  }
}
```

### Polygon Exclusions
```json
{
  "locations": [...],
  "exclude": {
    "polygons": [{
      "type": "Polygon",
      "coordinates": [[[lon1, lat1], [lon2, lat2], ...]]
    }]
  }
}
```

### Avoid Areas
```json
{
  "locations": [...],
  "avoid_locations": [{"lat": 26.368, "lon": -80.170}],
  "avoid_polygons": [...]
}
```

## Storage

- **Tiles**: Stored in Docker volume `valhalla_data`
- **Config**: Mounted from `./config/valhalla.json`
- **Logs**: `docker-compose logs valhalla`

## Performance

- **Memory**: ~2-4GB during tile building, ~1GB runtime
- **Disk**: ~1GB for Florida tiles
- **CPU**: Moderate during building, low during runtime

## Troubleshooting

### Port Conflicts
If port 8002 is in use:
```yaml
ports:
  - "8003:8002"  # Use port 8003 instead
```

### Tile Building Issues
```bash
# Clear data and rebuild
docker-compose down -v
docker-compose up -d
```

### Memory Issues
```yaml
deploy:
  resources:
    limits:
      memory: 4G
```

## Production Notes

- Use persistent volumes for tiles
- Configure reverse proxy for HTTPS
- Set up monitoring and logging
- Consider clustering for high availability

## Integration

Once running, update the backend to use local Valhalla:

```typescript
// In backend/src/services/valhallaClient.ts
const valhallaClient = new ValhallaClient('http://localhost:8002');
```

This enables **real incident avoidance** instead of the public demo limitations!