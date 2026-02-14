import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import MapView from './components/MapView'
import BusList from './components/BusList'
import FromTo from './components/FromTo'
import Auth from './components/Auth'

export default function App() {
  const [buses, setBuses] = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState('')
  const [fromStop, setFromStop] = useState('')
  const [toStop, setToStop] = useState('')
  const [fare, setFare] = useState(null)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bustrack_user') || 'null') } catch { return null }
  })
  const intervalRef = useRef(null)

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
        const res = await axios.get(`${base}/api/buses`)
        // Normalize the response so `buses` is always an array.
        const data = res.data
        let normalized = []
        if (Array.isArray(data)) normalized = data
        else if (data && Array.isArray(data.buses)) normalized = data.buses
        else if (data && typeof data === 'object') {
          const vals = Object.values(data)
          if (vals.length && vals.every(v => v && typeof v === 'object' && 'id' in v)) normalized = vals
        }
        // If API returns nothing (dev mode), use sample buses so paths/stops are visible.
        const sampleBuses = [
          {
            id: 'bus-1',
            route: 'Route A',
            lat: 12.9716,
            lng: 77.5946,
            speed: 34,
            status: 'Running',
            path: [
              { lat: 12.9716, lng: 77.5946 },
              { lat: 12.9725, lng: 77.5955 },
              { lat: 12.9732, lng: 77.5970 },
              { lat: 12.9740, lng: 77.5985 }
            ],
            stops: [
              { lat: 12.9716, lng: 77.5946, name: 'Start Stop' },
              { lat: 12.9732, lng: 77.5970, name: 'Mid Stop' },
              { lat: 12.9740, lng: 77.5985, name: 'End Stop' }
            ]
          },
          {
            id: 'bus-2',
            route: 'Route B',
            lat: 12.9680,
            lng: 77.5900,
            speed: 28,
            status: 'Stopped',
            path: [
              { lat: 12.9680, lng: 77.5900 },
              { lat: 12.9690, lng: 77.5915 },
              { lat: 12.9705, lng: 77.5930 },
              { lat: 12.9716, lng: 77.5946 }
            ],
            stops: [
              { lat: 12.9680, lng: 77.5900, name: 'Stop 1' },
              { lat: 12.9705, lng: 77.5930, name: 'Stop 2' }
            ]
          },
          {
            id: 'bus-3',
            route: 'Route C',
            lat: 12.9800,
            lng: 77.6000,
            speed: 40,
            status: 'Running',
            path: [
              { lat: 12.9800, lng: 77.6000 },
              { lat: 12.9815, lng: 77.6020 },
              { lat: 12.9830, lng: 77.6035 },
              { lat: 12.9845, lng: 77.6050 }
            ],
            stops: [
              { lat: 12.9800, lng: 77.6000, name: 'North Start' },
              { lat: 12.9830, lng: 77.6035, name: 'North Mid' },
              { lat: 12.9845, lng: 77.6050, name: 'North End' }
            ]
          },
          {
            id: 'bus-4',
            route: 'Circular D',
            lat: 12.9650,
            lng: 77.5850,
            speed: 22,
            status: 'Running',
            path: [
              { lat: 12.9650, lng: 77.5850 },
              { lat: 12.9660, lng: 77.5870 },
              { lat: 12.9675, lng: 77.5890 },
              { lat: 12.9690, lng: 77.5875 },
              { lat: 12.9650, lng: 77.5850 }
            ],
            stops: [
              { lat: 12.9650, lng: 77.5850, name: 'Circular Start' },
              { lat: 12.9675, lng: 77.5890, name: 'Circular Mid' }
            ]
          }
        ]

        setBuses(normalized && normalized.length ? normalized : sampleBuses)
      } catch (err) {
        console.error('Failed to fetch buses', err)
      }
    }

    fetchBuses()
    intervalRef.current = setInterval(fetchBuses, 5000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const handleLogout = async () => {
    try {
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
      await axios.post(`${base}/auth/logout`)
    } catch (e) {}
    localStorage.removeItem('bustrack_token')
    localStorage.removeItem('bustrack_user')
    setUser(null)
  }

  if (!user) {
    return (
      <div className="app-root">
        <header className="app-header">Private Bus Tracking</header>
        <Auth onAuth={(u) => setUser(u)} />
      </div>
    )
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div>Private Bus Tracking</div>
          <div style={{fontSize: 14}}>
            {user.email} <button onClick={handleLogout} style={{marginLeft: 8}}>Logout</button>
          </div>
        </div>
      </header>
      <div className="app-body">
        <MapView buses={buses} selected={selected} onSelect={setSelected} fare={fare} />
        <aside className="list-column">
          <FromTo
            buses={buses}
            onSelectBus={setSelected}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
            fromStop={fromStop}
            setFromStop={setFromStop}
            toStop={toStop}
            setToStop={setToStop}
            setFare={setFare}
          />
          {fare && (
            <div style={{padding: '8px', borderRadius: 6, background: '#fff', marginBottom: 8, border: '1px solid #eee'}}>
              <strong>Fare estimate:</strong>
              <div>Distance: {fare.distanceKm ?? fare.distance} km</div>
              <div>Total: ₹{fare.totalFare}</div>
            </div>
          )}
          <BusList buses={buses} onSelect={setSelected} selected={selected} />
        </aside>
      </div>
    </div>
  )
}
