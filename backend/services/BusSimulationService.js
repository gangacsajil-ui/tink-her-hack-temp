export class BusSimulationService {
  constructor(supabase) {
    this.supabase = supabase
    this.buses = []
    this.routes = []
    this.stops = []
    this.routeDetails = []
    this.simulationInterval = null
    this.updateIntervalMs = 5000 // Update every 5 seconds
    this.lastUpdateTime = {}
  }

  async initialize() {
    console.log('Initializing bus data from Supabase...')
    try {
      const [busesRes, routesRes, stopsRes] = await Promise.all([
        this.supabase.from('buses').select('*'),
        this.supabase.from('routes').select('*'),
        this.supabase.from('stops').select('*').order('route_id, sequence_order')
      ])

      if (busesRes.error) throw busesRes.error
      if (routesRes.error) throw routesRes.error
      if (stopsRes.error) throw stopsRes.error

      this.buses = busesRes.data || []
      this.routes = routesRes.data || []
      this.stops = stopsRes.data || []

      // Initialize position tracking
      this.buses.forEach(bus => {
        this.lastUpdateTime[bus.id] = Date.now()
      })

      console.log(`✓ Loaded ${this.buses.length} buses, ${this.routes.length} routes`)
    } catch (error) {
      console.error('Error initializing bus data:', error)
      throw error
    }
  }

  startSimulation() {
    if (this.simulationInterval) clearInterval(this.simulationInterval)
    
    this.simulationInterval = setInterval(() => {
      this.updateBusPositions()
    }, this.updateIntervalMs)

    console.log(`✓ Bus simulation running (updating every ${this.updateIntervalMs}ms)`)
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval)
      this.simulationInterval = null
      console.log('Bus simulation stopped')
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // meters
  }

  interpolatePosition(lat1, lon1, lat2, lon2, progress) {
    return {
      lat: lat1 + (lat2 - lat1) * progress,
      lng: lon1 + (lon2 - lon1) * progress
    }
  }

  getPathForRoute(routeId) {
    const routeStops = this.stops.filter(s => s.route_id === routeId)
    routeStops.sort((a, b) => a.sequence_order - b.sequence_order)
    return routeStops.map(s => ({
      lat: parseFloat(s.latitude),
      lng: parseFloat(s.longitude),
      name: s.name
    }))
  }

  async updateBusPositions() {
    try {
      const updates = []

      for (const bus of this.buses) {
        const path = this.getPathForRoute(bus.route_id)
        if (path.length < 2) continue

        // Get current bus position
        let currentLat = parseFloat(bus.current_lat) || path[0].lat
        let currentLng = parseFloat(bus.current_lng) || path[0].lng

        // Simulate random speed variation (km/h)
        let speed = bus.speed || 30
        speed = Math.max(15, Math.min(50, speed + (Math.random() - 0.5) * 10))

        // Find next waypoint
        let closestIndex = 0
        let closestDist = Infinity
        
        for (let i = 0; i < path.length; i++) {
          const dist = this.calculateDistance(currentLat, currentLng, path[i].lat, path[i].lng)
          if (dist < closestDist) {
            closestDist = dist
            closestIndex = i
          }
        }

        // Move towards next waypoint
        let nextIndex = (closestIndex + 1) % path.length
        const nextWaypoint = path[nextIndex]
        
        // Distance to travel in 5 seconds (convert speed from km/h to meters)
        const distanceToTravelM = (speed * 1000 / 3600) * (this.updateIntervalMs / 1000)
        const distanceToWaypoint = this.calculateDistance(
          currentLat, currentLng, 
          nextWaypoint.lat, nextWaypoint.lng
        )

        // Move bus
        if (distanceToWaypoint > 0) {
          const progress = Math.min(1, distanceToTravelM / distanceToWaypoint)
          const newPos = this.interpolatePosition(
            currentLat, currentLng,
            nextWaypoint.lat, nextWaypoint.lng,
            progress
          )
          currentLat = newPos.lat
          currentLng = newPos.lng
        }

        // Determine bus status
        const status = speed > 2 ? 'Running' : 'Stopped'

        // Update database
        updates.push({
          id: bus.id,
          currentLat,
          currentLng,
          speed: Math.round(speed),
          status,
          updated_at: new Date().toISOString()
        })
      }

      // Batch update
      if (updates.length > 0) {
        for (const update of updates) {
          await this.supabase
            .from('buses')
            .update({
              current_lat: update.currentLat,
              current_lng: update.currentLng,
              speed: update.speed,
              status: update.status,
              updated_at: update.updated_at
            })
            .eq('id', update.id)
        }

        // Update in-memory cache
        updates.forEach(update => {
          const busIndex = this.buses.findIndex(b => b.id === update.id)
          if (busIndex >= 0) {
            this.buses[busIndex] = {
              ...this.buses[busIndex],
              current_lat: update.currentLat,
              current_lng: update.currentLng,
              speed: update.speed,
              status: update.status,
              updated_at: update.updated_at
            }
          }
        })
      }
    } catch (error) {
      console.error('Error updating bus positions:', error)
    }
  }

  async getBuses() {
    try {
      const { data, error } = await this.supabase
        .from('buses')
        .select('*')
      
      if (error) throw error
      
      // Format response for frontend
      return (data || []).map(bus => {
        const path = this.getPathForRoute(bus.route_id)
        const routeName = this.routes.find(r => r.id === bus.route_id)?.name || `Route ${bus.route_id}`
        
        return {
          id: bus.id,
          route: routeName,
          destination: bus.destination || 'Unknown',
          lat: parseFloat(bus.current_lat) || 0,
          lng: parseFloat(bus.current_lng) || 0,
          speed: bus.speed || 0,
          status: bus.status || 'Stopped',
          ticketPrice: bus.ticket_price || 0,
          path: path,
          stops: path,
          routeId: bus.route_id
        }
      })
    } catch (error) {
      console.error('Error fetching buses:', error)
      throw error
    }
  }

  async getBusById(busId) {
    try {
      const { data, error } = await this.supabase
        .from('buses')
        .select('*')
        .eq('id', busId)
        .single()
      
      if (error) throw error
      if (!data) return null

      const path = this.getPathForRoute(data.route_id)
      const routeName = this.routes.find(r => r.id === data.route_id)?.name || `Route ${data.route_id}`
      
      return {
        id: data.id,
        route: routeName,
        destination: data.destination || 'Unknown',
        lat: parseFloat(data.current_lat) || 0,
        lng: parseFloat(data.current_lng) || 0,
        speed: data.speed || 0,
        status: data.status || 'Stopped',
        ticketPrice: data.ticket_price || 0,
        path: path,
        stops: path,
        routeId: data.route_id
      }
    } catch (error) {
      console.error('Error fetching bus:', error)
      throw error
    }
  }

  async getRoutes() {
    return this.routes
  }

  async getStops(routeId) {
    return this.stops.filter(s => s.route_id === routeId)
  }
}
