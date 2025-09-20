"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import SearchBar from "@/components/SearchBar"
import IncidentReportModal from "@/components/IncidentReportModal"
import { ThemeToggle } from "@/components/ThemeToggle"

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

interface Incident {
  id: string
  lat: number
  lng: number
  type: "food_available" | "gas_available" | "power_available" | "shelter_available" | "debris_road" | "downed_powerline"
  description: string
  timestamp: Date
  reportedBy?: string
}

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>()
  const [isLoading, setIsLoading] = useState(true)

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

    // Load sample incidents (in a real app, this would come from an API)
    const sampleIncidents: Incident[] = [
      // Positive Resources
      {
        id: "1",
        lat: 40.7200,
        lng: -74.0060,
        type: "food_available",
        description: "Community center has hot meals 8am-6pm. Free for all. Volunteers needed!",
        timestamp: new Date(),
        reportedBy: "CommunityVol"
      },
      {
        id: "2",
        lat: 40.7150,
        lng: -74.0100,
        type: "power_available",
        description: "Public library has power and wifi. Phone charging station set up.",
        timestamp: new Date(),
        reportedBy: "LibraryStaff"
      },
      {
        id: "3",
        lat: 40.7100,
        lng: -74.0020,
        type: "gas_available",
        description: "Shell station on Main St has gas. $3.89/gal. No limit per customer.",
        timestamp: new Date(),
        reportedBy: "LocalResident"
      },
      {
        id: "4",
        lat: 40.7250,
        lng: -74.0080,
        type: "shelter_available",
        description: "High school gym open as emergency shelter. Cots and blankets available.",
        timestamp: new Date(),
        reportedBy: "EmergencyCoord"
      },

      // Negative Hazards
      {
        id: "5",
        lat: 40.7080,
        lng: -74.0040,
        type: "debris_road",
        description: "Large tree blocking Oak Ave between 1st and 2nd St. Detour via Pine St.",
        timestamp: new Date(),
        reportedBy: "FirstResponder"
      },
      {
        id: "6",
        lat: 40.7300,
        lng: -74.0120,
        type: "downed_powerline",
        description: "Live power line down on Elm Street. STAY AWAY! Crews en route.",
        timestamp: new Date(),
        reportedBy: "UtilityCrew"
      }
    ]
    setIncidents(sampleIncidents)
  }, [])

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

  const handleReportIncident = (incidentData: {
    type: string
    description: string
    location?: { lat: number; lng: number }
  }) => {
    const newIncident: Incident = {
      id: Date.now().toString(),
      lat: incidentData.location?.lat || userLocation?.lat || 40.7128,
      lng: incidentData.location?.lng || userLocation?.lng || -74.0060,
      type: incidentData.type as Incident["type"],
      description: incidentData.description,
      timestamp: new Date(),
      reportedBy: "CurrentUser"
    }

    setIncidents(prev => [...prev, newIncident])
    console.log("New incident reported:", newIncident)
  }

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* Beautiful Map View */}
      <BeautifulMapView incidents={incidents} userLocation={userLocation} />

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
