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
  // ===============================
  // FLORIDA TURNPIKE CORRIDOR INCIDENTS
  // Tamarac (City Furniture area) to West Palm Beach
  // ===============================

  // TAMARAC AREA (Starting Point - City Furniture vicinity)
  {
    id: 'turnpike-debris-1',
    lat: 26.2134, // Near Tamarac/City Furniture area
    lng: -80.2456,
    type: 'debris_road',
    description: 'Overturned delivery truck blocking Florida Turnpike southbound lanes near Commercial Blvd exit',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    reportedBy: 'FHP Trooper'
  },
  {
    id: 'turnpike-gas-1',
    lat: 26.2089,
    lng: -80.2398,
    type: 'gas_available',
    description: 'Turnpike Service Plaza - gas available, generators running, accepting cash only',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    reportedBy: 'Plaza Manager'
  },

  // SUNRISE/PLANTATION AREA
  {
    id: 'turnpike-powerline-1',
    lat: 26.1567,
    lng: -80.2234,
    type: 'downed_powerline',
    description: 'Multiple power lines down across Turnpike near Sunrise Blvd - ROAD CLOSED',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    reportedBy: 'FPL Emergency Crew'
  },
  {
    id: 'turnpike-food-1',
    lat: 26.1489,
    lng: -80.2178,
    type: 'food_available',
    description: 'Sawgrass Mills emergency food station - hot meals and water available',
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    reportedBy: 'Salvation Army'
  },

  // MIRAMAR/PEMBROKE PINES AREA
  {
    id: 'turnpike-debris-2',
    lat: 26.0234,
    lng: -80.2012,
    type: 'debris_road',
    description: 'Storm debris scattered across northbound lanes near Miramar Parkway exit',
    timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
    reportedBy: 'DOT Cleanup Crew'
  },

  // DAVIE/COOPER CITY AREA
  {
    id: 'turnpike-shelter-1',
    lat: 26.0567,
    lng: -80.2089,
    type: 'shelter_available',
    description: 'Nova Southeastern University emergency shelter - space available, pet-friendly',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    reportedBy: 'Emergency Coordinator'
  },
  {
    id: 'turnpike-debris-3',
    lat: 26.0789,
    lng: -80.2134,
    type: 'debris_road',
    description: 'Large billboard down blocking right shoulder near Griffin Road',
    timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    reportedBy: 'Motorist Report'
  },

  // HOLLYWOOD/HALLANDALE AREA
  {
    id: 'turnpike-power-1',
    lat: 25.9912,
    lng: -80.1956,
    type: 'power_available',
    description: 'Hard Rock Cafe & Casino - generator power, phone charging station open 24/7',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    reportedBy: 'Facility Manager'
  },

  // AVENTURA/NORTH MIAMI AREA
  {
    id: 'turnpike-debris-4',
    lat: 25.9345,
    lng: -80.1834,
    type: 'debris_road',
    description: 'Construction barrier blown onto roadway near Aventura Mall exit',
    timestamp: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
    reportedBy: 'Highway Patrol'
  },
  {
    id: 'turnpike-food-2',
    lat: 25.9278,
    lng: -80.1789,
    type: 'food_available',
    description: 'Aventura Mall food court open - emergency meals for storm evacuees',
    timestamp: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hours ago
    reportedBy: 'Mall Security'
  },

  // GOLDEN GLADES/MIAMI GARDENS AREA
  {
    id: 'turnpike-powerline-2',
    lat: 25.9089,
    lng: -80.1923,
    type: 'downed_powerline',
    description: 'High voltage lines down near Golden Glades interchange - AVOID AREA',
    timestamp: new Date(Date.now() - 50 * 60 * 1000), // 50 minutes ago
    reportedBy: 'FPL Emergency Response'
  },

  // SPECIFIC COORDINATE INCIDENT
  {
    id: 'custom-incident-1',
    lat: 26.368136187015857,
    lng: -80.17082661957613,
    type: 'debris_road',
    description: 'Vehicle debris blocking roadway at precise coordinates',
    timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago (very recent)
    reportedBy: 'User Report'
  },

  // ORIGINAL I-95 CORRIDOR INCIDENTS (keeping for variety)
  {
    id: 'i95-debris-1',
    lat: 26.1224,
    lng: -80.1373,
    type: 'debris_road',
    description: 'Large tree blocking I-95 northbound near Fort Lauderdale',
    timestamp: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
    reportedBy: 'Highway Patrol'
  },
  {
    id: 'i95-debris-2',
    lat: 26.3683,
    lng: -80.1289,
    type: 'debris_road',
    description: 'Construction debris blocking right lane on I-95 near Boca Raton',
    timestamp: new Date(Date.now() - 55 * 60 * 1000), // 55 minutes ago
    reportedBy: 'DOT Crew'
  },
  {
    id: 'i95-powerline-1',
    lat: 26.5012,
    lng: -80.0956,
    type: 'downed_powerline',
    description: 'Live power line down across Yamato Road - EXTREMELY DANGEROUS',
    timestamp: new Date(Date.now() - 70 * 60 * 1000), // 70 minutes ago
    reportedBy: 'FPL Emergency'
  },

  // POSITIVE RESOURCES
  {
    id: 'pompano-food',
    lat: 26.2341,
    lng: -80.1145,
    type: 'food_available',
    description: 'Red Cross emergency food distribution at Pompano Beach Community Center',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    reportedBy: 'Red Cross Volunteer'
  },
  {
    id: 'federal-gas',
    lat: 25.9012,
    lng: -80.1534,
    type: 'gas_available',
    description: 'Shell station on Federal Highway has fuel - no wait time',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    reportedBy: 'Local Resident'
  },

  // BOYNTON BEACH AREA - MAJOR INCIDENT CLUSTER
  {
    id: 'boynton-tree-1',
    lat: 26.5234,
    lng: -80.1456,
    type: 'debris_road',
    description: 'Massive oak tree down blocking all lanes at Boynton Beach Blvd & Turnpike interchange',
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    reportedBy: 'Palm Beach County Sheriff'
  },
  {
    id: 'boynton-turnpike-north-1',
    lat: 26.5345,
    lng: -80.1523,
    type: 'debris_road',
    description: 'Multi-vehicle accident with debris scattered across Turnpike northbound at MM 86',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    reportedBy: 'FHP Trooper'
  },
  {
    id: 'boynton-turnpike-south-1',
    lat: 26.5156,
    lng: -80.1412,
    type: 'downed_powerline',
    description: 'High voltage power lines down across Turnpike southbound at MM 84 - ROAD CLOSED',
    timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
    reportedBy: 'FPL Emergency Response'
  },
  {
    id: 'boynton-turnpike-north-2',
    lat: 26.5423,
    lng: -80.1567,
    type: 'debris_road',
    description: 'Construction crane toppled over blocking all Turnpike northbound lanes at MM 87',
    timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    reportedBy: 'Construction Supervisor'
  },
  {
    id: 'boynton-turnpike-south-2',
    lat: 26.5089,
    lng: -80.1389,
    type: 'debris_road',
    description: 'Jackknifed tractor-trailer blocking Turnpike southbound lanes at MM 83',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    reportedBy: 'Emergency Services'
  },

  // WEST PALM BEACH AREA (Destination)
  {
    id: 'wpb-shelter-1',
    lat: 26.7098,
    lng: -80.0789,
    type: 'shelter_available',
    description: 'West Palm Beach Convention Center - major evacuation shelter with medical support',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    reportedBy: 'Emergency Management'
  },
  {
    id: 'wpb-power-1',
    lat: 26.7156,
    lng: -80.0534,
    type: 'power_available',
    description: 'CityPlace complex has generator power - charging stations and WiFi available',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    reportedBy: 'Property Manager'
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