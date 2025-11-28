import { ReactNode, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { currentUser, userProfile, logout } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const role = userProfile?.role || 'student'
  const isStudent = role === 'student'
  const isTeacher = role === 'teacher'
  const navLinks = [
    { label: 'Overview', to: '/dashboard', roles: ['student', 'teacher', 'admin'] },
    { label: 'Submissions', to: '/submissions', roles: ['student'] },
    { label: 'Teacher Hub', to: '/teacher', roles: ['teacher', 'admin'] },
    { label: 'Rubrics', to: '/rubrics', roles: ['teacher', 'admin'] },
  ].filter((link) => link.roles.includes(role))

  const quickAction = isStudent
    ? { label: 'New Submission', to: '/submissions/new' }
    : isTeacher
      ? { label: 'Create Rubric', to: '/rubrics/new' }
      : null

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out', error)
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-10 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="glass-panel rounded-3xl border border-white/10 p-5 lg:p-6 text-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 flex items-center justify-center text-xl">
                  ✨
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">AI Evaluator</p>
                  <p className="text-xl font-semibold text-white">Assignment Intelligence</p>
                </div>
              </Link>
              <span className="hidden md:inline-flex px-3 py-1 rounded-full text-xs uppercase tracking-wide bg-white/10 text-white/80">
                {role} mode
              </span>
            </div>

            <div className="flex items-center gap-3">
              {quickAction && (
                <Link to={quickAction.to}>
                  <span className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold shadow-lg shadow-sky-500/30 transition hover:translate-y-px">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {quickAction.label}
                  </span>
                </Link>
              )}
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-white/80 transition md:hidden"
                aria-label="Toggle navigation"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isNavOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 pr-4 text-left transition hover:bg-white/10"
                >
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-sky-500 text-base font-semibold text-white">
                      {(userProfile?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="absolute -bottom-1 -right-1 inline-flex h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400"></span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{userProfile?.displayName || currentUser?.email}</p>
                    <p className="text-xs uppercase tracking-wide text-white/60">{role}</p>
                  </div>
                  <svg
                    className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-60 space-y-2 rounded-2xl border border-white/10 bg-slate-900/90 p-4 backdrop-blur-xl">
                    <div className="space-y-1 border-b border-white/10 pb-3">
                      <p className="text-sm font-semibold text-white">{userProfile?.displayName || currentUser?.email}</p>
                      <p className="text-xs text-white/60 capitalize">{role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                    >
                      Sign out
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 hidden flex-wrap items-center gap-2 md:flex">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.to ||
                (link.to !== '/dashboard' && location.pathname.startsWith(link.to))
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white/15 text-white shadow-inner'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {isNavOpen && (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 p-4 md:hidden">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsNavOpen(false)}
                  className="block rounded-xl bg-white/5 px-4 py-2 text-white/80 transition hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
              {quickAction && (
                <Link to={quickAction.to} onClick={() => setIsNavOpen(false)}>
                  <span className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold shadow-lg">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {quickAction.label}
                  </span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5"
              >
                Sign out
              </button>
            </div>
          )}
        </header>

        <main className="pb-12 text-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}
