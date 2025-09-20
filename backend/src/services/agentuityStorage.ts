import { Agentuity } from '@agentuity/sdk';
import { Incident } from '../types';
import { SpatialStorage, SpatialBounds } from './spatialStorage';

export class AgentuityIncidentStorage {
  private agentuity: Agentuity;
  private kvStoreName: string;

  constructor(apiKey: string, kvStoreName: string = 'incident-storage') {
    this.agentuity = new Agentuity({ apiKey });
    this.kvStoreName = kvStoreName;
  }

  /**
   * Store incident with geohash-based key
   */
  async storeIncident(incident: Incident): Promise<void> {
    try {
      const geohashKey = SpatialStorage.generateGeohashKey(incident.lat, incident.lng);
      const storageKey = `incident:${geohashKey}:${incident.id}`;

      // Store incident data
      await this.agentuity.kv.set(this.kvStoreName, storageKey, {
        ...incident,
        geohash: geohashKey,
        storedAt: new Date().toISOString()
      });

      console.log(`Stored incident ${incident.id} with geohash ${geohashKey}`);
    } catch (error) {
      console.error('Error storing incident in Agentuity:', error);
      throw error;
    }
  }

  /**
   * Get incidents within bounding box using geohash prefixes
   */
  async getIncidentsInBounds(bounds: SpatialBounds): Promise<Incident[]> {
    try {
      const geohashPrefixes = SpatialStorage.getGeohashPrefixes(bounds);
      const incidents: Incident[] = [];

      // Query each geohash prefix
      for (const prefix of geohashPrefixes) {
        const keyPattern = `incident:${prefix}*`;

        try {
          // Get all keys matching the geohash prefix
          const keys = await this.agentuity.kv.list(this.kvStoreName, keyPattern);

          // Fetch incident data for each key
          for (const key of keys) {
            const incidentData = await this.agentuity.kv.get(this.kvStoreName, key);
            if (incidentData) {
              incidents.push(incidentData as Incident);
            }
          }
        } catch (error) {
          console.warn(`Error querying geohash prefix ${prefix}:`, error);
          // Continue with other prefixes
        }
      }

      return this.deduplicateIncidents(incidents);
    } catch (error) {
      console.error('Error getting incidents from Agentuity:', error);
      throw error;
    }
  }

  /**
   * Get incidents for Valhalla exclusions (negative incidents within route area)
   */
  async getExclusionsForRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    bufferKm: number = 2
  ): Promise<Incident[]> {
    try {
      const bounds = SpatialStorage.calculateRouteBounds(startLat, startLng, endLat, endLng, bufferKm);
      const allIncidents = await this.getIncidentsInBounds(bounds);

      // Filter for negative incidents (hazards) within last 24 hours
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;

      return allIncidents.filter(incident => {
        // Only negative incident types
        const isNegative = incident.type === 'debris_road' || incident.type === 'downed_powerline';

        // Only recent incidents
        const incidentTime = new Date(incident.timestamp).getTime();
        const isRecent = (now - incidentTime) <= dayInMs;

        return isNegative && isRecent;
      });
    } catch (error) {
      console.error('Error getting exclusions for route:', error);
      throw error;
    }
  }

  /**
   * Get all incidents (fallback method)
   */
  async getAllIncidents(): Promise<Incident[]> {
    try {
      const keys = await this.agentuity.kv.list(this.kvStoreName, 'incident:*');
      const incidents: Incident[] = [];

      for (const key of keys) {
        const incidentData = await this.agentuity.kv.get(this.kvStoreName, key);
        if (incidentData) {
          incidents.push(incidentData as Incident);
        }
      }

      return this.deduplicateIncidents(incidents);
    } catch (error) {
      console.error('Error getting all incidents:', error);
      throw error;
    }
  }

  /**
   * Remove duplicate incidents (in case same incident appears in multiple geohash areas)
   */
  private deduplicateIncidents(incidents: Incident[]): Incident[] {
    const uniqueIncidents = new Map<string, Incident>();

    incidents.forEach(incident => {
      if (!uniqueIncidents.has(incident.id) ||
          new Date(incident.timestamp) > new Date(uniqueIncidents.get(incident.id)!.timestamp)) {
        uniqueIncidents.set(incident.id, incident);
      }
    });

    return Array.from(uniqueIncidents.values());
  }

  /**
   * Clean up old incidents (optional maintenance method)
   */
  async cleanupOldIncidents(olderThanDays: number = 7): Promise<number> {
    try {
      const allKeys = await this.agentuity.kv.list(this.kvStoreName, 'incident:*');
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const key of allKeys) {
        const incident = await this.agentuity.kv.get(this.kvStoreName, key) as Incident;
        if (incident && new Date(incident.timestamp).getTime() < cutoffTime) {
          await this.agentuity.kv.delete(this.kvStoreName, key);
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old incidents`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old incidents:', error);
      throw error;
    }
  }
}