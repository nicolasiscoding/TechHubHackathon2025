"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import SearchBar from "@/components/SearchBar"
import IncidentReportModal from "@/components/IncidentReportModal"
import RouteCalculator from "@/components/RouteCalculator"
import { ThemeToggle } from "@/components/ThemeToggle"
import { incidentAPI, Incident, RouteResponse } from "@/lib/api"

// Dynamic import for Beautiful MapView to avoid SSR issues
const BeautifulMapView = dynamic(() => import("@/components/BeautifulMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-6 text-xl font-semibold text-gray-700 dark:text-gray-300">Loading beautiful map...</p>
      </div>
    </div>
  ),
})


export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [currentRoute, setCurrentRoute] = useState<RouteResponse | null>(null)

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setIsLoading(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setIsLoading(false)
        }
      )
    } else {
      setIsLoading(false)
    }

    // Load incidents from backend API
    loadIncidents()
  }, [])

  const loadIncidents = async () => {
    try {
      const fetchedIncidents = await incidentAPI.getIncidents()
      setIncidents(fetchedIncidents)
    } catch (error) {
      console.error("Failed to load incidents:", error)
      // Keep using sample data as fallback for now
    }
  }

  const handleSearch = (query: string) => {
    console.log("Searching for:", query)
    // Implement search functionality
    // This would typically geocode the address and update the map center
  }

  const handleNavigate = (destination: string) => {
    console.log("Navigating to:", destination)
    // Implement navigation functionality
    // This would typically calculate a route and display it on the map
  }

  const handleReportIncident = async (incidentData: {
    type: string
    description: string
    location?: { lat: number; lng: number }
  }) => {
    try {
      // Send incident to backend API
      const newIncident = await incidentAPI.createIncident({
        type: incidentData.type,
        description: incidentData.description,
        location: incidentData.location || userLocation
      })

      // Add to local state for immediate UI update
      setIncidents(prev => [...prev, newIncident])
      console.log("New incident reported:", newIncident)
    } catch (error) {
      console.error("Failed to report incident:", error)
      alert("Failed to report incident. Please try again.")
    }
  }

  const handleRouteCalculated = (route: RouteResponse) => {
    setCurrentRoute(route)
    console.log('Route received in main component:', route)
  }

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* Beautiful Map View */}
      <BeautifulMapView incidents={incidents} userLocation={userLocation} currentRoute={currentRoute} />

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        onNavigate={handleNavigate}
      />

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Incident Report Button */}
      <IncidentReportModal
        onReportIncident={handleReportIncident}
        currentLocation={userLocation}
      />

      {/* Route Calculator */}
      <RouteCalculator
        onRouteCalculated={handleRouteCalculated}
        userLocation={userLocation}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Getting your location...</p>
          </div>
        </div>
      )}
    </main>
  );
}
