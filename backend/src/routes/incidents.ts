import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Incident, IncidentRequest, ValhallaExclusionResponse } from '../types';
import { SpatialStorage } from '../services/spatialStorage';
import { AgentuityClient } from '../services/agentuityClient';

const router = Router();

// Initialize Agentuity client
const agentuityApiKey = process.env.AGENTUITY_API_KEY;
let agentuityClient: AgentuityClient | null = null;

if (agentuityApiKey) {
  try {
    agentuityClient = new AgentuityClient(agentuityApiKey);
    console.log('✅ Agentuity client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Agentuity client:', error);
    console.log('⚠️  Falling back to in-memory storage');
  }
} else {
  console.log('⚠️  No AGENTUITY_API_KEY found, using in-memory storage');
}

// In-memory storage fallback
const incidents: Incident[] = [];

/**
 * POST /api/incidents
 * Create a new incident report
 */
router.post('/', async (req: Request<{}, Incident, IncidentRequest>, res: Response<Incident>) => {
  try {
    const { type, description, location } = req.body;

    // Validate required fields
    if (!type || !description) {
      return res.status(400).json({
        error: 'Missing required fields: type and description'
      } as any);
    }

    // Create new incident
    const incident: Incident = {
      id: randomUUID(),
      lat: location?.lat || 0, // Default coordinates if not provided
      lng: location?.lng || 0,
      type: type as Incident['type'],
      description,
      timestamp: new Date(),
      reportedBy: 'Anonymous' // For now
    };

    // Store incident with Agentuity + fallback
    try {
      if (agentuityClient) {
        await agentuityClient.storeIncident(incident);
      }

      // Always store in memory as cache/fallback
      const geohash = SpatialStorage.generateGeohashKey(incident.lat, incident.lng);
      incidents.push({ ...incident, geohash } as any);

      console.log(`New incident reported: ${type} at [${incident.lat}, ${incident.lng}]`);
      res.status(201).json(incident);
    } catch (storageError) {
      console.error('Storage error:', storageError);
      // Still store in memory if Agentuity fails
      const geohash = SpatialStorage.generateGeohashKey(incident.lat, incident.lng);
      incidents.push({ ...incident, geohash } as any);
      res.status(201).json(incident);
    }
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Internal server error' } as any);
  }
});

/**
 * GET /api/incidents
 * Get all incidents
 */
router.get('/', (req: Request, res: Response<Incident[]>) => {
  res.json(incidents);
});

/**
 * GET /api/incidents/exclusions
 * Get Valhalla-formatted exclusion coordinates for negative incidents
 * Query params: ?startLat=40.7&startLng=-74&endLat=40.8&endLng=-73.9&buffer=2
 */
router.get('/exclusions', async (req: Request, res: Response<ValhallaExclusionResponse>) => {
  try {
    const { startLat, startLng, endLat, endLng, buffer } = req.query;

    let relevantIncidents: Incident[] = [];

    if (startLat && startLng && endLat && endLng) {
      // Use spatial filtering for route-specific exclusions
      const bufferKm = buffer ? parseFloat(buffer as string) : 2;

      try {
        if (agentuityClient) {
          // Use Agentuity for spatial query
          relevantIncidents = await agentuityClient.getExclusionsForRoute(
            parseFloat(startLat as string),
            parseFloat(startLng as string),
            parseFloat(endLat as string),
            parseFloat(endLng as string),
            bufferKm
          );
        } else {
          // Fallback to in-memory spatial filtering
          const bounds = SpatialStorage.calculateRouteBounds(
            parseFloat(startLat as string),
            parseFloat(startLng as string),
            parseFloat(endLat as string),
            parseFloat(endLng as string),
            bufferKm
          );

          relevantIncidents = incidents.filter(incident => {
            const withinBounds = incident.lat >= bounds.south &&
                               incident.lat <= bounds.north &&
                               incident.lng >= bounds.west &&
                               incident.lng <= bounds.east;

            const isNegative = incident.type === 'debris_road' || incident.type === 'downed_powerline';
            const hoursAgo = (Date.now() - incident.timestamp.getTime()) / (1000 * 60 * 60);
            const isRecent = hoursAgo <= 24;

            return withinBounds && isNegative && isRecent;
          });
        }
      } catch (agentuityError) {
        console.error('Agentuity query failed, falling back to in-memory:', agentuityError);
        // Fallback to in-memory spatial filtering
        const bounds = SpatialStorage.calculateRouteBounds(
          parseFloat(startLat as string),
          parseFloat(startLng as string),
          parseFloat(endLat as string),
          parseFloat(endLng as string),
          bufferKm
        );

        relevantIncidents = incidents.filter(incident => {
          const withinBounds = incident.lat >= bounds.south &&
                             incident.lat <= bounds.north &&
                             incident.lng >= bounds.west &&
                             incident.lng <= bounds.east;

          const isNegative = incident.type === 'debris_road' || incident.type === 'downed_powerline';
          const hoursAgo = (Date.now() - incident.timestamp.getTime()) / (1000 * 60 * 60);
          const isRecent = hoursAgo <= 24;

          return withinBounds && isNegative && isRecent;
        });
      }

      console.log(`Found ${relevantIncidents.length} incidents within ${bufferKm}km of route`);
    } else {
      // Fallback: get all recent negative incidents
      const negativeIncidents = incidents.filter(incident =>
        incident.type === 'debris_road' || incident.type === 'downed_powerline'
      );

      relevantIncidents = negativeIncidents.filter(incident => {
        const hoursAgo = (Date.now() - incident.timestamp.getTime()) / (1000 * 60 * 60);
        return hoursAgo <= 24;
      });
    }

    // Format for Valhalla
    const exclude_locations = relevantIncidents.map(incident => ({
      lat: incident.lat,
      lon: incident.lng // Convert lng to lon for Valhalla
    }));

    console.log(`Returning ${exclude_locations.length} exclusion coordinates for Valhalla`);

    res.json({ exclude_locations });
  } catch (error) {
    console.error('Error getting exclusions:', error);
    res.status(500).json({ error: 'Internal server error' } as any);
  }
});

export default router;