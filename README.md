# TechHub Hackathon 2025

## Projects

### 🌀 Community Map (ReactApp)

A real-time community resource and hazard reporting application built with Next.js. Allows users to report available resources (food, gas, power, shelter) and hazards (debris, downed powerlines) with beautiful map visualization.

**Location:** `/reactapp/`

**Tech Stack:**
- Next.js 15 with TypeScript
- MapLibre GL JS with OpenFreeMap tiles
- Tailwind CSS + shadcn/ui components
- Framer Motion animations
- Responsive mobile-first design

**Features:**
- Interactive map with incident markers
- Two-step incident reporting modal
- Real-time geolocation
- Dark/light theme support
- Animated UI with glass morphism effects

**Getting Started:**
```bash
cd reactapp
npm install
npm run dev
```

**Future Plans:**
- Valhalla routing integration for dynamic road closures
- Backend API for incident persistence
- Real-time updates via WebSocket
