import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Incident, IncidentRequest, ValhallaExclusionResponse } from '../types';

const router = Router();

// In-memory storage for now (will replace with Agenuity later)
const incidents: Incident[] = [];

/**
 * POST /api/incidents
 * Create a new incident report
 */
router.post('/', (req: Request<{}, Incident, IncidentRequest>, res: Response<Incident>) => {
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

    // Store incident
    incidents.push(incident);

    console.log(`New incident reported: ${type} at [${incident.lat}, ${incident.lng}]`);

    res.status(201).json(incident);
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
 */
router.get('/exclusions', (req: Request, res: Response<ValhallaExclusionResponse>) => {
  try {
    // Filter for negative incidents (hazards)
    const negativeIncidents = incidents.filter(incident =>
      incident.type === 'debris_road' || incident.type === 'downed_powerline'
    );

    // Filter for recent incidents (last 24 hours)
    const recentIncidents = negativeIncidents.filter(incident => {
      const hoursAgo = (Date.now() - incident.timestamp.getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 24;
    });

    // Format for Valhalla
    const exclude_locations = recentIncidents.map(incident => ({
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