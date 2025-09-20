export interface Location {
  lat: number;
  lon: number;
}

export interface RouteRequest {
  locations: Location[];
  costing: 'auto' | 'bicycle' | 'pedestrian';
  exclude?: {
    locations: Location[];
  };
  directions_options?: {
    units: 'miles' | 'kilometers';
  };
}

export interface Maneuver {
  type: number;
  instruction: string;
  verbal_pre_transition_instruction?: string;
  street_names?: string[];
  time: number;
  length: number;
  begin_shape_index: number;
  end_shape_index: number;
}

export interface RouteLeg {
  maneuvers: Maneuver[];
  summary: {
    time: number;
    length: number;
    min_lat: number;
    min_lon: number;
    max_lat: number;
    max_lon: number;
  };
  shape: string; // Encoded polyline
}

export interface RouteResponse {
  trip: {
    locations: Location[];
    legs: RouteLeg[];
    summary: {
      time: number;
      length: number;
      min_lat: number;
      min_lon: number;
      max_lat: number;
      max_lon: number;
    };
    status_message: string;
    status: number;
    units: string;
  };
}

export class ValhallaClient {
  private baseUrl: string;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 1100; // 1.1 seconds to be safe

  constructor(baseUrl: string = 'https://valhalla1.openstreetmap.de') {
    this.baseUrl = baseUrl;
  }

  /**
   * Throttle requests to respect Valhalla's 1 call/user/sec rate limit
   */
  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏱️ Throttling Valhalla request: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Calculate route between locations
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    try {
      // Throttle request to respect rate limits
      await this.throttleRequest();

      // Add AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${this.baseUrl}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          directions_options: {
            units: 'miles',
            ...request.directions_options,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Valhalla API error: ${response.status} ${response.statusText}`);
        throw new Error(`Valhalla API error: ${response.status} ${response.statusText}`);
      }

      const routeData = await response.json() as RouteResponse;

      if (routeData.trip.status !== 0) {
        throw new Error(`Route calculation failed: ${routeData.trip.status_message}`);
      }

      return routeData;
    } catch (error) {
      console.error('Error calculating route:', error);
      throw error;
    }
  }

  /**
   * Calculate route with incident exclusions
   */
  async calculateRouteWithExclusions(
    start: Location,
    end: Location,
    exclusions: Location[],
    costing: 'auto' | 'bicycle' | 'pedestrian' = 'auto'
  ): Promise<RouteResponse> {
    const request: RouteRequest = {
      locations: [start, end],
      costing,
      directions_options: { units: 'miles' },
    };

    // Add exclusions if any
    if (exclusions.length > 0) {
      request.exclude = { locations: exclusions };
    }

    return this.calculateRoute(request);
  }

  /**
   * Calculate multiple route options (with and without exclusions for comparison)
   */
  async calculateRouteOptions(
    start: Location,
    end: Location,
    exclusions: Location[],
    costing: 'auto' | 'bicycle' | 'pedestrian' = 'auto'
  ): Promise<{
    optimal: RouteResponse;
    baseline: RouteResponse;
    avoided_incidents: number;
  }> {
    try {
      // Calculate routes sequentially to respect rate limits (not parallel)
      console.log('🛣️ Calculating optimal route with incident exclusions...');
      const optimalRoute = await this.calculateRouteWithExclusions(start, end, exclusions, costing);

      console.log('🛣️ Calculating baseline route without exclusions...');
      const baselineRoute = await this.calculateRouteWithExclusions(start, end, [], costing);

      return {
        optimal: optimalRoute,
        baseline: baselineRoute,
        avoided_incidents: exclusions.length,
      };
    } catch (error: any) {
      console.error('Error calculating route options:', error);

      // If Valhalla is having issues, try a simpler approach
      if (error.message?.includes('504') || error.message?.includes('timeout')) {
        console.log('⚠️ Valhalla timeout - trying simple route without exclusions...');
        try {
          // Just try to get a basic route without any exclusions
          const simpleRoute = await this.calculateRouteWithExclusions(start, end, [], costing);
          return {
            optimal: simpleRoute,
            baseline: simpleRoute,
            avoided_incidents: 0,
          };
        } catch (fallbackError) {
          console.error('Fallback route also failed:', fallbackError);
        }
      }

      throw error;
    }
  }

  /**
   * Format route summary for API response
   */
  formatRouteSummary(route: RouteResponse) {
    const summary = route.trip.summary;
    return {
      distance_miles: Math.round(summary.length * 10) / 10,
      duration_minutes: Math.round(summary.time / 60),
      duration_seconds: summary.time,
      bounds: {
        min_lat: summary.min_lat,
        min_lon: summary.min_lon,
        max_lat: summary.max_lat,
        max_lon: summary.max_lon,
      },
    };
  }

  /**
   * Extract turn-by-turn directions
   */
  extractDirections(route: RouteResponse) {
    const directions: Array<{
      instruction: string;
      distance_miles: number;
      duration_seconds: number;
      street_names?: string[];
    }> = [];

    for (const leg of route.trip.legs) {
      for (const maneuver of leg.maneuvers) {
        directions.push({
          instruction: maneuver.instruction,
          distance_miles: Math.round(maneuver.length * 10) / 10,
          duration_seconds: Math.round(maneuver.time),
          street_names: maneuver.street_names,
        });
      }
    }

    return directions;
  }
}