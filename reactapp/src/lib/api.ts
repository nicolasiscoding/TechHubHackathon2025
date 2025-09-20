const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface Incident {
  id: string
  lat: number
  lng: number
  type: "food_available" | "gas_available" | "power_available" | "shelter_available" | "debris_road" | "downed_powerline"
  description: string
  timestamp: Date
  reportedBy?: string
}

export interface IncidentRequest {
  type: string
  description: string
  location?: { lat: number; lng: number }
}

export interface Location {
  lat: number
  lon: number
}

export interface RouteRequest {
  start: Location
  end: Location
  costing?: 'auto' | 'bicycle' | 'pedestrian'
  avoid_incidents?: boolean
  buffer_km?: number
}

export interface RouteSummary {
  distance_miles: number
  duration_minutes: number
  duration_seconds: number
  bounds: {
    min_lat: number
    min_lon: number
    max_lat: number
    max_lon: number
  }
}

export interface RouteDirection {
  instruction: string
  distance_miles: number
  duration_seconds: number
  street_names?: string[]
}

export interface RouteResponse {
  optimal_route: {
    summary: RouteSummary
    directions: RouteDirection[]
    geometry: string
  }
  baseline_route?: {
    summary: RouteSummary
    directions: RouteDirection[]
    geometry: string
  }
  avoided_incidents: number
  exclusions_used: Location[]
  calculation_time_ms: number
}

export const incidentAPI = {
  async createIncident(incident: IncidentRequest): Promise<Incident> {
    const response = await fetch(`${API_BASE_URL}/api/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incident),
    })

    if (!response.ok) {
      throw new Error(`Failed to create incident: ${response.statusText}`)
    }

    return response.json()
  },

  async getIncidents(): Promise<Incident[]> {
    const response = await fetch(`${API_BASE_URL}/api/incidents`)

    if (!response.ok) {
      throw new Error(`Failed to fetch incidents: ${response.statusText}`)
    }

    const incidents = await response.json()
    // Convert timestamp strings back to Date objects
    return incidents.map((incident: any) => ({
      ...incident,
      timestamp: new Date(incident.timestamp)
    }))
  }
}

export const routeAPI = {
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to calculate route: ${response.statusText}`)
    }

    return response.json()
  },

  async calculateSimpleRoute(start: Location, end: Location, costing: 'auto' | 'bicycle' | 'pedestrian' = 'auto') {
    const response = await fetch(`${API_BASE_URL}/api/routes/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ start, end, costing }),
    })

    if (!response.ok) {
      throw new Error(`Failed to calculate simple route: ${response.statusText}`)
    }

    return response.json()
  }
}