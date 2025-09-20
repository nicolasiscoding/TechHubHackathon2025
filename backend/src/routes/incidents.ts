import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Incident, IncidentRequest, ValhallaExclusionResponse } from '../types';
import { SpatialStorage } from '../services/spatialStorage';
import { AgentuityClient } from '../services/agentuityClient';

const router = Router();

// Initialize Agentuity client - COMMENTED OUT FOR DEMO
// const agentuityApiKey = process.env.AGENTUITY_API_KEY;
// let agentuityClient: AgentuityClient | null = null;

// if (agentuityApiKey) {
//   try {
//     agentuityClient = new AgentuityClient(agentuityApiKey);
//     console.log('✅ Agentuity client initialized');
//   } catch (error) {
//     console.error('❌ Failed to initialize Agentuity client:', error);
//     console.log('⚠️  Falling back to in-memory storage');
//   }
// } else {
//   console.log('⚠️  No AGENTUITY_API_KEY found, using in-memory storage');
// }

console.log('🚧 Demo Mode: Using seeded in-memory storage');

// In-memory storage with demo incidents
const incidents: Incident[] = [
  // Demo incidents along Miami -> West Palm Beach route
  {
    id: 'demo-debris-1',
    lat: 26.1224,
    lng: -80.1373,
    type: 'debris_road',
    description: 'Large tree blocking I-95 northbound near Fort Lauderdale',
    timestamp: new Date(),
    reportedBy: 'Highway Patrol'
  },
  {
    id: 'demo-debris-2',
    lat: 26.3683,
    lng: -80.1289,
    type: 'debris_road',
    description: 'Construction debris blocking right lane on I-95 near Boca Raton',
    timestamp: new Date(),
    reportedBy: 'DOT Crew'
  },
  {
    id: 'demo-powerline-1',
    lat: 26.5012,
    lng: -80.0956,
    type: 'downed_powerline',
    description: 'Live power line down across Yamato Road - EXTREMELY DANGEROUS',
    timestamp: new Date(),
    reportedBy: 'FPL Emergency'
  },
  // Some positive resources too
  {
    id: 'demo-food-1',
    lat: 26.2341,
    lng: -80.1145,
    type: 'food_available',
    description: 'Red Cross emergency food distribution at Pompano Beach Community Center',
    timestamp: new Date(),
    reportedBy: 'Red Cross Volunteer'
  },
  {
    id: 'demo-gas-1',
    lat: 25.9012,
    lng: -80.1534,
    type: 'gas_available',
    description: 'Shell station on Federal Highway has fuel - no wait time',
    timestamp: new Date(),
    reportedBy: 'Local Resident'
  }
];

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

    // Store incident in memory for demo
    const geohash = SpatialStorage.generateGeohashKey(incident.lat, incident.lng);
    incidents.push({ ...incident, geohash } as any);

    console.log(`📍 New incident reported: ${type} at [${incident.lat}, ${incident.lng}]`);
    console.log(`🗺️ Total incidents in memory: ${incidents.length}`);
    res.status(201).json(incident);

    // Agentuity storage commented out for demo
    // try {
    //   if (agentuityClient) {
    //     await agentuityClient.storeIncident(incident);
    //   }
    // } catch (storageError) {
    //   console.error('Storage error:', storageError);
    // }
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

      // Use in-memory spatial filtering for demo
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

      // Agentuity query commented out for demo
      // try {
      //   if (agentuityClient) {
      //     relevantIncidents = await agentuityClient.getExclusionsForRoute(...);
      //   }
      // } catch (agentuityError) {
      //   console.error('Agentuity query failed:', agentuityError);
      // }

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