# Bus Tracking Backend - Implementation Guide

## Overview

This backend simulates a real-time bus tracking system for Bangalore with multiple routes, dynamic fare calculation, and user authentication. It's built with Express.js and Supabase (PostgreSQL) as the database.

## Architecture Decision

### Why This Approach?

1. **Simulation over Real GPS**: MVP doesn't require actual hardware. Simulation is deterministic, testable, and matches the frontend's expectations.
2. **Polling over WebSocket**: Frontend already polls every 5 seconds. WebSocket can be added later without breaking changes.
3. **Supabase**: Provides auth, RLS, and future-proof for real-time with minimal setup.
4. **JWT for Auth**: Stateless, scalable, and supports both users and admins.

## Step-by-Step Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project name, password, region (choose closest to India)
4. Click "Create new project"
5. Wait 2-3 minutes for initialization
6. Go to Settings → API → Copy `Project URL` and `anon key`

### Step 2: Create Database Tables

In Supabase SQL Editor, paste and run this SQL:

```sql
-- Create routes table
CREATE TABLE routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Create stops table
CREATE TABLE stops (
  id BIGSERIAL PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  sequence_order INTEGER NOT NULL
);

-- Create buses table
CREATE TABLE buses (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  bus_number TEXT,
  destination TEXT,
  ticket_price INTEGER,
  current_lat DECIMAL(10,7),
  current_lng DECIMAL(10,7),
  speed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Stopped',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_type TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "public_read_buses" ON buses FOR SELECT USING (true);
CREATE POLICY "public_read_routes" ON routes FOR SELECT USING (true);
CREATE POLICY "public_read_stops" ON stops FOR SELECT USING (true);

-- Remove RLS policy on users (handled by auth logic)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Step 3: Get Supabase Credentials

**For Anon Key (Frontend use):**
- Settings → API → `anon public` key

**For Service Role Key (Backend use - KEEP SECRET):**
- Settings → API → `service_role` key
- Only use in backend, never expose in frontend

### Step 4: Setup Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
JWT_SECRET=my_super_secret_12345_change_this
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Install & Seed Database

```bash
npm install
npm run seed
```

This will:
- Create 5 routes (Airport, East Terminal, North Park, Downtown Loop, Express)
- Create 20+ stops across all routes
- Create 6 sample buses
- Create admin user: `admin@bustrack.com` / `admin123`

### Step 6: Start Backend

```bash
npm run dev
```

Output should show:
```
✓ Bus tracking backend running on http://localhost:3000
✓ Bus simulation running (updating every 5000ms)
```

### Step 7: Verify Backend

Open terminal and test:

```bash
# Test health check
curl http://localhost:3000/health

# Get all buses
curl http://localhost:3000/api/buses | jq .

# Calculate fare
curl -X POST http://localhost:3000/api/fare \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLat": 12.9352,
    "sourceLng": 77.6245,
    "destLat": 13.1939,
    "destLng": 77.7068
  }' | jq .

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bustrack.com",
    "password": "admin123"
  }' | jq .
```

## Implementation Details

### Bus Simulation Engine

**How it works:**

1. **Startup**: Load all routes, stops, buses from database
2. **Every 5 seconds**:
   - For each bus:
     - Get current position
     - Find next waypoint on route
     - Calculate distance to next waypoint
     - Move bus by distance traveled in 5 seconds (based on speed)
     - Use linear interpolation for smooth movement
     - Add speed variation (±5 km/h)
     - Update database
3. **Continuous loop**: Repeat every 5 seconds indefinitely

**Coordinate System:**
- Routes are defined as sequences of stops (waypoints)
- Bus moves from one stop to next, interpolating between them
- When reaching end of route, loops back to start
- Speed affects how fast bus moves between waypoints

**Example - Route with 4 stops:**
```
Stop 1 (12.93°N, 77.62°E) 
  ↓
  ↓ (Bus interpolates here)
  ↓
Stop 2 (12.96°N, 77.69°E)
  ↓
Stop 3 (12.97°N, 77.69°E)
  ↓
Stop 4 (13.19°N, 77.70°E)
  ↓ (reaches end)
  ↓ (loops back to Stop 1)
```

### Fare Calculation

**Formula:**
```
Fare = Base Fare + (Distance × Cost per km)
     = ₹10 + (distance_km × ₹5)

Examples:
- 5 km:  ₹10 + (5 × ₹5) = ₹35
- 10 km: ₹10 + (10 × ₹5) = ₹60
- 1 km:  ₹10 (minimum is base fare)
```

**Accuracy:**
- Uses Haversine formula (accounts for Earth's curvature)
- Accurate within ±0.05% for distances > 1 km

### Database Schema

```
routes
├── id (TEXT, PK)
├── name (TEXT)
└── description (TEXT)

stops
├── id (BIGSERIAL, PK)
├── route_id (FK)
├── name (TEXT)
├── latitude (DECIMAL)
├── longitude (DECIMAL)
└── sequence_order (INTEGER)

buses
├── id (TEXT, PK)
├── route_id (FK)
├── bus_number (TEXT)
├── destination (TEXT)
├── ticket_price (INTEGER)
├── current_lat (DECIMAL)
├── current_lng (DECIMAL)
├── speed (INTEGER)
├── status (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

users
├── id (UUID, PK)
├── email (TEXT, UNIQUE)
├── password_hash (TEXT)
├── user_type (TEXT)
└── created_at (TIMESTAMP)
```

### API Response Format

**Buses Response:**
```json
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
      {"lat": 12.93..., "lng": 77.62..., "name": "Silk Board"},
      ...
    ],
    "stops": [...]
  }
]
```

**Fare Response:**
```json
{
  "success": true,
  "distance": 28.45,
  "baseFare": 10,
  "perKmFare": 5,
  "totalFare": 152
}
```

**Auth Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "admin@bustrack.com",
    "userType": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Common Tasks

### Add New Bus

1. Add row to `buses` table:
```sql
INSERT INTO buses (id, route_id, bus_number, destination, ticket_price, current_lat, current_lng, speed, status)
VALUES ('bus-7', 'route-1', 'KA-01-A-1007', 'Bangalore Airport', 50, 12.9716, 77.5946, 0, 'Stopped');
```

2. Backend automatically picks it up on next refresh (service reloads routes periodically)

### Add New Route

1. Insert route:
```sql
INSERT INTO routes VALUES ('route-6', 'Route F: South Express', 'Service to south area');
```

2. Add stops:
```sql
INSERT INTO stops (route_id, sequence_order, name, latitude, longitude)
VALUES 
  ('route-6', 1, 'South Gate', 12.95, 77.55),
  ('route-6', 2, 'South End', 12.94, 77.54);
```

3. Create buses for this route

### Fix Bus Stuck at Position

Edit the `buses` table directly:
```sql
UPDATE buses 
SET current_lat = 12.9716, current_lng = 77.5946 
WHERE id = 'bus-1';
```

### Reset All Buses to Starting Position

```sql
UPDATE buses 
SET current_lat = (SELECT latitude FROM stops WHERE route_id = buses.route_id AND sequence_order = 1),
    current_lng = (SELECT longitude FROM stops WHERE route_id = buses.route_id AND sequence_order = 1)
WHERE status != 'Maintenance';
```

## Troubleshooting

### Buses Not Moving

**Check 1: Is simulation running?**
- Look at console logs for "Bus simulation running"
- Check if port 3000 is accessible

**Check 2: Does Supabase have data?**
```bash
curl http://localhost:3000/api/buses
```
Should return array of buses

**Check 3: Are there enough stops per route?**
- Minimum 2 stops per route for movement
- With 1 stop, bus can't move

**Fix:**
1. Restart server: `npm run dev`
2. Check Supabase status dashboard
3. Verify .env has correct SUPABASE_URL

### CORS Errors in Frontend

Add to frontend `vite.config.js`:
```javascript
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000'
    }
  }
}
```

Note: This only works in development. For production, set proper CORS headers.

### JWT Token Expired

Client needs to re-login. Tokens expire in 24 hours.

Implement token refresh in frontend if needed (future enhancement).

## Performance Tips

1. **Add database indexes:**
```sql
CREATE INDEX idx_buses_route_id ON buses(route_id);
CREATE INDEX idx_stops_route_id ON stops(route_id);
CREATE INDEX idx_stops_sequence ON stops(route_id, sequence_order);
```

2. **Cache bus data:**
- Backend already caches in memory
- Updates database every 5 seconds (configurable)

3. **Rate limit polling:**
- Add rate limiting middleware for `/api/buses`
- Currently no rate limit (fine for MVP)

## Production Checklist

- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Keep service role key secret (never expose)
- [ ] Enable RLS on all tables
- [ ] Add database backups
- [ ] Set up error monitoring (Sentry)
- [ ] Add request logging
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Add rate limiting
- [ ] Set up CI/CD pipeline
- [ ] Test under load (multiple concurrent users)
- [ ] Document deployment process

## Future Enhancements

1. **Real-time Updates:**
   - Replace polling with WebSocket
   - Use Supabase Realtime
   - Client subscribes to bus updates
   - Instant position updates

2. **Booking System:**
   - Add bookings table
   - Implement ticket sales
   - Seat management
   - Payment integration

3. **Analytics:**
   - Track route efficiency
   - Rider statistics
   - Revenue reports
   - Bus utilization

4. **Mobile App:**
   - React Native version
   - Offline-first sync
   - Push notifications

5. **Real GPS Integration:**
   - Replace simulation with actual GPS data
   - Partner with bus operators
   - Real-time traffic data

## Support & Debugging

**Enable verbose logging:**
```javascript
// In server.js
if (process.env.DEBUG) {
  console.log = console.old_log
  const originalError = console.error
  console.error = function(...args) {
    originalError.apply(console, args)
  }
}
```

**Monitor database queries:**
- Use Supabase dashboard → SQL Editor
- Check query performance
- Monitor table sizes

**Check bus simulation:**
```javascript
// Add this to BusSimulationService
setInterval(() => {
  console.log(`[SIM] Updated ${this.buses.length} buses`)
}, 30000) // Every 30 seconds
```

## References

- Supabase Docs: https://supabase.com/docs
- Express Docs: https://expressjs.com/
- JWT.io: https://jwt.io/
- Haversine Formula: https://en.wikipedia.org/wiki/Haversine_formula
