import { useState } from 'react'
import { Droplets, LogIn, UserPlus, Loader as Loader2 } from 'lucide-react'
import { useAuth } from '../auth.jsx'
import { api } from '../api.js'

export default function Login({ onToast }) {
  const { login } = useAuth()
  const [mode, setMode] = useState('login')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'resident',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const result = await api.login(form.username, form.password)
        login(result.user, result.access_token)
        onToast?.('Welcome back!', 'success')
      } else {
        const result = await api.register({
          username: form.username,
          password: form.password,
          full_name: form.full_name,
          email: form.email,
          role: form.role,
        })
        login(result.user, result.access_token)
        onToast?.('Account created successfully', 'success')
      }
    } catch (err) {
      onToast?.(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-teal-700 flex items-center justify-center mb-3">
            <Droplets className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">DrainCare AI</h1>
          <p className="text-sm text-slate-500 mt-1">Smart Drainage Monitoring</p>
        </div>

        <div className="card p-6">
          {/* Tab toggle */}
          <div className="flex gap-1 mb-6 bg-navy-950/60 rounded-lg p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="input-field mt-1"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field mt-1"
                    placeholder="john@example.com"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-slate-500 font-medium">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-field mt-1"
                placeholder="username"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field mt-1"
                placeholder="••••••••"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs text-slate-500 font-medium">Role</label>
                <select
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input-field mt-1"
                >
                  <option value="resident">Resident</option>
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Single-building drainage monitoring MVP
        </p>
      </div>
    </div>
  )
}
