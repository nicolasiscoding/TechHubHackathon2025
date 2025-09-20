"use client"

import { useState } from "react"
import { Plus, Zap, Fuel, ShoppingCart, TreePine, MapPin, Home, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface IncidentReportModalProps {
  onReportIncident: (incident: {
    type: string
    description: string
    location?: { lat: number; lng: number }
  }) => void
  currentLocation?: { lat: number; lng: number }
}

export default function IncidentReportModal({
  onReportIncident,
  currentLocation
}: IncidentReportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1) // 1 = select type, 2 = add description
  const [incidentType, setIncidentType] = useState("")
  const [description, setDescription] = useState("")

  const incidentTypes = [
    // Positive Resources (Green)
    { value: "food_available", label: "Food", icon: ShoppingCart, type: "positive" },
    { value: "gas_available", label: "Gas", icon: Fuel, type: "positive" },
    { value: "power_available", label: "Power", icon: Zap, type: "positive" },
    { value: "shelter_available", label: "Shelter", icon: Home, type: "positive" },

    // Negative Hazards (Red/Orange)
    { value: "debris_road", label: "Debris", icon: TreePine, type: "negative" },
    { value: "downed_powerline", label: "Power Line", icon: AlertTriangle, type: "negative" },
  ]

  const handleTileSelect = (type: string) => {
    setIncidentType(type)
    setStep(2)
  }

  const handleSubmit = () => {
    if (incidentType && description) {
      onReportIncident({
        type: incidentType,
        description,
        location: currentLocation,
      })
      // Reset state
      setIncidentType("")
      setDescription("")
      setStep(1)
      setIsOpen(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep(1)
    setIncidentType("")
    setDescription("")
  }

  const handleBack = () => {
    setStep(1)
    setIncidentType("")
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 z-20"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="relative"
        >
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-red-500 opacity-75"
            animate={{ scale: [1, 1.2, 1], opacity: [0.75, 0.3, 0.75] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <Button
            size="lg"
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-2 border-white/20 backdrop-blur-sm relative"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-[98vw] sm:max-w-[550px] h-[calc(100vh-120px)] sm:max-h-[85vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 z-[1600] mt-6 mb-14 sm:mt-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {step === 1 ? (
                  // Step 1: Select Type
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        🌀 Community Report
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-300">
                        What would you like to report in your area?
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2 py-3">
                      {/* Positive Resources */}
                      <div className="space-y-1">
                        <Label className="text-lg font-semibold flex items-center gap-2">
                          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                          Open & Ready
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {incidentTypes.filter(type => type.type === "positive").map((type, index) => {
                            const Icon = type.icon
                            return (
                              <motion.div
                                key={type.value}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{
                                  scale: 1.05,
                                  rotate: [0, 1, -1, 0],
                                  transition: { duration: 0.3 }
                                }}
                                whileTap={{ scale: 0.95 }}
                                className=""
                              >
                                <Button
                                  variant="ghost"
                                  className="w-full h-20 sm:h-28 flex flex-col gap-1 rounded-2xl border-0 bg-gradient-to-br from-green-400/20 via-emerald-400/20 to-green-500/20 dark:from-green-400/10 dark:via-emerald-400/10 dark:to-green-500/10 hover:from-green-400/30 hover:via-emerald-400/30 hover:to-green-500/30 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20 dark:border-green-400/20 transition-all duration-500 items-center justify-center text-center group relative overflow-hidden tile-green"
                                  onClick={() => handleTileSelect(type.value)}
                                >
                                  {/* Animated background shimmer */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                                  <motion.div
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                    className="relative z-10"
                                  >
                                    <Icon className="h-7 w-7 sm:h-9 sm:w-9 text-green-600 dark:text-green-400 flex-shrink-0 drop-shadow-sm" />
                                  </motion.div>

                                  <span className="text-sm sm:text-base font-bold text-green-900 dark:text-green-100 leading-tight px-1 relative z-10 text-shadow-sm antialiased">{type.label}</span>

                                  {/* Floating particles */}
                                  <div className="absolute top-2 right-2 w-1 h-1 bg-green-400 rounded-full opacity-60 animate-pulse"></div>
                                  <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-emerald-300 rounded-full opacity-40 animate-bounce delay-300"></div>
                                </Button>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Negative Hazards */}
                      <div className="space-y-1">
                        <Label className="text-lg font-semibold flex items-center gap-2">
                          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                          Hazards & Problems
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {incidentTypes.filter(type => type.type === "negative").map((type, index) => {
                            const Icon = type.icon
                            return (
                              <motion.div
                                key={type.value}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (index + 4) * 0.1 }}
                                whileHover={{
                                  scale: 1.05,
                                  rotate: [0, 1, -1, 0],
                                  transition: { duration: 0.3 }
                                }}
                                whileTap={{ scale: 0.95 }}
                                className=""
                              >
                                <Button
                                  variant="ghost"
                                  className="w-full h-20 sm:h-28 flex flex-col gap-1 rounded-2xl border-0 bg-gradient-to-br from-red-400/20 via-orange-400/20 to-red-500/20 dark:from-red-400/10 dark:via-orange-400/10 dark:to-red-500/10 hover:from-red-400/30 hover:via-orange-400/30 hover:to-red-500/30 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20 dark:border-red-400/20 transition-all duration-500 items-center justify-center text-center group relative overflow-hidden tile-red"
                                  onClick={() => handleTileSelect(type.value)}
                                >
                                  {/* Animated background shimmer */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                                  <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                    className="relative z-10"
                                  >
                                    <Icon className="h-7 w-7 sm:h-9 sm:w-9 text-red-600 dark:text-red-400 flex-shrink-0 drop-shadow-sm" />
                                  </motion.div>

                                  <span className="text-sm sm:text-base font-bold text-red-900 dark:text-red-100 leading-tight px-1 relative z-10 text-shadow-sm antialiased">{type.label}</span>

                                  {/* Warning particles */}
                                  <div className="absolute top-2 right-2 w-1 h-1 bg-red-400 rounded-full opacity-60 animate-ping"></div>
                                  <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-orange-300 rounded-full opacity-40 animate-pulse delay-500"></div>
                                  <div className="absolute top-3 left-2 w-0.5 h-0.5 bg-red-300 rounded-full opacity-30 animate-bounce delay-700"></div>
                                </Button>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Step 2: Description
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        Add Details
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-300">
                        {incidentTypes.find(t => t.value === incidentType)?.label}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2 py-3">
                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Description</Label>
                        <Textarea
                          placeholder="Provide specific details like address, hours, contact info, or severity..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="min-h-[120px] bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 resize-none"
                          autoFocus
                        />
                      </div>

                      {/* Location Info */}
                      {currentLocation && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
                          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <MapPin className="h-5 w-5" />
                            <span className="font-medium">Current Location</span>
                          </div>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            Lat: {currentLocation.lat.toFixed(4)}, Lng: {currentLocation.lng.toFixed(4)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 justify-between">
                      <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70"
                      >
                        ← Back
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!description}
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        Submit Report
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}