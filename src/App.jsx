import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import MapView from './components/MapView'
import BusList from './components/BusList'

export default function App() {
  const [buses, setBuses] = useState([])
  const [selected, setSelected] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await axios.get('/api/buses')
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

  return (
    <div className="app-root">
      <header className="app-header">Private Bus Tracking</header>
      <div className="app-body">
        <MapView buses={buses} selected={selected} onSelect={setSelected} />
        <BusList buses={buses} onSelect={setSelected} selected={selected} />
      </div>
    </div>
  )
}
