import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function FromTo({ buses, onSelectBus, selectedRoute, setSelectedRoute, fromStop, setFromStop, toStop, setToStop, setFare }) {
  const [routes, setRoutes] = useState([])
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(false)
  const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${base}/api/routes`)
        setRoutes(res.data || [])
      } catch (e) {
        console.error('Failed to fetch routes', e)
      } finally {
        setLoading(false)
      }
    }
    fetchRoutes()
  }, [])

  useEffect(() => {
    if (!selectedRoute) {
      setStops([])
      setFromStop('')
      setToStop('')
      return
    }
    const fetchStops = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${base}/api/stops?routeId=${selectedRoute}`)
        setStops(res.data || [])
      } catch (e) {
        console.error('Failed to fetch stops', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStops()
  }, [selectedRoute])

  const matchingBuses = (Array.isArray(buses) ? buses : []).filter(b => {
    if (!selectedRoute) return true
    if (b.routeId) return b.routeId === selectedRoute
    if (b.route) return routes.find(r => r.id === selectedRoute)?.name === b.route
    return true
  })

  // When both stops are selected, compute fare so parent can pick it up
  useEffect(() => {
    const calculateFare = async () => {
      if (!fromStop || !toStop) {
        setFare && setFare(null)
        return
      }

      try {
        setLoading(true)
        // Find coordinates for stops
        const from = stops.find(s => String(s.id) === String(fromStop))
        const to = stops.find(s => String(s.id) === String(toStop))
        if (from && to) {
          const res = await axios.get(`${base}/api/fare/estimate?fromLat=${from.lat}&fromLng=${from.lng}&toLat=${to.lat}&toLng=${to.lng}`)
          setFare && setFare(res.data)
        } else {
          setFare && setFare(null)
        }
      } catch (e) {
        console.error('Failed to estimate fare', e)
        setFare && setFare(null)
      } finally {
        setLoading(false)
      }
    }
    calculateFare()
  }, [fromStop, toStop, stops])

  return (
    <div className="fromto-root">
      <h4>Trip Planner</h4>
      <div className="fromto-row">
        <label>
          Route
          <select value={selectedRoute} onChange={e => setSelectedRoute(e.target.value)}>
            <option value="">— select route —</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="fromto-row">
        <label>
          From
          <select value={fromStop} onChange={e => setFromStop(e.target.value)} disabled={!stops.length}>
            <option value="">— select start —</option>
            {stops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="fromto-row">
        <label>
          To
          <select value={toStop} onChange={e => setToStop(e.target.value)} disabled={!stops.length}>
            <option value="">— select destination —</option>
            {stops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="fromto-summary">
        <div>Available buses: <strong>{matchingBuses.length}</strong></div>
        <div className="fromto-list">
          {matchingBuses.slice(0,5).map(b => (
            <div key={b.id} className="fromto-bus" onClick={() => onSelectBus && onSelectBus(b)}>
              <div className="bus-title-small">{b.route || `Bus ${b.id}`}</div>
              <div className="bus-sub-small">{b.status || ''} • {b.speed ?? 'N/A'} km/h</div>
            </div>
          ))}
          {matchingBuses.length > 5 && <div className="more">+{matchingBuses.length - 5} more</div>}
        </div>
      </div>
    </div>
  )
}
