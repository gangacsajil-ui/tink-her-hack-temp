import React from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline, Marker } from 'react-leaflet'

function MapCenter({ position }) {
  const map = useMap()
  if (position) {
    map.setView(position, 14, { animate: true })
  }
  return null
}

export default function MapView({ buses, selected, onSelect }) {
  const safeBuses = Array.isArray(buses) ? buses : []
  const defaultCenter = (selected && selected.lat && selected.lng)
    ? [selected.lat, selected.lng]
    : safeBuses.length
      ? [safeBuses[0].lat, safeBuses[0].lng]
      : [12.9716, 77.5946]

  return (
    <div className="map-column">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {safeBuses.map((b) => (
          <React.Fragment key={b.id}>
            <CircleMarker
              center={[b.lat, b.lng]}
              radius={8}
              pathOptions={{ color: b.id === (selected && selected.id) ? 'red' : 'blue' }}
              eventHandlers={{ click: () => onSelect(b) }}
            >
              <Popup>
                <div>
                  <strong>{b.route || `Bus ${b.id}`}</strong>
                  <div>Speed: {b.speed ?? 'N/A'} km/h</div>
                  <div>Status: {b.status ?? 'Unknown'}</div>
                </div>
              </Popup>
            </CircleMarker>

            {/* Draw the travelled path if present (array of {lat,lng}) */}
            {Array.isArray(b.path) && b.path.length > 1 && (
              <Polyline
                positions={b.path.map(p => [p.lat, p.lng])}
                pathOptions={{ color: b.id === (selected && selected.id) ? 'red' : 'green' }}
              />
            )}

            {/* Render stops as small markers */}
            {Array.isArray(b.stops) && b.stops.map((s, idx) => (
              <CircleMarker
                key={`stop-${b.id}-${idx}`}
                center={[s.lat, s.lng]}
                radius={5}
                pathOptions={{ color: 'orange' }}
                eventHandlers={{ click: () => onSelect(b) }}
              >
                <Popup>
                  <div>{s.name || `Stop ${idx + 1}`}</div>
                </Popup>
              </CircleMarker>
            ))}
          </React.Fragment>
        ))}
        {selected && <MapCenter position={[selected.lat, selected.lng]} />}
      </MapContainer>
    </div>
  )
}
