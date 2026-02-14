# Bus Tracking Backend

Real-time bus tracking system with Supabase and Node.js/Express. Simulates bus movement along predefined routes, provides fare calculation, and implements user authentication.

## Architecture Overview

```
┌─────────────┐         ┌───────────────┐         ┌──────────────┐
│ React Client│         │ Express Server│         │   Supabase   │
│ (Vite)      │◄────────│ (Port 3000)   │◄────────│  (Database)  │
└─────────────┘         └───────────────┘         └──────────────┘
      │                        △                          △
      │                        │                          │
      └─ Axios GET /api/buses  │ Bus Simulation Engine   │
      └─ POST /api/fare       │ (5s intervals)          │
      └─ POST /auth/login      └─ Updates positions     └─ Row Level Security
```

## Features

- ✅ **Real-time Bus Tracking**: Buses move along predefined routes every 5 seconds
- ✅ **Dynamic Fare Calculation**: Distance-based pricing (₹10 base + ₹5/km)
- ✅ **User Authentication**: JWT-based auth with admin/user separation
- ✅ **Multiple Routes**: 5 predefined routes with Bangalore coordinates
- ✅ **REST API**: Poll-based data fetching (ready for WebSocket upgrade)
- ✅ **Error Handling**: Centralized error middleware with consistent responses
- ✅ **CORS Enabled**: Development-friendly cross-origin requests

## Quick Start

### 1. Prerequisites
- Node.js 16+
- Supabase account (free tier available at https://supabase.com)
- npm or yarn

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Set Up Supabase Project

#### Create Tables (Run in Supabase SQL Editor)

```sql
-- Routes Table
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Stops Table
CREATE TABLE IF NOT EXISTS stops (
  id BIGSERIAL PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id),
  name TEXT NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  sequence_order INTEGER NOT NULL
);

-- Buses Table
CREATE TABLE IF NOT EXISTS buses (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id),
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

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_type TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (optional for MVP)
CREATE POLICY "anyone_can_read_buses" ON buses FOR SELECT USING (true);
CREATE POLICY "anyone_can_read_routes" ON routes FOR SELECT USING (true);
CREATE POLICY "anyone_can_read_stops" ON stops FOR SELECT USING (true);
```

### 4. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-super-secret-jwt-key-12345
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Finding Supabase Keys:**
1. Go to Supabase Dashboard → Settings → API
2. Copy `URL` and `anon` key
3. Copy `service_role` key (keep secret!)

### 5. Seed Database

```bash
npm run seed
```

This creates:
- 5 routes (Airport, East Terminal, North Park, Downtown Loop, Express)
- 20+ stops across all routes
- 6 sample buses with initial positions
- Admin user: `admin@bustrack.com` / `admin123`

### 6. Start Backend

```bash
npm run dev
```

Server runs on `http://localhost:3000`

```
✓ Bus tracking backend running on http://localhost:3000
✓ Environment: development
✓ Client URL: http://localhost:5173
✓ Bus simulation running (updating every 5000ms)
```

### 7. Connect Frontend

Update frontend's `vite.config.js`:

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

## API Endpoints

### Buses
- `GET /api/buses` - Get all active buses (polled every 5 seconds)
- `GET /api/buses/:id` - Get single bus details

**Response Format:**
```json
{
  "id": "bus-1",
  "route": "Route A: Airport Express",
  "destination": "Bangalore Airport",
  "lat": 12.9716,
  "lng": 77.5946,
  "speed": 35,
  "status": "Running",
  "ticketPrice": 50,
  "path": [
    {"lat": 12.9352, "lng": 77.6245, "name": "Silk Board"},
    {"lat": 12.9716, "lng": 77.5946, "name": "Central Station"},
    {"lat": 13.1939, "lng": 77.7068, "name": "Airport Road"}
  ],
  "stops": [...]
}
```

### Fare Calculation
- `POST /api/fare` - Calculate fare from coordinates
- `GET /api/fare/estimate?fromLat=...&fromLng=...&toLat=...&toLng=...`

**Request:**
```json
{
  "sourceLat": 12.9352,
  "sourceLng": 77.6245,
  "destLat": 13.1939,
  "destLng": 77.7068
}
```

**Response:**
```json
{
  "success": true,
  "distance": 28.45,
  "baseFare": 10,
  "perKmFare": 5,
  "totalFare": 152,
  "distanceKm": 28.45
}
```

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token
- `POST /auth/logout` - Logout (stateless)

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Login Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userType": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Project Structure

```
backend/
├── server.js                 # Main Express app
├── package.json             # Dependencies
├── .env.example             # Environment template
├── middleware/
│   ├── auth.js             # JWT & Admin authorization
│   └── errorHandler.js     # Centralized error handling
├── routes/
│   ├── bus.js              # Bus endpoints
│   ├── fare.js             # Fare calculation endpoints
│   └── auth.js             # Authentication endpoints
├── services/
│   └── BusSimulationService.js  # Bus movement simulation
└── scripts/
    └── seed.js             # Database seeding
```

## Bus Simulation Engine

The `BusSimulationService` runs on the server and:

1. **Initialization**: Loads all routes, stops, and buses from Supabase
2. **Every 5 seconds**:
   - Calculates each bus's next waypoint
   - Moves bus along route using interpolation
   - Adds realistic speed variation (15-50 km/h)
   - Updates database with new coordinates
   - Caches in-memory for fast API responses
3. **Position calculation**: Uses Haversine formula for accurate distance

## Fare Calculation Model

```
Total Fare = Base Fare + (Distance in km × Cost per km)
           = ₹10 + (distance × ₹5)

Example:
- Distance: 10 km
- Fare: ₹10 + (10 × ₹5) = ₹60
```

## Testing with cURL

```bash
# Get all buses
curl http://localhost:3000/api/buses

# Get single bus
curl http://localhost:3000/api/buses/bus-1

# Calculate fare
curl -X POST http://localhost:3000/api/fare \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLat": 12.9352,
    "sourceLng": 77.6245,
    "destLat": 13.1939,
    "destLng": 77.7068
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bustrack.com",
    "password": "admin123"
  }'
```

## Troubleshooting

**Issue: "SUPABASE_URL is not defined"**
- Ensure `.env` file exists with all required variables
- Restart server after updating `.env`

**Issue: "Cannot find module '@supabase/supabase-js'"**
```bash
npm install
```

**Issue: Buses not updating positions**
- Check Supabase connectivity in console logs
- Verify buses table has rows
- Check browser DevTools Network tab for `/api/buses` requests

**Issue: CORS errors from frontend**
- Verify `CLIENT_URL` in `.env` matches your frontend URL
- For development: `http://localhost:5173`

## Future Enhancements

- [ ] WebSocket integration for real-time updates (replace polling)
- [ ] Actual booking system with payment integration
- [ ] Driver authentication and management
- [ ] Real GPS integration with actual buses
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Multi-language support
- [ ] Accessibility improvements

## Database Schema Diagram

```
routes (id, name, description)
   │
   ├─► buses (id, route_id, current_lat, current_lng, speed, status...)
   │
   └─► stops (id, route_id, name, latitude, longitude, sequence_order)

users (id, email, password_hash, user_type)
```

## Performance Optimization

- **Bus data caching**: In-memory cache updated every 5s (fast API responses)
- **Rate limiting**: Can be added to `/api/buses` for high-frequency polling
- **Database indexes**: Add on `route_id`, `current_lat/lng` for faster queries
- **Batch updates**: Multiple buses updated in single database transaction

## Security Notes

- JWT tokens expire in 24 hours
- Passwords hashed with bcryptjs (10 salt rounds)
- Row Level Security (RLS) enabled on sensitive tables
- Service role key kept in `.env` (never expose in frontend)
- CORS restricted to development client URL

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push: `git push origin feature/amazing-feature`
4. Open Pull Request

## License

MIT License - feel free to use for learning and projects

## Support

For issues, questions, or feature requests:
1. Check existing documentation
2. Open an GitHub issue
3. Check Supabase documentation: https://supabase.com/docs
