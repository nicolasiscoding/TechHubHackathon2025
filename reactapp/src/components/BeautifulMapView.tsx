"use client"

import { useEffect, useRef, useState } from "react"
import Map, { Marker, Popup, NavigationControl, GeolocateControl, Source, Layer } from "react-map-gl/maplibre"
import { motion, AnimatePresence } from "framer-motion"
import "maplibre-gl/dist/maplibre-gl.css"

interface Incident {
  id: string
  lat: number
  lng: number
  type: "food_available" | "gas_available" | "power_available" | "shelter_available" | "debris_road" | "downed_powerline"
  description: string
  timestamp: Date
  reportedBy?: string
}

interface RouteResponse {
  optimal_route: {
    summary: any
    directions: any[]
    geometry: string
  }
  baseline_route?: any
  avoided_incidents: number
  exclusions_used: any[]
  calculation_time_ms: number
}

interface BeautifulMapViewProps {
  incidents: Incident[]
  userLocation?: { lat: number; lng: number }
  currentRoute?: RouteResponse | null
}

const incidentConfig = {
  // Positive Resources (Green tones)
  food_available: { color: "#16a34a", icon: "🍞", label: "Food Available" },
  gas_available: { color: "#059669", icon: "⛽", label: "Gas Available" },
  power_available: { color: "#0d9488", icon: "⚡", label: "Power Available" },
  shelter_available: { color: "#0891b2", icon: "🏠", label: "Shelter Available" },

  // Negative Hazards (Red/Orange tones)
  debris_road: { color: "#dc2626", icon: "🌳", label: "Debris in Road" },
  downed_powerline: { color: "#ea580c", icon: "⚠️", label: "Downed Powerline" },
}

// Decode Valhalla polyline6 format (1e-6 precision)
const decodePolyline = (encoded: string): [number, number][] => {
  const coordinates: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0
  const factor = 1e6  // Valhalla uses 1e-6 precision

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
    lat += dlat

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
    lng += dlng

    // Valhalla returns [lng, lat] for GeoJSON compatibility
    coordinates.push([lng / factor, lat / factor])
  }

  return coordinates
}

export default function BeautifulMapView({ incidents, userLocation, currentRoute }: BeautifulMapViewProps) {
  const mapRef = useRef<any>(null)
  const [viewState, setViewState] = useState({
    longitude: -74.0060,
    latitude: 40.7128,
    zoom: 12,
  })
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [routeGeometry, setRouteGeometry] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (userLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.lng,
        latitude: userLocation.lat,
        zoom: 15,
      }))
    }
  }, [userLocation])

  // Handle route visualization
  useEffect(() => {
    if (currentRoute && currentRoute.optimal_route.geometry) {
      console.log('🗺️ Route received in map component:', currentRoute)
      console.log('📍 Route summary:', {
        distance: `${currentRoute.optimal_route.summary.distance_miles} miles`,
        duration: `${currentRoute.optimal_route.summary.duration_minutes} minutes`,
        avoided_incidents: currentRoute.avoided_incidents
      })

      // Decode the polyline geometry
      const coordinates = decodePolyline(currentRoute.optimal_route.geometry)

      // Create GeoJSON for the route
      const routeGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }

      setRouteGeometry(routeGeoJSON)
      console.log('🛣️ Route decoded with', coordinates.length, 'points')

      // Fit map to route bounds
      if (mapRef.current && coordinates.length > 0) {
        const bounds = coordinates.reduce(
          (bounds, coord) => {
            return {
              minLng: Math.min(bounds.minLng, coord[0]),
              minLat: Math.min(bounds.minLat, coord[1]),
              maxLng: Math.max(bounds.maxLng, coord[0]),
              maxLat: Math.max(bounds.maxLat, coord[1])
            }
          },
          {
            minLng: coordinates[0][0],
            minLat: coordinates[0][1],
            maxLng: coordinates[0][0],
            maxLat: coordinates[0][1]
          }
        )

        mapRef.current.fitBounds(
          [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
          { padding: 50, duration: 1000 }
        )
      }

      if (currentRoute.avoided_incidents > 0) {
        console.log(`🚧 Successfully avoided ${currentRoute.avoided_incidents} incidents!`)
        console.log('📍 Excluded locations:', currentRoute.exclusions_used)
      }
    }
  }, [currentRoute])

  const IncidentMarker = ({ incident }: { incident: Incident }) => {
    const config = incidentConfig[incident.type]

    return (
      <Marker
        longitude={incident.lng}
        latitude={incident.lat}
        anchor="center"
        onClick={(e) => {
          e.originalEvent.stopPropagation()
          setSelectedIncident(incident)
        }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative cursor-pointer"
        >
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 opacity-60"
            style={{ borderColor: config.color }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Main marker */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white backdrop-blur-sm"
            style={{ backgroundColor: config.color }}
          >
            <span className="text-lg">{config.icon}</span>
          </div>

          {/* Badge for recent incidents */}
          {Date.now() - new Date(incident.timestamp).getTime() < 30 * 60 * 1000 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
            />
          )}
        </motion.div>
      </Marker>
    )
  }

  const UserLocationMarker = () => {
    if (!userLocation) return null

    return (
      <Marker
        longitude={userLocation.lng}
        latitude={userLocation.lat}
        anchor="center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 w-8 h-8 rounded-full bg-blue-500 opacity-30"
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* User dot */}
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
        </motion.div>
      </Marker>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={() => setMapLoaded(true)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        attributionControl={false}
        maxZoom={20}
        minZoom={3}
      >
        {/* Navigation Controls */}
        <NavigationControl position="bottom-right" showCompass showZoom />

        {/* Geolocate Control */}
        <GeolocateControl position="bottom-right" trackUserLocation />

        {/* Route Layer */}
        {routeGeometry && mapLoaded && (
          <Source id="route" type="geojson" data={routeGeometry}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 5,
                'line-opacity': 0.8
              }}
            />
            <Layer
              id="route-outline"
              type="line"
              paint={{
                'line-color': '#1e40af',
                'line-width': 8,
                'line-opacity': 0.4
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round'
              }}
              beforeId="route-line"
            />
          </Source>
        )}

        {/* User Location */}
        <UserLocationMarker />

        {/* Incident Markers */}
        <AnimatePresence>
          {incidents.map((incident) => (
            <IncidentMarker key={incident.id} incident={incident} />
          ))}
        </AnimatePresence>

        {/* Selected Incident Popup */}
        {selectedIncident && (
          <Popup
            longitude={selectedIncident.lng}
            latitude={selectedIncident.lat}
            anchor="bottom"
            onClose={() => setSelectedIncident(null)}
            closeButton={false}
            className="incident-popup"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4 max-w-xs"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{incidentConfig[selectedIncident.type].icon}</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {incidentConfig[selectedIncident.type].label}
                </h3>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {selectedIncident.description}
              </p>

              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{new Date(selectedIncident.timestamp).toLocaleTimeString()}</span>
                {selectedIncident.reportedBy && (
                  <span>by {selectedIncident.reportedBy}</span>
                )}
              </div>
            </motion.div>
          </Popup>
        )}
      </Map>

      {/* Loading overlay */}
      <AnimatePresence>
        {!mapLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center z-50"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                Loading beautiful map...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}