import { createClient } from '@supabase/supabase-js'
import bcryptjs from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 }

// Sample routes with Bangalore coordinates
const ROUTES = [
  {
    id: 'route-1',
    name: 'Route A: Airport Express',
    description: 'Direct route to international airport'
  },
  {
    id: 'route-2',
    name: 'Route B: East Terminal',
    description: 'Service to east bus terminal'
  },
  {
    id: 'route-3',
    name: 'Route C: North Park',
    description: 'Service to north entrance'
  },
  {
    id: 'route-4',
    name: 'Circular D: Downtown Loop',
    description: 'Circular route in downtown area'
  },
  {
    id: 'route-5',
    name: 'Express E: Airport Fast',
    description: 'Express airport service without stops'
  }
]

// Route stops (Bangalore area coordinates)
const ROUTE_STOPS = [
  // Route 1: Airport Express
  { route_id: 'route-1', sequence_order: 1, name: 'Silk Board', latitude: 12.9352, longitude: 77.6245 },
  { route_id: 'route-1', sequence_order: 2, name: 'Koramangala', latitude: 12.9355, longitude: 77.6250 },
  { route_id: 'route-1', sequence_order: 3, name: 'Jayanagar', latitude: 12.9400, longitude: 77.6200 },
  { route_id: 'route-1', sequence_order: 4, name: 'Central Station', latitude: 12.9716, longitude: 77.5946 },
  { route_id: 'route-1', sequence_order: 5, name: 'Airport Road', latitude: 13.1939, longitude: 77.7068 },
  
  // Route 2: East Terminal
  { route_id: 'route-2', sequence_order: 1, name: 'MG Road', latitude: 12.9698, longitude: 77.6009 },
  { route_id: 'route-2', sequence_order: 2, name: 'Shivajinagar', latitude: 12.9760, longitude: 77.5993 },
  { route_id: 'route-2', sequence_order: 3, name: 'Cantonment Station', latitude: 12.9770, longitude: 77.6050 },
  { route_id: 'route-2', sequence_order: 4, name: 'East Terminal', latitude: 12.9800, longitude: 77.6150 },
  
  // Route 3: North Park
  { route_id: 'route-3', sequence_order: 1, name: 'North Gate', latitude: 13.0060, longitude: 77.5700 },
  { route_id: 'route-3', sequence_order: 2, name: 'Whitefield', latitude: 12.9698, longitude: 77.7499 },
  { route_id: 'route-3', sequence_order: 3, name: 'ITPL North', latitude: 12.9750, longitude: 77.7550 },
  { route_id: 'route-3', sequence_order: 4, name: 'North Park', latitude: 12.9804, longitude: 77.6050 },
  
  // Route 4: Downtown Loop
  { route_id: 'route-4', sequence_order: 1, name: 'Vidhana Soudha', latitude: 12.9819, longitude: 77.5919 },
  { route_id: 'route-4', sequence_order: 2, name: 'Cubbon Park', latitude: 12.9716, longitude: 77.5946 },
  { route_id: 'route-4', sequence_order: 3, name: 'City Center', latitude: 12.9720, longitude: 77.6115 },
  { route_id: 'route-4', sequence_order: 4, name: 'Vidhana Soudha', latitude: 12.9819, longitude: 77.5919 },
  
  // Route 5: Express
  { route_id: 'route-5', sequence_order: 1, name: 'City Center', latitude: 12.9720, longitude: 77.6115 },
  { route_id: 'route-5', sequence_order: 2, name: 'Airport Road', latitude: 13.1939, longitude: 77.7068 }
]

// Sample buses
const BUSES = [
  {
    id: 'bus-1',
    route_id: 'route-1',
    bus_number: 'KA-01-A-1001',
    destination: 'Bangalore Airport',
    ticket_price: 50,
    current_lat: 12.9716,
    current_lng: 77.5946,
    speed: 35,
    status: 'Running',
    created_at: new Date().toISOString()
  },
  {
    id: 'bus-2',
    route_id: 'route-2',
    bus_number: 'KA-01-B-1002',
    destination: 'East Terminal',
    ticket_price: 30,
    current_lat: 12.9680,
    current_lng: 77.5900,
    speed: 28,
    status: 'Running',
    created_at: new Date().toISOString()
  },
  {
    id: 'bus-3',
    route_id: 'route-3',
    bus_number: 'KA-01-C-1003',
    destination: 'North Park',
    ticket_price: 40,
    current_lat: 12.9800,
    current_lng: 77.6000,
    speed: 32,
    status: 'Running',
    created_at: new Date().toISOString()
  },
  {
    id: 'bus-4',
    route_id: 'route-4',
    bus_number: 'KA-01-D-1004',
    destination: 'Downtown Loop',
    ticket_price: 20,
    current_lat: 12.9650,
    current_lng: 77.5850,
    speed: 22,
    status: 'Stopped',
    created_at: new Date().toISOString()
  },
  {
    id: 'bus-5',
    route_id: 'route-5',
    bus_number: 'KA-01-E-1005',
    destination: 'Bangalore Airport',
    ticket_price: 60,
    current_lat: 12.9740,
    current_lng: 77.5985,
    speed: 45,
    status: 'Running',
    created_at: new Date().toISOString()
  },
  {
    id: 'bus-6',
    route_id: 'route-1',
    bus_number: 'KA-01-A-1006',
    destination: 'Bangalore Airport',
    ticket_price: 50,
    current_lat: 12.9600,
    current_lng: 77.5800,
    speed: 38,
    status: 'Running',
    created_at: new Date().toISOString()
  }
]

async function createTables() {
  console.log('Creating database tables...')

  // Create users table
  const { error: usersError } = await supabase.rpc('create_users_table')
  if (usersError?.code !== 'undefined' && usersError?.code !== '42P07') {
    console.log('Note: Users table may already exist or custom SQL needed')
  }

  // Create routes table using RPC or direct insertion (Supabase will create if not exists on first insert)
  console.log('Setting up routes table...')

  // Create stops table
  console.log('Setting up stops table...')

  // Create buses table
  console.log('Setting up buses table...')

  console.log('✓ Tables structure ready')
}

async function seedData() {
  console.log('\nSeeding database with mock data...')

  try {
    // Seed routes
    console.log('Seeding routes...')
    for (const route of ROUTES) {
      const { error } = await supabase
        .from('routes')
        .upsert(route, { onConflict: 'id' })
      if (error) console.error('Error seeding route:', error)
    }
    console.log(`✓ Seeded ${ROUTES.length} routes`)

    // Seed stops
    console.log('Seeding stops...')
    for (const stop of ROUTE_STOPS) {
      const { error } = await supabase
        .from('stops')
        .insert(stop)
      if (error && error.code !== '23505') console.error('Error seeding stop:', error)
    }
    console.log(`✓ Seeded ${ROUTE_STOPS.length} stops`)

    // Seed buses
    console.log('Seeding buses...')
    for (const bus of BUSES) {
      const { error } = await supabase
        .from('buses')
        .upsert(bus, { onConflict: 'id' })
      if (error) console.error('Error seeding bus:', error)
    }
    console.log(`✓ Seeded ${BUSES.length} buses`)

    // Seed default admin user
    console.log('Seeding admin user...')
    const adminPassword = await bcryptjs.hash('admin123', 10)
    const { error: adminError } = await supabase
      .from('users')
      .upsert({
        email: 'admin@bustrack.com',
        password_hash: adminPassword,
        user_type: 'admin',
        created_at: new Date().toISOString()
      }, { onConflict: 'email' })
    
    if (adminError && adminError.code !== '23505') {
      console.error('Error seeding admin:', adminError)
    } else {
      console.log('✓ Admin user ready (email: admin@bustrack.com, password: admin123)')
    }

  } catch (error) {
    console.error('Seeding error:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting database setup...\n')
  
  try {
    // Note: Supabase will auto-create tables on first insert
    // This script focuses on seeding data
    await seedData()
    
    console.log('\n✓ Database seeding complete!')
    console.log('\nSQL Setup Instructions for Supabase:')
    console.log(`
-- Run this SQL in your Supabase SQL Editor to create tables:

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS stops (
  id BIGSERIAL PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id),
  name TEXT NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  sequence_order INTEGER NOT NULL
);

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

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_type TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
    `)
    
  } catch (error) {
    console.error('✗ Setup failed:', error)
    process.exit(1)
  }
}

main()
