import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import { supabase } from '../server.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// POST /auth/signup
router.post('/signup', asyncHandler(async (req, res) => {
  const { email, password, userType = 'user' } = req.body

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password required',
      code: 'INVALID_INPUT'
    })
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters',
      code: 'INVALID_INPUT'
    })
  }

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        code: 'USER_EXISTS'
      })
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10)

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        user_type: userType,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Generate JWT
    const token = jwt.sign(
      { id: data.id, email: data.email, userType: data.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      success: true,
      user: { id: data.id, email: data.email, userType: data.user_type },
      token
    })
  } catch (error) {
    throw error
  }
}))

// POST /auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password required',
      code: 'INVALID_INPUT'
    })
  }

  try {
    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      })
    }

    // Check password
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      })
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      user: { id: user.id, email: user.email, userType: user.user_type },
      token
    })
  } catch (error) {
    throw error
  }
}))

// POST /auth/logout (stateless - just return success)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

export default router
