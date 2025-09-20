export interface Incident {
  id: string;
  lat: number;
  lng: number;
  type: 'food_available' | 'gas_available' | 'power_available' | 'shelter_available' | 'debris_road' | 'downed_powerline';
  description: string;
  timestamp: Date;
  reportedBy?: string;
}

export interface ExclusionCoordinate {
  lat: number;
  lon: number; // Valhalla uses 'lon' not 'lng'
}

export interface IncidentRequest {
  type: string;
  description: string;
  location?: { lat: number; lng: number };
}

export interface ValhallaExclusionResponse {
  exclude_locations: ExclusionCoordinate[];
}