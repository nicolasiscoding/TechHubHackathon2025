"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30"
    >
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border border-white/20 dark:border-gray-700/30 hover:bg-white/90 dark:hover:bg-gray-800/90"
        >
          <motion.div
            initial={false}
            animate={{ rotate: theme === "dark" ? 0 : 180, scale: theme === "dark" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute"
          >
            <Moon className="h-5 w-5" />
          </motion.div>
          <motion.div
            initial={false}
            animate={{ rotate: theme === "light" ? 0 : -180, scale: theme === "light" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute"
          >
            <Sun className="h-5 w-5" />
          </motion.div>
        </Button>
      </motion.div>
    </motion.div>
  )
}