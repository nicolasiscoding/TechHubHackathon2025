# Use the official Valhalla Docker image
FROM ghcr.io/gis-ops/docker-valhalla/valhalla:latest

# Set working directory to match base image expectations
WORKDIR /custom_files

# Switch to root to create directories and download data
USER root

# Create subdirectories in existing /custom_files (which already exists in base image)
RUN mkdir -p osm_data

# Copy configuration files
COPY config/valhalla.json /custom_files/valhalla.json

# Download Florida OSM data during build using curl (Railway-friendly approach)
# This ensures data is available without requiring git-lfs
RUN curl -L -o /custom_files/osm_data/florida-latest.osm.pbf \
    https://download.geofabrik.de/north-america/us/florida-latest.osm.pbf

# Change ownership to valhalla user
RUN chown -R valhalla:valhalla /custom_files

# Switch back to valhalla user
USER valhalla

# Set environment variables with paths that match base image expectations
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