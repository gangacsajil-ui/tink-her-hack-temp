import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // km
}

function calculateFare(distanceKm) {
  const baseFare = 10
  const costPerKm = 5
  return Math.max(baseFare, Math.ceil(baseFare + costPerKm * distanceKm))
}

// POST /api/fare - Calculate fare from coordinates
router.post('/', asyncHandler(async (req, res) => {
  const { sourceLat, sourceLng, destLat, destLng } = req.body

  // Validation
  if (!sourceLat || !sourceLng || !destLat || !destLng) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: sourceLat, sourceLng, destLat, destLng',
      code: 'INVALID_INPUT'
    })
  }

  const distance = haversineDistance(sourceLat, sourceLng, destLat, destLng)
  const fare = calculateFare(distance)

  res.json({
    success: true,
    distance: parseFloat(distance.toFixed(2)),
    baseFare: 10,
    perKmFare: 5,
    totalFare: fare,
    distanceKm: parseFloat(distance.toFixed(2))
  })
}))

// GET /api/fare/estimate - Calculate fare from stop IDs
router.get('/estimate', asyncHandler(async (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.query

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameters',
      code: 'INVALID_INPUT'
    })
  }

  const distance = haversineDistance(
    parseFloat(fromLat),
    parseFloat(fromLng),
    parseFloat(toLat),
    parseFloat(toLng)
  )
  const fare = calculateFare(distance)

  res.json({
    success: true,
    distance: parseFloat(distance.toFixed(2)),
    baseFare: 10,
    perKmFare: 5,
    totalFare: fare,
    distanceKm: parseFloat(distance.toFixed(2))
  })
}))

export default router
