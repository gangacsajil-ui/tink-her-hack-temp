# 🚀 Bus Tracking Backend - Quick Start

## ✅ What's Been Created

A complete Node.js + Supabase backend with real-time bus simulation, fare calculation, and user authentication.

### Project Structure

```
backend/
├── 📄 server.js                    # Main Express server
├── 📄 package.json                 # Dependencies
├── 📄 config.js                    # Configuration constants
├── 📄 utils.js                     # Utility functions
├── 📄 .env.example                 # Environment template
├── 📄 .gitignore                   # Git ignore rules
│
├── 📚 Documentation
│   ├── 📄 README.md               # Complete setup guide
│   ├── 📄 IMPLEMENTATION_GUIDE.md  # Detailed architecture
│   └── 📄 API_COLLECTION.json      # Postman collection
│
├── 📂 middleware/
│   ├── auth.js                     # JWT & Admin authorization
│   └── errorHandler.js             # Central error handling
│
├── 📂 routes/
│   ├── bus.js                      # Bus tracking endpoints
│   ├── fare.js                     # Fare calculation endpoints
│   └── auth.js                     # User authentication endpoints
│
├── 📂 services/
│   └── BusSimulationService.js     # Bus movement simulation engine
│
└── 📂 scripts/
    └── seed.js                     # Database seeding script
```

## 🚀 Quick Start (3 Steps)

### Step 1: Set Up Supabase (2 min)

1. Go to https://supabase.com/dashboard
2. Create new project
3. Copy `Project URL` and `anon key` from Settings → API
4. Copy `service_role` key (keep secret!)

### Step 2: Copy SQL to Supabase (1 min)

In Supabase SQL Editor, paste from [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md#step-2-create-database-tables) (contains full SQL)

### Step 3: Start Backend (1 min)

```bash
# Setup
cp .env.example .env
# Fill in Supabase credentials in .env

npm install
npm run seed

# Start
npm run dev
```

Output:
```
✓ Bus tracking backend running on http://localhost:3000
✓ Bus simulation running (updating every 5000ms)
```

## 📡 API Endpoints

| Method | URL | Purpose |
|--------|-----|---------|
| **GET** | `/api/buses` | Get all active buses (polled every 5s) |
| **GET** | `/api/buses/:id` | Get single bus details |
| **POST** | `/api/fare` | Calculate fare from coordinates |
| **GET** | `/api/fare/estimate?...` | Calculate fare with query params |
| **POST** | `/auth/signup` | Register new user |
| **POST** | `/auth/login` | Login & get JWT token |
| **POST** | `/auth/logout` | Logout |
| **GET** | `/health` | Health check |

## 🧪 Test Backend

```bash
# Get all buses
curl http://localhost:3000/api/buses | jq .

# Calculate fare (28+ km airport to city)
curl -X POST http://localhost:3000/api/fare \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLat": 12.9352,
    "sourceLng": 77.6245,
    "destLat": 13.1939,
    "destLng": 77.7068
  }' | jq .

# Login as admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bustrack.com",
    "password": "admin123"
  }'
```

## 📊 Database Schema

```sql
routes (id, name, description)
  ├─► buses (id, route_id, current_lat, current_lng, speed, status...)
  └─► stops (id, route_id, name, latitude, longitude, sequence_order)

users (id, email, password_hash, user_type)
```

## 🎯 Seeded Data

After `npm run seed`, you get:

**Routes (5):**
- Route A: Airport Express (₹50)
- Route B: East Terminal (₹30)
- Route C: North Park (₹40)
- Circular D: Downtown Loop (₹20)
- Express E: Airport Fast (₹60)

**Buses:**
- 6 buses across all routes
- Moving automatically every 5 seconds
- Different speeds and statuses

**Users:**
- Admin: `admin@bustrack.com` / `admin123`

## 🔄 How It Works

### Bus Simulation
1. Backend loads routes, stops, buses on startup
2. Every 5 seconds:
   - Calculates next waypoint for each bus
   - Moves bus along route using interpolation
   - Updates coordinates in database
   - Adds realistic speed variation
3. Frontend polls `/api/buses` every 5 seconds
4. MapView displays updated positions

### Fare Calculation
```
Fare = ₹10 (base) + (distance_km × ₹5)

Example:
- 10 km = ₹10 + (10 × ₹5) = ₹60
- 28 km = ₹10 + (28 × ₹5) = ₹150
```

## 🔐 Security

- JWT tokens (24h expiration)
- Bcryptjs password hashing (10 rounds)
- Row Level Security (RLS) on database
- Service role key only in backend
- CORS restricted to frontend URL

## 📝 Environment Variables (.env)

```env
# Required - Get from Supabase Settings → API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Security - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_32_char_random_string_here

# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## 🆘 Troubleshooting

| Issue | Fix |
|-------|-----|
| Supabase URL not defined | Check `.env` file exists, restart server |
| Module not found | Run `npm install` |
| Buses not moving | Check backend console logs, verify Supabase connection |
| CORS errors in frontend | Update frontend `vite.config.js` proxy settings |
| Token expired | Login again, JWT expires in 24h |

## 📚 Documentation

- **README.md** - Complete setup & API reference (50+ sections)
- **IMPLEMENTATION_GUIDE.md** - Architecture decisions, detailed setup, troubleshooting
- **API_COLLECTION.json** - Import to Postman for API testing
- **config.js** - All constants & configuration

## 🎮 Try It

1. **In Terminal:**
```bash
npm run dev
# Server → http://localhost:3000
```

2. **In Another Terminal:**
```bash
# Watch buses move
watch -n 1 "curl -s http://localhost:3000/api/buses | jq '.[0] | {id, lat, lng, speed}'"
```

3. **In Browser DevTools Console (from frontend):**
```javascript
// Fetch buses
fetch('/api/buses').then(r => r.json()).then(console.log)

// Calculate fare
fetch('/api/fare', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    sourceLat: 12.9352,
    sourceLng: 77.6245,
    destLat: 13.1939,
    destLng: 77.7068
  })
}).then(r => r.json()).then(console.log)
```

## 🔮 What's Next

- [ ] Connect frontend (vite proxy settings)
- [ ] Verify MapView shows moving buses
- [ ] Test FareCalculator with backend data
- [ ] Implement booking system (future)
- [ ] Add WebSocket for real-time (future)
- [ ] Deploy to production (Railway/Render)

## 💡 Key Features

✅ **Real-time Simulation:**
- 6 buses moving on 5 Bangalore routes
- Updates every 5 seconds
- Realistic speed variation

✅ **Fare Calculation:**
- Distance-based pricing
- Haversine formula (accurate)
- Instant calculations

✅ **User Authentication:**
- JWT-based stateless auth
- Admin + User roles
- Bcryptjs password hashing

✅ **Production Ready:**
- Error handling middleware
- Environment configuration
- CORS support
- Database RLS policies
- Validation on all inputs

✅ **Developer Friendly:**
- Comprehensive documentation
- Postman API collection
- Seed script with mock data
- Utility functions library
- Clear project structure

## 📞 Support Resources

- Supabase Docs: https://supabase.com/docs
- Express Docs: https://expressjs.com/
- JWT Tokens: https://jwt.io/
- Haversine Formula: https://en.wikipedia.org/wiki/Haversine_formula

---

**Status:** ✅ Ready to use!  
**Backend Port:** 3000  
**Frontend Port:** 5173  
**Database:** Supabase (PostgreSQL)  
**Auth:** JWT + Bcryptjs
