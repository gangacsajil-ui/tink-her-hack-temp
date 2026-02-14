# Bus Tracking System - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  MapView         │  │  BusList         │  │  FareCalculator  │  │
│  │  (Leaflet)       │  │  (Bus List UI)   │  │  (Fare Estimate) │  │
│  └──────────┬───────┘  └──────────┬───────┘  └──────────┬───────┘  │
│             │                     │                     │           │
│             └─────────────────────┼─────────────────────┘           │
│                                   │                                 │
│                    Axios HTTP Requests (Poll every 5s)            │
│                                   │                                 │
│                      /api/buses (GET)                              │
│                      /api/fare (POST)                              │
│                      /auth/* (POST)                                │
│                                   │                                 │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                        ┌───────────▼──────────┐
                        │   CORS Gateway       │
                        │  (http://localhost   │
                        │   :3000)             │
                        └───────────┬──────────┘
                                    │
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express + Node.js)                       │
│                                   │                                 │
│  ┌────────────────────────────────▼──────────────────────────────┐  │
│  │                    Express Server (Port 3000)                 │  │
│  │                                                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │  │
│  │  │ Routes       │  │ Middleware   │  │ Services         │    │  │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────────┤    │  │
│  │  │ /api/buses   │  │ Auth         │  │ BusSimulation    │    │  │
│  │  │ /api/fare    │  │ Error Handler│  │ Service          │    │  │
│  │  │ /auth/*      │  │ Validation   │  │                  │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘    │  │
│  │                                                                │  │
│  │  ▼─────── Runs Every 5 Seconds ─────▼                         │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │ Bus Simulation Engine                                  │   │  │
│  │  ├────────────────────────────────────────────────────────┤   │  │
│  │  │ 1. Load bus, route, stop data from Supabase           │   │  │
│  │  │ 2. For each bus:                                       │   │  │
│  │  │    a. Find current position & next waypoint           │   │  │
│  │  │    b. Calculate distance to travel (speed × time)     │   │  │
│  │  │    c. Interpolate new position (linear)              │   │  │
│  │  │    d. Add speed variation (±5 km/h)                  │   │  │
│  │  │ 3. Update database with new coordinates              │   │  │
│  │  │ 4. Update in-memory cache                            │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                   │                                 │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │
                        ┌───────────▼──────────┐
                        │    Supabase Auth     │
                        │    & RLS Policies    │
                        └───────────┬──────────┘
                                    │
┌──────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                           │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ routes       │  │ buses        │  │ stops        │              │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤              │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │              │
│  │ name         │  │ route_id (FK)│  │ route_id(FK) │              │
│  │ description  │  │ destination  │  │ name         │              │
│  │              │  │ current_lat  │  │ latitude     │              │
│  │              │  │ current_lng  │  │ longitude    │              │
│  │              │  │ speed        │  │ seq_order    │              │
│  │              │  │ status       │  │              │              │
│  │              │  │ ticket_price │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌──────────────────────────────────┐                              │
│  │ users                            │                              │
│  ├──────────────────────────────────┤                              │
│  │ id (UUID, PK)                    │                              │
│  │ email (UNIQUE)                   │                              │
│  │ password_hash                    │                              │
│  │ user_type (admin | user)         │                              │
│  │ created_at                       │                              │
│  └──────────────────────────────────┘                              │
│                                                                      │
│  Row Level Security (RLS) Enabled:                                 │
│  - Public read access to buses, routes, stops                      │
│  - Admin write access to all tables                                │
│  - User read-only access                                           │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Bus Position Update Flow (Every 5 Seconds)

```
[BusSimulationService.updateBusPositions()]
              │
              ▼
    Load from in-memory cache
    (routes, stops, buses)
              │
              ├─── For each bus in this.buses:
              │
              ▼
    Get current position
    (lat, lng, speed)
              │
              ▼
    Find next waypoint on route
    (sequence of stops)
              │
              ▼
    Calculate distance to next waypoint
    Haversine formula
              │
              ▼
    Calculate movement distance
    = (speed km/h) × (5 seconds / 3600)
              │
              ▼
    Calculate progress ratio
    = movement_distance / waypoint_distance
              │
              ▼
    Interpolate new position
    newLat = lat1 + (lat2-lat1)*progress
    newLng = lng1 + (lng2-lng1)*progress
              │
              ▼
    Add speed variation
    speed += (random -5 to +5)
    speed = clamp(15, speed, 50)
              │
              ▼
    Determine status
    status = speed > 2 ? "Running" : "Stopped"
              │
              ▼
    Update database
    supabase.buses.update({
      current_lat, current_lng,
      speed, status, updated_at
    })
              │
              ▼
    Update in-memory cache
    this.buses[index] = {...updated}
```

### API Request Flow - Get All Buses

```
[Frontend: axios.get('/api/buses')]
              │
              ▼
    [Backend: GET /api/buses]
              │
              ├─ Call busService.getBuses()
              │
              ├─ Query Supabase for all buses
              │  SELECT * FROM buses
              │
              ├─ Format response for frontend:
              │  - fetch route name from routes table
              │  - get path = all stops ordered by sequence
              │  - parse lat/lng strings to numbers
              │  - rename fields (current_lat → lat, etc)
              │
              ▼
    [HTTP Response: 200 OK, JSON array]
              │
              ▼
    [Frontend: Update bus state]
    setState(buses)
              │
              ▼
    [UI Re-render]
    MapView: draw bus markers + paths
    BusList: show bus info
```

### Fare Calculation Flow

```
[Frontend: POST /api/fare]
{
  sourceLat: 12.9352,
  sourceLng: 77.6245,
  destLat: 13.1939,
  destLng: 77.7068
}
              │
              ▼
    [Backend: POST /api/fare]
    Validate input coordinates
              │
              ▼
    Calculate distance using Haversine:
    R = 6371 km (Earth radius)
    dLat = toRad(lat2 - lat1)
    dLon = toRad(lon2 - lon1)
    a = sin²(dLat/2) + cos(lat1)·cos(lat2)·sin²(dLon/2)
    c = 2·atan2(√a, √(1-a))
    distance = R·c
              │
              ▼
    Calculate fare:
    baseFare = ₹10
    perKmFare = ₹5
    totalFare = baseFare + (distance × perKmFare)
    totalFare = max(baseFare, ceil(totalFare))
              │
              ▼
    [HTTP Response: 200 OK, JSON]
    {
      distance: 28.45,
      baseFare: 10,
      perKmFare: 5,
      totalFare: 152
    }
              │
              ▼
    [Frontend: Update fare state]
    Show calculated fare to user
```

### Authentication Flow

```
[Frontend: POST /auth/login]
{
  email: "user@example.com",
  password: "password123"
}
              │
              ▼
    [Backend: POST /auth/login]
    Validate input
              │
              ▼
    Query database:
    SELECT * FROM users WHERE email = ?
              │
              ▼
    Compare password hash:
    bcryptjs.compare(password, password_hash)
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
    Invalid      Valid
    ❌            ✅
    Return 401   │
                 ▼
         Generate JWT token:
         jwt.sign({
           id, email, userType
         }, JWT_SECRET, {
           expiresIn: '24h'
         })
                 │
                 ▼
    [HTTP Response: 200 OK]
    {
      success: true,
      user: { id, email, userType },
      token: "eyJhbGc..."
    }
                 │
                 ▼
    [Frontend: localStorage.token = token]
    [Future requests: Authorization: Bearer {token}]
```

## Request-Response Examples

### Get Buses
```
REQUEST:
GET /api/buses HTTP/1.1
Host: localhost:3000

RESPONSE:
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "bus-1",
    "route": "Route A: Airport Express",
    "destination": "Bangalore Airport",
    "lat": 12.9716,
    "lng": 77.5946,
    "speed": 35,
    "status": "Running",
    "ticketPrice": 50,
    "routeId": "route-1",
    "path": [
      {"lat": 12.9352, "lng": 77.6245, "name": "Silk Board"},
      {"lat": 12.9716, "lng": 77.5946, "name": "Central Station"},
      {"lat": 13.1939, "lng": 77.7068, "name": "Airport Road"}
    ],
    "stops": [...]
  },
  ...
]
```

### Calculate Fare
```
REQUEST:
POST /api/fare HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "sourceLat": 12.9352,
  "sourceLng": 77.6245,
  "destLat": 13.1939,
  "destLng": 77.7068
}

RESPONSE:
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "distance": 28.45,
  "baseFare": 10,
  "perKmFare": 5,
  "totalFare": 152,
  "distanceKm": 28.45
}
```

### Login
```
REQUEST:
POST /auth/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "admin@bustrack.com",
  "password": "admin123"
}

RESPONSE:
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "admin@bustrack.com",
    "userType": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Get all buses | ~50ms | Supabase cached query + formatting |
| Calculate fare | ~5ms | Pure math, no DB call |
| Login | ~100ms | Password hash verification |
| Bus position update | ~200ms | 6 buses × interpolation math |
| Simulation cycle | ~5 sec | Configured interval |
| API response overhead | ~10ms | Network + serialization |

## Scalability Considerations

### Current (MVP)
- ✅ 6 buses, 20 stops, 5 routes
- ✅ ~100 concurrent users (polling every 5s)
- ✅ Latency: ~100-200ms per request

### Future Improvements
- [ ] Implement WebSocket for real-time (reduce polling)
- [ ] Add Redis caching for frequently accessed data
- [ ] Database query optimization with indexes
- [ ] Horizontal scaling with load balancer
- [ ] Database connection pooling
- [ ] CDN for static assets
- [ ] Regional deployment for lower latency

## Security Flow

```
[Frontend Request with Token]
              │
              ▼
    [Backend receives request]
    Extract token from Authorization header
              │
              ▼
    Call authMiddleware:
    jwt.verify(token, JWT_SECRET)
              │
        ┌─────┴─────────┐
        │               │
        ▼               ▼
    Invalid          Valid
    ❌                ✅
    Return 401       │
                     ▼
                 Set req.user = decoded
                 Include id, email, userType
                     │
                     ▼
         [Continue to route handler]
         Can access req.user for user-specific operations
                     │
                     ▼
    [Check admin role if needed]
    if (req.user.userType !== 'admin')
      return 403 Forbidden
```

## Error Handling Flow

```
[Any error occurs in route handler]
              │
              ▼
    Caught by asyncHandler wrapper:
    Promise.reject(fn()).catch(next)
              │
              ▼
    Passed to errorHandler middleware:
              │
              ├── Log error to console
              │
              ├── Extract error details
              │   - statusCode (default 500)
              │   - message
              │   - code (custom error code)
              │
              ▼
    [HTTP Response with consistent format]
    {
      "success": false,
      "error": "Error message",
      "code": "ERROR_CODE"
    }
              │
              ▼
    [Frontend handles error]
    Display user-friendly message
    Or retry operation
```

---

**Diagram Legend:**
- `──────►` = Synchronous flow
- `▼` = Next step
- `├──` = Conditional branch
- `[ ]` = HTTP request/response
- `{ }` = Data/JSON object
