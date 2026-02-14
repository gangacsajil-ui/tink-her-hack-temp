import React, { useState } from 'react'
import axios from 'axios'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
      const url = mode === 'login' ? `${base}/auth/login` : `${base}/auth/signup`
      const res = await axios.post(url, { email, password })
      if (res.data && res.data.token) {
        localStorage.setItem('bustrack_token', res.data.token)
        localStorage.setItem('bustrack_user', JSON.stringify(res.data.user || {}))
        onAuth(res.data.user || {})
      } else {
        setError('Unexpected response from server')
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h2>{mode === 'login' ? 'Login' : 'Create account'}</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          <label>
            Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </label>
          <button type="submit" disabled={loading}>{loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Sign up')}</button>
        </form>
        <div className="auth-footer">
          {mode === 'login' ? (
            <p>Don't have an account? <button onClick={() => { setMode('signup'); setError(null) }}>Sign up</button></p>
          ) : (
            <p>Already have an account? <button onClick={() => { setMode('login'); setError(null) }}>Log in</button></p>
          )}
        </div>
      </div>
    </div>
  )
}
