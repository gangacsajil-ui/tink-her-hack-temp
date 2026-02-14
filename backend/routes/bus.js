import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()
let busService = null

// Initialize bus service with already-initialized instance from server.js
export function initializeBusRoutes(busServiceInstance) {
  busService = busServiceInstance
  return router
}

// GET all active buses
router.get('/', asyncHandler(async (req, res) => {
  if (!busService) {
    return res.status(503).json({
      success: false,
      error: 'Service not initialized',
      code: 'SERVICE_UNAVAILABLE'
    })
  }
  const buses = await busService.getBuses()
  res.json(buses)
}))

// GET single bus by ID
router.get('/:id', asyncHandler(async (req, res) => {
  if (!busService) {
    return res.status(503).json({
      success: false,
      error: 'Service not initialized',
      code: 'SERVICE_UNAVAILABLE'
    })
  }
  const bus = await busService.getBusById(req.params.id)
  if (!bus) {
    return res.status(404).json({
      success: false,
      error: 'Bus not found',
      code: 'BUS_NOT_FOUND'
    })
  }
  res.json(bus)
}))

export default router
