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