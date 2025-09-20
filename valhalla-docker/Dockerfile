# Use the official Valhalla Docker image
FROM ghcr.io/gis-ops/docker-valhalla/valhalla:latest

# Set working directory
WORKDIR /custom_files

# Copy configuration files
COPY config/valhalla.json /custom_files/config/valhalla.json
COPY custom_files/valhalla.json /custom_files/valhalla.json

# Create necessary directories
RUN mkdir -p /custom_files/valhalla_tiles \
    && mkdir -p /custom_files/osm_data \
    && mkdir -p /custom_files/admin_data

# Download Florida OSM data at build time (for production)
# Note: This will increase build time but ensure data is available
RUN wget -q https://download.geofabrik.de/north-america/us/florida-latest.osm.pbf \
    -O /custom_files/osm_data/florida-latest.osm.pbf

# Set environment variables
ENV tile_files=/custom_files/osm_data/florida-latest.osm.pbf \
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