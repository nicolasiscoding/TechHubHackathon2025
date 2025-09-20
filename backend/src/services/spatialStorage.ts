import { Incident } from '../types';

export interface SpatialBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export class SpatialStorage {
  private static readonly GEOHASH_PRECISION = 8; // ~38m precision

  /**
   * Simple geohash implementation for spatial indexing
   */
  static generateGeohashKey(lat: number, lng: number): string {
    // Simple grid-based approach instead of proper geohash
    const latGrid = Math.floor((lat + 90) * 1000); // Convert to grid
    const lngGrid = Math.floor((lng + 180) * 1000);
    return `${latGrid}_${lngGrid}`;
  }

  /**
   * Generate multiple geohash keys for a bounding box query
   */
  static getGeohashesInBounds(bounds: SpatialBounds): string[] {
    const hashes: Set<string> = new Set();

    // Calculate step size based on precision (roughly 38m at precision 8)
    const latStep = 0.0005; // ~55m
    const lngStep = 0.0005; // ~55m

    for (let lat = bounds.south; lat <= bounds.north; lat += latStep) {
      for (let lng = bounds.west; lng <= bounds.east; lng += lngStep) {
        const hash = this.generateGeohashKey(lat, lng);
        hashes.add(hash);
      }
    }

    return Array.from(hashes);
  }

  /**
   * Calculate bounding box around a route with buffer
   */
  static calculateRouteBounds(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    bufferKm: number = 2
  ): SpatialBounds {
    // Convert buffer from km to degrees (rough approximation)
    const bufferDegrees = bufferKm / 111; // 1 degree ≈ 111km

    return {
      north: Math.max(startLat, endLat) + bufferDegrees,
      south: Math.min(startLat, endLat) - bufferDegrees,
      east: Math.max(startLng, endLng) + bufferDegrees,
      west: Math.min(startLng, endLng) - bufferDegrees
    };
  }

  /**
   * Calculate distance between two points in kilometers
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Filter incidents within specified distance of a point
   */
  static filterByDistance(
    incidents: Incident[],
    centerLat: number,
    centerLng: number,
    maxDistanceKm: number
  ): Incident[] {
    return incidents.filter(incident => {
      const distance = this.calculateDistance(centerLat, centerLng, incident.lat, incident.lng);
      return distance <= maxDistanceKm;
    });
  }

  /**
   * Get geohash prefixes for broader area search
   */
  static getGeohashPrefixes(bounds: SpatialBounds, precision: number = 6): string[] {
    const hashes = this.getGeohashesInBounds(bounds);
    const prefixes = new Set<string>();

    hashes.forEach(hash => {
      prefixes.add(hash.substring(0, precision));
    });

    return Array.from(prefixes);
  }
}