// Configuration constants for Bus Tracking System
export const CONFIG = {
  // Simulation
  BUS_UPDATE_INTERVAL_MS: 5000, // Update bus positions every 5 seconds
  SPEED_MIN: 15, // km/h
  SPEED_MAX: 50, // km/h
  SPEED_VARIATION: 10, // ±10 km/h random change

  // Fare Calculation
  FARE: {
    BASE_FARE: 10, // ₹
    COST_PER_KM: 5, // ₹/km
    MIN_FARE: 10 // ₹
  },

  // Distance Calculation
  EARTH_RADIUS_M: 6371000, // meters
  EARTH_RADIUS_KM: 6371, // kilometers
  STOP_PROXIMITY_M: 200, // meters - consider bus at stop if within range

  // Locations (Bangalore coordinates)
  LOCATIONS: {
    BANGALORE_CENTER: { lat: 12.9716, lng: 77.5946 },
    AIRPORT: { lat: 13.1939, lng: 77.7068 },
    SILK_BOARD: { lat: 12.9352, lng: 77.6245 },
    MG_ROAD: { lat: 12.9698, lng: 77.6009 },
    WHITEFIELD: { lat: 12.9698, lng: 77.7499 },
    VIDHANA_SOUDHA: { lat: 12.9819, lng: 77.5919 }
  },

  // Routes
  ROUTES: {
    ROUTE_A: 'route-1', // Airport Express
    ROUTE_B: 'route-2', // East Terminal
    ROUTE_C: 'route-3', // North Park
    ROUTE_D: 'route-4', // Downtown Loop
    ROUTE_E: 'route-5'  // Express
  },

  // Bus Status
  BUS_STATUS: {
    RUNNING: 'Running',
    STOPPED: 'Stopped',
    MAINTENANCE: 'Maintenance'
  },

  // User Types
  USER_TYPE: {
    ADMIN: 'admin',
    USER: 'user'
  },

  // API Response Codes
  ERROR_CODES: {
    INVALID_INPUT: 'INVALID_INPUT',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    MISSING_TOKEN: 'MISSING_TOKEN',
    INVALID_TOKEN: 'INVALID_TOKEN',
    FORBIDDEN: 'FORBIDDEN',
    BUS_NOT_FOUND: 'BUS_NOT_FOUND',
    USER_EXISTS: 'USER_EXISTS',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
  },

  // JWT
  JWT: {
    EXPIRATION: '24h',
    ALGORITHM: 'HS256'
  }
}

export const SAMPLE_ROUTES = [
  {
    id: 'route-1',
    name: 'Route A: Airport Express',
    description: 'Direct route to international airport'
  },
  {
    id: 'route-2',
    name: 'Route B: East Terminal',
    description: 'Service to east bus terminal'
  },
  {
    id: 'route-3',
    name: 'Route C: North Park',
    description: 'Service to north entrance'
  },
  {
    id: 'route-4',
    name: 'Circular D: Downtown Loop',
    description: 'Circular route in downtown area'
  },
  {
    id: 'route-5',
    name: 'Express E: Airport Fast',
    description: 'Express airport service without stops'
  }
]

export const SAMPLE_STOPS = [
  // Route 1: Airport Express
  { route_id: 'route-1', sequence_order: 1, name: 'Silk Board', latitude: 12.9352, longitude: 77.6245 },
  { route_id: 'route-1', sequence_order: 2, name: 'Koramangala', latitude: 12.9352, longitude: 77.6245 },
  { route_id: 'route-1', sequence_order: 3, name: 'Jayanagar', latitude: 12.9352, longitude: 77.6245 },
  { route_id: 'route-1', sequence_order: 4, name: 'Central Station', latitude: 12.9716, longitude: 77.5946 },
  { route_id: 'route-1', sequence_order: 5, name: 'Airport Road', latitude: 13.1939, longitude: 77.7068 },

  // Route 2: East Terminal
  { route_id: 'route-2', sequence_order: 1, name: 'MG Road', latitude: 12.9698, longitude: 77.6009 },
  { route_id: 'route-2', sequence_order: 2, name: 'Shivajinagar', latitude: 12.9760, longitude: 77.5993 },
  { route_id: 'route-2', sequence_order: 3, name: 'Cantonment Station', latitude: 12.9770, longitude: 77.6050 },
  { route_id: 'route-2', sequence_order: 4, name: 'East Terminal', latitude: 12.9800, longitude: 77.6150 },

  // Route 3: North Park
  { route_id: 'route-3', sequence_order: 1, name: 'North Gate', latitude: 13.0060, longitude: 77.5700 },
  { route_id: 'route-3', sequence_order: 2, name: 'Whitefield', latitude: 12.9698, longitude: 77.7499 },
  { route_id: 'route-3', sequence_order: 3, name: 'ITPL North', latitude: 12.9750, longitude: 77.7550 },
  { route_id: 'route-3', sequence_order: 4, name: 'North Park', latitude: 12.9804, longitude: 77.6050 },

  // Route 4: Downtown Loop
  { route_id: 'route-4', sequence_order: 1, name: 'Vidhana Soudha', latitude: 12.9819, longitude: 77.5919 },
  { route_id: 'route-4', sequence_order: 2, name: 'Cubbon Park', latitude: 12.9716, longitude: 77.5946 },
  { route_id: 'route-4', sequence_order: 3, name: 'City Center', latitude: 12.9720, longitude: 77.6115 },
  { route_id: 'route-4', sequence_order: 4, name: 'Vidhana Soudha', latitude: 12.9819, longitude: 77.5919 },

  // Route 5: Express
  { route_id: 'route-5', sequence_order: 1, name: 'City Center', latitude: 12.9720, longitude: 77.6115 },
  { route_id: 'route-5', sequence_order: 2, name: 'Airport Road', latitude: 13.1939, longitude: 77.7068 }
]

export const SAMPLE_BUSES = [
  {
    id: 'bus-1',
    route_id: 'route-1',
    bus_number: 'KA-01-A-1001',
    destination: 'Bangalore Airport',
    ticket_price: 50,
    current_lat: 12.9716,
    current_lng: 77.5946,
    speed: 35,
    status: 'Running'
  },
  {
    id: 'bus-2',
    route_id: 'route-2',
    bus_number: 'KA-01-B-1002',
    destination: 'East Terminal',
    ticket_price: 30,
    current_lat: 12.9680,
    current_lng: 77.5900,
    speed: 28,
    status: 'Running'
  },
  {
    id: 'bus-3',
    route_id: 'route-3',
    bus_number: 'KA-01-C-1003',
    destination: 'North Park',
    ticket_price: 40,
    current_lat: 12.9800,
    current_lng: 77.6000,
    speed: 32,
    status: 'Running'
  },
  {
    id: 'bus-4',
    route_id: 'route-4',
    bus_number: 'KA-01-D-1004',
    destination: 'Downtown Loop',
    ticket_price: 20,
    current_lat: 12.9650,
    current_lng: 77.5850,
    speed: 22,
    status: 'Stopped'
  },
  {
    id: 'bus-5',
    route_id: 'route-5',
    bus_number: 'KA-01-E-1005',
    destination: 'Bangalore Airport',
    ticket_price: 60,
    current_lat: 12.9740,
    current_lng: 77.5985,
    speed: 45,
    status: 'Running'
  },
  {
    id: 'bus-6',
    route_id: 'route-1',
    bus_number: 'KA-01-A-1006',
    destination: 'Bangalore Airport',
    ticket_price: 50,
    current_lat: 12.9600,
    current_lng: 77.5800,
    speed: 38,
    status: 'Running'
  }
]
