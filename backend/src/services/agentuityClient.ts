import { Incident } from '../types';
import { SpatialStorage, SpatialBounds } from './spatialStorage';

export class AgentuityClient {
  private apiKey: string;
  private baseUrl = 'https://api.agentuity.com';
  private vectorStoreName: string;

  constructor(apiKey: string, vectorStoreName: string = 'hurricanewaze') {
    this.apiKey = apiKey;
    this.vectorStoreName = vectorStoreName;
  }

  /**
   * Make authenticated request to Agentuity API
   */
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Agentuity API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Store incident in vector store following production API format
   */
  async storeIncident(incident: Incident): Promise<void> {
    try {
      const geohashKey = SpatialStorage.generateGeohashKey(incident.lat, incident.lng);
      const storageKey = `incident:${geohashKey}:${incident.id}`;

      // Format data as array of objects matching production API
      const vectorData = [{
        name: this.vectorStoreName,
        key: storageKey,
        document: JSON.stringify({
          ...incident,
          geohash: geohashKey,
          storedAt: new Date().toISOString()
        }),
        metadata: {
          type: incident.type,
          lat: incident.lat,
          lng: incident.lng,
          geohash: geohashKey,
          timestamp: incident.timestamp
        }
      }];

      await this.makeRequest('PUT', `/sdk/vector/${this.vectorStoreName}`, vectorData);

      console.log(`✅ Stored in Agentuity vector store: ${storageKey}`);
    } catch (error) {
      console.error('Error storing incident in Agentuity:', error);
      throw error;
    }
  }

  /**
   * Get incidents within bounding box using metadata filtering
   */
  async getIncidentsInBounds(bounds: SpatialBounds): Promise<Incident[]> {
    try {
      // Query vector store with metadata filters for geographic bounds
      const response = await this.makeRequest('POST', `/sdk/vector/${this.vectorStoreName}/query`, {
        filter: {
          lat: { $gte: bounds.south, $lte: bounds.north },
          lng: { $gte: bounds.west, $lte: bounds.east }
        },
        limit: 1000 // Get all matching incidents
      });

      // Parse incidents from vector store response
      const incidents: Incident[] = [];
      if (response.documents) {
        for (const doc of response.documents) {
          try {
            const incident = JSON.parse(doc.document) as Incident;
            incidents.push(incident);
          } catch (error) {
            console.warn('Error parsing incident document:', error);
          }
        }
      }

      return this.deduplicateIncidents(incidents);
    } catch (error) {
      console.error('Error getting incidents from Agentuity vector store:', error);
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
      const dayInMs = 24 * 60 * 60 * 1000;
      const recentTime = new Date(Date.now() - dayInMs).toISOString();

      // Query vector store with metadata filters for route exclusions
      const response = await this.makeRequest('POST', `/sdk/vector/${this.vectorStoreName}/query`, {
        filter: {
          lat: { $gte: bounds.south, $lte: bounds.north },
          lng: { $gte: bounds.west, $lte: bounds.east },
          type: { $in: ['debris_road', 'downed_powerline'] },
          timestamp: { $gte: recentTime }
        },
        limit: 1000
      });

      // Parse incidents from vector store response
      const incidents: Incident[] = [];
      if (response.documents) {
        for (const doc of response.documents) {
          try {
            const incident = JSON.parse(doc.document) as Incident;
            incidents.push(incident);
          } catch (error) {
            console.warn('Error parsing incident document:', error);
          }
        }
      }

      console.log(`Found ${incidents.length} route exclusions for ${startLat},${startLng} to ${endLat},${endLng}`);
      return this.deduplicateIncidents(incidents);
    } catch (error) {
      console.error('Error getting exclusions for route from Agentuity:', error);
      // Fallback to bounds query without time/type filters
      try {
        const fallbackBounds = SpatialStorage.calculateRouteBounds(startLat, startLng, endLat, endLng, bufferKm);
        const allIncidents = await this.getIncidentsInBounds(fallbackBounds);
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;

        return allIncidents.filter(incident => {
          const isNegative = incident.type === 'debris_road' || incident.type === 'downed_powerline';
          const incidentTime = new Date(incident.timestamp).getTime();
          const isRecent = (now - incidentTime) <= dayInMs;
          return isNegative && isRecent;
        });
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * Get all incidents from vector store
   */
  async getAllIncidents(): Promise<Incident[]> {
    try {
      // Query all incidents without filters
      const response = await this.makeRequest('POST', `/sdk/vector/${this.vectorStoreName}/query`, {
        filter: {}, // No filters = get all
        limit: 10000
      });

      // Parse incidents from vector store response
      const incidents: Incident[] = [];
      if (response.documents) {
        for (const doc of response.documents) {
          try {
            const incident = JSON.parse(doc.document) as Incident;
            incidents.push(incident);
          } catch (error) {
            console.warn('Error parsing incident document:', error);
          }
        }
      }

      return this.deduplicateIncidents(incidents);
    } catch (error) {
      console.error('Error getting all incidents from Agentuity:', error);
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
   * Clean up old incidents - placeholder for vector store operations
   * TODO: Implement proper vector store cleanup once API documentation is available
   */
  async cleanupOldIncidents(olderThanDays: number = 7): Promise<number> {
    console.log('Vector store cleanup not yet implemented');
    return 0;
  }
}