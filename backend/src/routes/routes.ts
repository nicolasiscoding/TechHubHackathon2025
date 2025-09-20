import { Router, Request, Response } from 'express';
import { ValhallaClient, Location } from '../services/valhallaClient';
import { AgentuityClient } from '../services/agentuityClient';
import { SpatialStorage } from '../services/spatialStorage';

const router = Router();

// Initialize clients
const valhallaClient = new ValhallaClient();

// Agentuity commented out for demo
// const agentuityApiKey = process.env.AGENTUITY_API_KEY;
// let agentuityClient: AgentuityClient | null = null;

// if (agentuityApiKey) {
//   try {
//     agentuityClient = new AgentuityClient(agentuityApiKey);
//   } catch (error) {
//     console.error('Failed to initialize Agentuity client for routing:', error);
//   }
// }

interface RouteCalculationRequest {
  start: Location;
  end: Location;
  costing?: 'auto' | 'bicycle' | 'pedestrian';
  avoid_incidents?: boolean;
  buffer_km?: number;
}

interface RouteCalculationResponse {
  optimal_route: {
    summary: any;
    directions: any[];
    geometry: string;
  };
  baseline_route?: {
    summary: any;
    directions: any[];
    geometry: string;
  };
  avoided_incidents: number;
  exclusions_used: Location[];
  calculation_time_ms: number;
}

/**
 * POST /api/routes
 * Calculate optimal route with incident avoidance
 */
router.post('/', async (req: Request<{}, RouteCalculationResponse, RouteCalculationRequest>, res: Response<RouteCalculationResponse>) => {
  const startTime = Date.now();

  try {
    const {
      start,
      end,
      costing = 'auto',
      avoid_incidents = true,
      buffer_km = 2
    } = req.body;

    // Validate required fields
    if (!start?.lat || !start?.lon || !end?.lat || !end?.lon) {
      return res.status(400).json({
        error: 'Missing required fields: start and end locations with lat/lon'
      } as any);
    }

    let exclusions: Location[] = [];

    // Get incident exclusions if requested - using demo API
    if (avoid_incidents) {
      try {
        // Use the incidents exclusions endpoint to get hazards
        const response = await fetch(`http://localhost:3001/api/incidents/exclusions?startLat=${start.lat}&startLng=${start.lon}&endLat=${end.lat}&endLng=${end.lon}&buffer=${buffer_km}`);

        if (response.ok) {
          const exclusionData = await response.json() as { exclude_locations?: Location[] };
          exclusions = exclusionData.exclude_locations || [];
          console.log(`🚧 Found ${exclusions.length} incidents to avoid along route`);
        } else {
          console.log('Failed to get exclusions from incidents API');
        }
      } catch (error) {
        console.error('Error getting incident exclusions:', error);
        // Continue without exclusions rather than failing
      }
    }

    // Calculate route with Valhalla
    const routeOptions = await valhallaClient.calculateRouteOptions(
      start,
      end,
      exclusions,
      costing
    );

    // Format response
    const response: RouteCalculationResponse = {
      optimal_route: {
        summary: valhallaClient.formatRouteSummary(routeOptions.optimal),
        directions: valhallaClient.extractDirections(routeOptions.optimal),
        geometry: routeOptions.optimal.trip.legs[0]?.shape || ''
      },
      baseline_route: {
        summary: valhallaClient.formatRouteSummary(routeOptions.baseline),
        directions: valhallaClient.extractDirections(routeOptions.baseline),
        geometry: routeOptions.baseline.trip.legs[0]?.shape || ''
      },
      avoided_incidents: routeOptions.avoided_incidents,
      exclusions_used: exclusions,
      calculation_time_ms: Date.now() - startTime
    };

    console.log(`Route calculated: ${response.optimal_route.summary.distance_miles} miles, ${response.optimal_route.summary.duration_minutes} minutes, avoided ${response.avoided_incidents} incidents`);

    res.json(response);
  } catch (error) {
    console.error('Error calculating route:', error);
    res.status(500).json({
      error: 'Failed to calculate route',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as any);
  }
});

/**
 * POST /api/routes/simple
 * Simple route calculation without incident avoidance
 */
router.post('/simple', async (req: Request, res: Response) => {
  try {
    const { start, end, costing = 'auto' } = req.body;

    if (!start?.lat || !start?.lon || !end?.lat || !end?.lon) {
      return res.status(400).json({
        error: 'Missing required fields: start and end locations with lat/lon'
      });
    }

    const route = await valhallaClient.calculateRouteWithExclusions(
      start,
      end,
      [], // No exclusions
      costing
    );

    const response = {
      summary: valhallaClient.formatRouteSummary(route),
      directions: valhallaClient.extractDirections(route),
      geometry: route.trip.legs[0]?.shape || ''
    };

    res.json(response);
  } catch (error) {
    console.error('Error calculating simple route:', error);
    res.status(500).json({
      error: 'Failed to calculate route',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/routes/test
 * Test endpoint for route calculation
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    // Test Miami to West Palm Beach route
    const testRoute = await valhallaClient.calculateRouteWithExclusions(
      { lat: 25.7617, lon: -80.1918 }, // Miami
      { lat: 26.7153, lon: -80.0534 }, // West Palm Beach
      []
    );

    res.json({
      message: 'Valhalla routing is working!',
      test_route: {
        distance_miles: valhallaClient.formatRouteSummary(testRoute).distance_miles,
        duration_minutes: valhallaClient.formatRouteSummary(testRoute).duration_minutes,
        status: testRoute.trip.status_message
      }
    });
  } catch (error) {
    console.error('Route test failed:', error);
    res.status(500).json({
      error: 'Route test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;