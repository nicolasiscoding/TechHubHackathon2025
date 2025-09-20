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
   * Store incident in vector store with optimized embedding content
   */
  async storeIncident(incident: Incident): Promise<void> {
    try {
      const geohashKey = SpatialStorage.generateGeohashKey(incident.lat, incident.lng);
      const storageKey = `incident:${geohashKey}:${incident.id}`;

      // Create embeddable content: description + location context + keywords
      const locationKeywords = await this.generateLocationKeywords(incident.lat, incident.lng);
      const typeKeywords = this.getIncidentTypeKeywords(incident.type);

      const embeddableContent = [
        incident.description,
        `Location: ${incident.lat.toFixed(4)}, ${incident.lng.toFixed(4)}`,
        `Type: ${incident.type.replace('_', ' ')}`,
        `Keywords: ${typeKeywords.join(', ')}`,
        `Area: ${locationKeywords.join(', ')}`,
        `Reported: ${new Date(incident.timestamp).toLocaleDateString()}`
      ].join(' | ');

      // Format data as array of objects matching production API
      const vectorData = [{
        name: this.vectorStoreName,
        key: storageKey,
        document: embeddableContent, // Embed meaningful content, not raw JSON
        metadata: {
          // Store full incident data in metadata for retrieval
          incident_id: incident.id,
          type: incident.type,
          lat: incident.lat,
          lng: incident.lng,
          description: incident.description,
          timestamp: incident.timestamp,
          reported_by: incident.reportedBy || 'Anonymous',
          geohash: geohashKey,
          stored_at: new Date().toISOString()
        }
      }];

      await this.makeRequest('PUT', `/sdk/vector/${this.vectorStoreName}`, vectorData);

      console.log(`✅ Stored in Agentuity vector store: ${storageKey}`);
      console.log(`📄 Embedded content: ${embeddableContent.substring(0, 100)}...`);
    } catch (error) {
      console.error('Error storing incident in Agentuity:', error);
      throw error;
    }
  }

  /**
   * Generate location-based keywords for better semantic search
   */
  private async generateLocationKeywords(lat: number, lng: number): Promise<string[]> {
    const keywords: string[] = [];

    // Add coordinate-based keywords
    keywords.push(`lat_${Math.floor(lat * 100) / 100}`);
    keywords.push(`lng_${Math.floor(lng * 100) / 100}`);

    // Add rough geographic areas (could be enhanced with reverse geocoding)
    if (lat >= 25.7 && lat <= 26.8 && lng >= -80.3 && lng <= -80.0) {
      keywords.push('South Florida', 'Miami-Dade', 'Broward', 'Palm Beach');

      if (lat >= 25.7 && lat <= 25.8) {
        keywords.push('Miami', 'Downtown Miami', 'Brickell');
      } else if (lat >= 26.0 && lat <= 26.2) {
        keywords.push('Fort Lauderdale', 'Broward County');
      } else if (lat >= 26.3 && lat <= 26.4) {
        keywords.push('Boca Raton', 'Delray Beach');
      } else if (lat >= 26.7 && lat <= 26.8) {
        keywords.push('West Palm Beach', 'Palm Beach County');
      }

      // Add highway/road keywords based on coordinates
      if (lng >= -80.15 && lng <= -80.10) {
        keywords.push('I-95', 'Interstate 95', 'US-1');
      }
    }

    return keywords;
  }

  /**
   * Get searchable keywords for incident types
   */
  private getIncidentTypeKeywords(type: string): string[] {
    const typeMap: Record<string, string[]> = {
      'food_available': ['food', 'meals', 'restaurant', 'grocery', 'supplies', 'available', 'open'],
      'gas_available': ['gas', 'fuel', 'gasoline', 'station', 'available', 'open'],
      'power_available': ['power', 'electricity', 'charging', 'wifi', 'available', 'working'],
      'shelter_available': ['shelter', 'housing', 'refuge', 'safe', 'available', 'open'],
      'debris_road': ['debris', 'blocked', 'road', 'tree', 'obstruction', 'hazard', 'impassable'],
      'downed_powerline': ['powerline', 'power line', 'electrical', 'dangerous', 'hazard', 'avoid']
    };

    return typeMap[type] || [type.replace('_', ' ')];
  }

  /**
   * Get incidents within bounding box using vector search
   */
  async getIncidentsInBounds(bounds: SpatialBounds): Promise<Incident[]> {
    try {
      // Use vector search endpoint to get incidents in the area
      // Search for geographic terms that might match incidents in the bounding box
      const searchQuery = `incidents debris road power lines hazards lat:${bounds.south}-${bounds.north} lng:${bounds.west}-${bounds.east}`;

      const response = await this.makeRequest('POST', `/sdk/vector/${this.vectorStoreName}/search`, {
        query: searchQuery,
        limit: 1000,
        similarity: 0.1 // Low similarity to get more results
      });

      // Parse incidents from vector store response
      const incidents: Incident[] = [];
      if (response.results) {
        for (const result of response.results) {
          try {
            // Extract incident data from metadata (not from document which is now embeddable content)
            const metadata = result.metadata;
            if (metadata && metadata.incident_id) {
              const incident: Incident = {
                id: metadata.incident_id,
                lat: metadata.lat,
                lng: metadata.lng,
                type: metadata.type,
                description: metadata.description,
                timestamp: new Date(metadata.timestamp),
                reportedBy: metadata.reported_by
              };

              // Filter by geographic bounds since vector search might return broader results
              if (incident.lat >= bounds.south && incident.lat <= bounds.north &&
                  incident.lng >= bounds.west && incident.lng <= bounds.east) {
                incidents.push(incident);
              }
            }
          } catch (error) {
            console.warn('Error parsing incident from metadata:', error);
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

      // Query vector store using search endpoint for route hazards
      const searchQuery = `debris road downed powerline hazards blocking route lat:${bounds.south}-${bounds.north} lng:${bounds.west}-${bounds.east}`;

      const response = await this.makeRequest('POST', `/sdk/vector/${this.vectorStoreName}/search`, {
        query: searchQuery,
        limit: 1000,
        similarity: 0.2 // Slightly higher similarity for more relevant hazard results
      });

      // Parse and filter incidents from vector store response
      const incidents: Incident[] = [];
      if (response.results) {
        for (const result of response.results) {
          try {
            // Extract incident data from metadata
            const metadata = result.metadata;
            if (metadata && metadata.incident_id) {
              const incident: Incident = {
                id: metadata.incident_id,
                lat: metadata.lat,
                lng: metadata.lng,
                type: metadata.type,
                description: metadata.description,
                timestamp: new Date(metadata.timestamp),
                reportedBy: metadata.reported_by
              };

              // Filter for negative incidents (hazards) within bounds and time window
              const isNegative = incident.type === 'debris_road' || incident.type === 'downed_powerline';
              const withinBounds = incident.lat >= bounds.south && incident.lat <= bounds.north &&
                                  incident.lng >= bounds.west && incident.lng <= bounds.east;
              const incidentTime = new Date(incident.timestamp).getTime();
              const now = Date.now();
              const dayInMs = 24 * 60 * 60 * 1000;
              const isRecent = (now - incidentTime) <= dayInMs;

              if (isNegative && withinBounds && isRecent) {
                incidents.push(incident);
              }
            }
          } catch (error) {
            console.warn('Error parsing incident from metadata:', error);
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
      // Search for all incident types
      const response = await this.makeRequest('POST', `/sdk/vector/${this.vectorStoreName}/search`, {
        query: 'incident food gas power shelter debris powerline hazard',
        limit: 10000,
        similarity: 0.1 // Very low similarity to get all results
      });

      // Parse incidents from vector store response
      const incidents: Incident[] = [];
      if (response.results) {
        for (const result of response.results) {
          try {
            // Extract incident data from metadata
            const metadata = result.metadata;
            if (metadata && metadata.incident_id) {
              const incident: Incident = {
                id: metadata.incident_id,
                lat: metadata.lat,
                lng: metadata.lng,
                type: metadata.type,
                description: metadata.description,
                timestamp: new Date(metadata.timestamp),
                reportedBy: metadata.reported_by
              };
              incidents.push(incident);
            }
          } catch (error) {
            console.warn('Error parsing incident from metadata:', error);
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