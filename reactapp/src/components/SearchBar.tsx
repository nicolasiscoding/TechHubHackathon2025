"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Navigation, Menu, X, MapPin, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface SearchBarProps {
  onSearch: (query: string) => void
  onNavigate: (destination: string) => void
  onMenuClick?: () => void
}

export default function SearchBar({ onSearch, onNavigate, onMenuClick }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Home",
    "Work",
    "Gas Station",
    "Grocery Store"
  ])
  const searchRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery)
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)]
        return updated.slice(0, 5)
      })
      setSearchQuery("")
      searchRef.current?.blur()
    }
  }

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query)
    onNavigate(query)
    setIsSearchFocused(false)
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-0 left-0 right-0 z-[1000]"
    >
      {/* Glass morphism container */}
      <div className="mx-2 sm:mx-4 mt-2 sm:mt-4 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30">
        <div className="p-2 sm:p-4">
          <div className="flex gap-2 sm:gap-3 items-center">
            {/* Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 border border-white/20 dark:border-gray-700/30"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </motion.div>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px] z-[1100] backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-3">
                  <motion.div whileHover={{ x: 4 }}>
                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <MapPin className="mr-3 h-5 w-5 text-blue-500" />
                      Saved Places
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ x: 4 }}>
                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-green-50 dark:hover:bg-green-900/20">
                      <Clock className="mr-3 h-5 w-5 text-green-500" />
                      Drive History
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ x: 4 }}>
                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                      <Menu className="mr-3 h-5 w-5 text-purple-500" />
                      Settings
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ x: 4 }}>
                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                      <Search className="mr-3 h-5 w-5 text-orange-500" />
                      Help & Feedback
                    </Button>
                  </motion.div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Search Input */}
            <div className="flex-1 relative">
              <motion.div
                whileFocus={{ scale: 1.02 }}
                className="relative"
              >
                <Input
                  ref={searchRef}
                  type="text"
                  placeholder="Where to?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                    }
                  }}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 text-sm sm:text-base bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
                />
                <motion.div
                  animate={{ rotate: isSearchFocused ? 90 : 0 }}
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2"
                >
                  <Search className="h-5 w-5 text-gray-400" />
                </motion.div>
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchQuery("")}
                        className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Navigate Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                onClick={() => onNavigate(searchQuery)}
                className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg border-0"
              >
                <Navigation className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Quick Search Suggestions */}
        <AnimatePresence>
          {isSearchFocused && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mb-4 bg-white/70 dark:bg-gray-800/70 rounded-xl border border-white/20 dark:border-gray-700/30 backdrop-blur-sm overflow-hidden"
            >
              {recentSearches.map((search, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleQuickSearch(search)}
                  className="w-full text-left px-4 py-3 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-3 border-b border-white/10 dark:border-gray-700/30 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">{search}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}