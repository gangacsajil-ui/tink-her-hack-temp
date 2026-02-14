import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'

// Routes
import authRoutes from './routes/auth.js'
import busRoutes, { initializeBusRoutes } from './routes/bus.js'
import dataRoutes, { initializeDataRoutes } from './routes/data.js'
import fareRoutes from './routes/fare.js'
import { errorHandler } from './middleware/errorHandler.js'

// Services
import { BusSimulationService } from './services/BusSimulationService.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}))
app.use(express.json())

// Serve static files from the frontend build
const clientPath = path.join(__dirname, '../client/dist')
app.use(express.static(clientPath))

// Supabase Client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Routes will be initialized after bus service starts
let busSimulationService = null

app.use('/auth', authRoutes)
app.use('/api/fare', fareRoutes)
app.use('/api', initializeDataRoutes(supabase))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// SPA fallback - serve index.html for any route not matched by API
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'))
})

// Error handler (must be last)
app.use(errorHandler)

// Initialize server
async function startServer() {
  try {
    // Initialize and start bus simulation
    busSimulationService = new BusSimulationService(supabase)
    await busSimulationService.initialize()
    
    // Now initialize bus routes with the initialized service
    app.use('/api/buses', initializeBusRoutes(busSimulationService))
    
    busSimulationService.startSimulation()
    console.log('✓ Bus simulation service started')

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✓ Bus tracking backend running on http://localhost:${PORT}`)
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`✓ Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
    })
  } catch (error) {
    console.error('✗ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app
