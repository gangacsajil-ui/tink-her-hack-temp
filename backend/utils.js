// Utility functions for bus tracking system

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Source latitude
 * @param {number} lon1 - Source longitude  
 * @param {number} lat2 - Destination latitude
 * @param {number} lon2 - Destination longitude
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate distance in meters
 * @returns {number} Distance in meters
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  return haversineDistance(lat1, lon1, lat2, lon2) * 1000
}

/**
 * Calculate fare based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} baseFare - Base fare (default: ₹10)
 * @param {number} costPerKm - Cost per km (default: ₹5)
 * @returns {number} Total fare amount
 */
export function calculateFare(distanceKm, baseFare = 10, costPerKm = 5) {
  return Math.max(baseFare, Math.ceil(baseFare + costPerKm * distanceKm))
}

/**
 * Linear interpolation between two points
 * @param {number} lat1, lon1 - Start coordinates
 * @param {number} lat2, lon2 - End coordinates
 * @param {number} progress - Progress ratio (0-1)
 * @returns {object} Interpolated coordinates
 */
export function interpolateCoordinates(lat1, lon1, lat2, lon2, progress) {
  return {
    lat: lat1 + (lat2 - lat1) * progress,
    lng: lon1 + (lon2 - lon1) * progress
  }
}

/**
 * Check if bus is near a stop
 * @param {number} busLat, busLng - Bus coordinates
 * @param {number} stopLat, stopLng - Stop coordinates
 * @param {number} proximityM - Proximity threshold in meters (default: 200)
 * @returns {boolean} True if bus is within threshold
 */
export function isNearStop(busLat, busLng, stopLat, stopLng, proximityM = 200) {
  const distanceM = haversineDistance(busLat, busLng, stopLat, stopLng) * 1000
  return distanceM <= proximityM
}

/**
 * Find nearest stop to bus position
 * @param {object} bus - Bus object with lat, lng
 * @param {array} stops - Array of stop objects with lat, lng, name
 * @returns {object|null} Nearest stop or null
 */
export function findNearestStop(bus, stops) {
  if (!Array.isArray(stops) || stops.length === 0) return null
  
  let nearest = null
  let minDistance = Infinity
  
  stops.forEach(stop => {
    const distance = haversineDistanceMeters(bus.lat, bus.lng, stop.lat, stop.lng)
    if (distance < minDistance) {
      minDistance = distance
      nearest = { ...stop, distance }
    }
  })
  
  return nearest
}

/**
 * Format distance with units
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }
  return `${distanceKm.toFixed(2)}km`
}

/**
 * Format fare with currency
 * @param {number} fare - Fare amount in rupees
 * @returns {string} Formatted fare string
 */
export function formatFare(fare) {
  return `₹${fare}`
}

/**
 * Validate coordinates
 * @param {number} lat, lng - Coordinates to validate
 * @returns {boolean} True if valid
 */
export function isValidCoordinate(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Parse coordinate string (e.g., "12.9716,77.5946")
 * @param {string} coordStr - Coordinate string
 * @returns {object|null} {lat, lng} or null
 */
export function parseCoordinateString(coordStr) {
  try {
    const [lat, lng] = coordStr.split(',').map(s => parseFloat(s.trim()))
    if (isValidCoordinate(lat, lng)) {
      return { lat, lng }
    }
  } catch (e) {}
  return null
}

/**
 * Get Bangalore landmark coordinates
 * @param {string} landmark - Landmark name
 * @returns {object|null} {lat, lng} or null
 */
export function getLandmarkCoordinates(landmark) {
  const landmarks = {
    'airport': { lat: 13.1939, lng: 77.7068 },
    'central-station': { lat: 12.9716, lng: 77.5946 },
    'vidhana-soudha': { lat: 12.9819, lng: 77.5919 },
    'mg-road': { lat: 12.9698, lng: 77.6009 },
    'whitefield': { lat: 12.9698, lng: 77.7499 },
    'silk-board': { lat: 12.9352, lng: 77.6245 },
    'cubbon-park': { lat: 12.9716, lng: 77.5946 },
    'koramangala': { lat: 12.9352, lng: 77.6245 }
  }
  return landmarks[landmark.toLowerCase()] || null
}

/**
 * Generate mock bus ID
 * @returns {string} Bus ID like "bus-1234"
 */
export function generateBusId() {
  return `bus-${Math.floor(Math.random() * 10000)}`
}

/**
 * Generate route ID
 * @param {string} name - Route name
 * @returns {string} Route ID
 */
export function generateRouteId(name) {
  return `route-${name.toLowerCase().replace(/\s+/g, '-')}`
}

/**
 * Validate bus object structure
 * @param {object} bus - Bus object to validate
 * @returns {object} Validation result { valid: boolean, errors: [] }
 */
export function validateBusObject(bus) {
  const errors = []
  
  if (!bus.id) errors.push('Missing bus ID')
  if (typeof bus.lat !== 'number') errors.push('Invalid latitude')
  if (typeof bus.lng !== 'number') errors.push('Invalid longitude')
  if (!isValidCoordinate(bus.lat, bus.lng)) errors.push('Coordinates out of range')
  if (!bus.route) errors.push('Missing route name')
  if (!Array.isArray(bus.path)) errors.push('Invalid path format')
  if (!Array.isArray(bus.stops)) errors.push('Invalid stops format')
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delayMs - Initial delay in ms
 * @returns {Promise}
 */
export async function retryWithBackoff(fn, maxRetries = 3, delayMs = 1000) {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const backoffDelay = delayMs * Math.pow(2, i)
      if (i < maxRetries - 1) {
        await sleep(backoffDelay)
      }
    }
  }
  
  throw lastError
}

/**
 * Throttle function calls
 * @param {Function} fn - Function to throttle
 * @param {number} delayMs - Minimum delay between calls
 * @returns {Function}
 */
export function throttle(fn, delayMs) {
  let lastCall = 0
  
  return function(...args) {
    const now = Date.now()
    if (now - lastCall >= delayMs) {
      lastCall = now
      return fn(...args)
    }
  }
}

/**
 * Debounce function calls
 * @param {Function} fn - Function to debounce
 * @param {number} delayMs - Delay before execution
 * @returns {Function}
 */
export function debounce(fn, delayMs) {
  let timeoutId
  
  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delayMs)
  }
}
