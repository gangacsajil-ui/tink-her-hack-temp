import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()
let supabaseClient = null

export function initializeDataRoutes(supabase) {
  supabaseClient = supabase
  return router
}

// GET all routes
router.get('/routes', asyncHandler(async (req, res) => {
  if (!supabaseClient) {
    return res.status(503).json({
      success: false,
      error: 'Service not initialized',
      code: 'SERVICE_UNAVAILABLE'
    })
  }

  try {
    const { data, error } = await supabaseClient
      .from('routes')
      .select('*')
      .order('id')

    if (error) throw error

    res.json(data || [])
  } catch (error) {
    throw error
  }
}))

// GET all stops (optionally filtered by routeId)
router.get('/stops', asyncHandler(async (req, res) => {
  if (!supabaseClient) {
    return res.status(503).json({
      success: false,
      error: 'Service not initialized',
      code: 'SERVICE_UNAVAILABLE'
    })
  }

  try {
    const { routeId } = req.query
    let query = supabaseClient
      .from('stops')
      .select('*')

    if (routeId) {
      query = query.eq('route_id', routeId)
    }

    const { data, error } = await query.order('route_id, sequence_order')

    if (error) throw error

    // Format response with bus routes for frontend
    const formattedData = (data || []).map(stop => ({
      id: stop.id,
      routeId: stop.route_id,
      name: stop.name,
      lat: parseFloat(stop.latitude),
      lng: parseFloat(stop.longitude),
      sequenceOrder: stop.sequence_order
    }))

    res.json(formattedData)
  } catch (error) {
    throw error
  }
}))

// GET stops for specific route
router.get('/stops/:routeId', asyncHandler(async (req, res) => {
  if (!supabaseClient) {
    return res.status(503).json({
      success: false,
      error: 'Service not initialized',
      code: 'SERVICE_UNAVAILABLE'
    })
  }

  try {
    const { routeId } = req.params

    const { data, error } = await supabaseClient
      .from('stops')
      .select('*')
      .eq('route_id', routeId)
      .order('sequence_order')

    if (error) throw error

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No stops found for this route',
        code: 'STOPS_NOT_FOUND'
      })
    }

    // Format response
    const formattedData = data.map(stop => ({
      id: stop.id,
      routeId: stop.route_id,
      name: stop.name,
      lat: parseFloat(stop.latitude),
      lng: parseFloat(stop.longitude),
      sequenceOrder: stop.sequence_order
    }))

    res.json(formattedData)
  } catch (error) {
    throw error
  }
}))

export default router
