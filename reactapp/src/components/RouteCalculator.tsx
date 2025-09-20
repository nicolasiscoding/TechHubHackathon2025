"use client"

import { useState } from "react"
import { Navigation, MapPin, Clock, Route, Zap, Car, Bike, Footprints } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { routeAPI, RouteResponse, Location } from "@/lib/api"

interface RouteCalculatorProps {
  onRouteCalculated?: (route: RouteResponse) => void
  userLocation?: { lat: number; lng: number }
}

export default function RouteCalculator({
  onRouteCalculated,
  userLocation
}: RouteCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [route, setRoute] = useState<RouteResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [startLocation, setStartLocation] = useState("")
  const [endLocation, setEndLocation] = useState("")
  const [transportMode, setTransportMode] = useState<'auto' | 'bicycle' | 'pedestrian'>('auto')
  const [avoidIncidents, setAvoidIncidents] = useState(true)

  const transportModes = [
    { value: 'auto', label: 'Driving', icon: Car },
    { value: 'bicycle', label: 'Cycling', icon: Bike },
    { value: 'pedestrian', label: 'Walking', icon: Footprints },
  ] as const

  // Simple geocoding function (in real app, would use proper geocoding service)
  const parseLocation = (locationStr: string): Location | null => {
    // Try to parse "lat,lng" format
    const coords = locationStr.split(',').map(s => parseFloat(s.trim()))
    if (coords.length === 2 && !coords.some(isNaN)) {
      return { lat: coords[0], lon: coords[1] }
    }
    return null
  }

  const handleCalculateRoute = async () => {
    try {
      setIsCalculating(true)
      setError(null)

      // Parse locations
      const start = parseLocation(startLocation)
      const end = parseLocation(endLocation)

      if (!start || !end) {
        throw new Error('Please enter valid coordinates (lat,lng format)')
      }

      // Calculate route
      const routeResult = await routeAPI.calculateRoute({
        start,
        end,
        costing: transportMode,
        avoid_incidents: avoidIncidents,
        buffer_km: 2
      })

      setRoute(routeResult)
      onRouteCalculated?.(routeResult)

      console.log('Route calculated:', routeResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate route')
      console.error('Route calculation error:', err)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setStartLocation(`${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setRoute(null)
    setError(null)
  }

  return (
    <>
      {/* Floating Route Button */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-20"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative"
        >
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-green-500 opacity-75"
            animate={{ scale: [1, 1.2, 1], opacity: [0.75, 0.3, 0.75] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <Button
            size="lg"
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 border-2 border-white/20 backdrop-blur-sm relative"
          >
            <Navigation className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Route Calculator Modal */}
      <AnimatePresence>
        {isOpen && (
          <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-[98vw] sm:max-w-[550px] max-h-[85vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 z-[1600]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    🗺️ Smart Route Planner
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-300">
                    Calculate optimal routes avoiding real-time incidents
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Location Inputs */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        Start Location
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="25.7617, -80.1918 (Miami)"
                          value={startLocation}
                          onChange={(e) => setStartLocation(e.target.value)}
                          className="flex-1"
                        />
                        {userLocation && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUseCurrentLocation}
                            className="px-3"
                          >
                            Use Current
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-600" />
                        Destination
                      </Label>
                      <Input
                        placeholder="26.7153, -80.0534 (West Palm Beach)"
                        value={endLocation}
                        onChange={(e) => setEndLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Transport Mode */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Transport Mode</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {transportModes.map((mode) => {
                        const Icon = mode.icon
                        return (
                          <Button
                            key={mode.value}
                            variant={transportMode === mode.value ? "default" : "outline"}
                            onClick={() => setTransportMode(mode.value)}
                            className="flex flex-col gap-1 h-16"
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs">{mode.label}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="avoid-incidents"
                      checked={avoidIncidents}
                      onChange={(e) => setAvoidIncidents(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="avoid-incidents" className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      Avoid reported incidents
                    </Label>
                  </div>

                  {/* Calculate Button */}
                  <Button
                    onClick={handleCalculateRoute}
                    disabled={isCalculating || !startLocation || !endLocation}
                    className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                  >
                    {isCalculating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Calculating Route...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4" />
                        Calculate Route
                      </div>
                    )}
                  </Button>

                  {/* Error Display */}
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Route Results */}
                  {route && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/30">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Route className="h-5 w-5 text-blue-600" />
                          Optimal Route
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {route.optimal_route.summary.distance_miles}
                            </div>
                            <div className="text-sm text-gray-600">miles</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                              <Clock className="h-5 w-5" />
                              {route.optimal_route.summary.duration_minutes}
                            </div>
                            <div className="text-sm text-gray-600">minutes</div>
                          </div>
                        </div>

                        {route.avoided_incidents > 0 && (
                          <div className="text-center p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                            <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                              🚧 Avoided {route.avoided_incidents} incident{route.avoided_incidents !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Show baseline comparison if different */}
                      {route.baseline_route && route.baseline_route.summary.distance_miles !== route.optimal_route.summary.distance_miles && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                          <div className="font-semibold mb-1">vs. Route without incident avoidance:</div>
                          <div>Distance: {route.baseline_route.summary.distance_miles} miles</div>
                          <div>Time: {route.baseline_route.summary.duration_minutes} minutes</div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 text-center">
                        Calculated in {route.calculation_time_ms}ms
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}