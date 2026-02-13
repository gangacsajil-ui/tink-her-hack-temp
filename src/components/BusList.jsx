import React from 'react'

function BusItem({ bus, onClick, isSelected }) {
  return (
    <div className={`bus-item ${isSelected ? 'selected' : ''}`} onClick={() => onClick(bus)}>
      <div className="bus-title">{bus.route || `Bus ${bus.id}`}</div>
      <div className="bus-sub">{`Lat: ${bus.lat.toFixed(4)}, Lng: ${bus.lng.toFixed(4)}`}</div>
      <div className="bus-sub">{`Speed: ${bus.speed ?? 'N/A'} km/h`}</div>
    </div>
  )
}

export default function BusList({ buses, onSelect, selected }) {
  const safeBuses = Array.isArray(buses) ? buses : []
  return (
    <aside className="list-column">
      <h3>Active Buses ({safeBuses.length})</h3>
      <div className="bus-list">
        {safeBuses.map((b) => (
          <BusItem key={b.id} bus={b} onClick={onSelect} isSelected={selected && selected.id === b.id} />
        ))}
      </div>
    </aside>
  )
}
