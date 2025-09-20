# Use the official Valhalla Docker image
FROM ghcr.io/gis-ops/docker-valhalla/valhalla:latest

# Set proper working directory
WORKDIR /app

# Create directories
RUN mkdir -p /app/valhalla_tiles \
    && mkdir -p /app/osm_data \
    && mkdir -p /app/admin_data \
    && mkdir -p /app/config

# Copy configuration files
COPY config/valhalla.json /app/config/valhalla.json

# Download Florida OSM data during build using curl (Railway-friendly approach)
# This ensures data is available without requiring git-lfs
RUN curl -L -o /app/osm_data/florida-latest.osm.pbf \
    https://download.geofabrik.de/north-america/us/florida-latest.osm.pbf

# Set environment variables with updated paths
ENV tile_files=/app/osm_data/florida-latest.osm.pbf \
    build_tiles=True \
    verbose=True \
    TZ=America/New_York

# Expose the Valhalla port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD curl -f http://localhost:8002/status || exit 1

# The base image already has the correct entrypoint
# It will automatically build tiles on first startup if needed