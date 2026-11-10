import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'draincare_auth'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser(parsed.user)
        setToken(parsed.token)
      }
    } catch {
      // ignore parse errors
    }
    setLoading(false)
  }, [])

  const login = useCallback((userData, accessToken) => {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: userData, token: accessToken }),
    )
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  )
}
