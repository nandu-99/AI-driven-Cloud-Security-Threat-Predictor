import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('currentUser')
    const token = localStorage.getItem('token')
    const auth = localStorage.getItem('isAuthenticated')
    if (stored && token && auth === 'true') {
      setCurrentUser(JSON.parse(stored))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  function loginUser(token, user) {
    localStorage.setItem('token', token)
    localStorage.setItem('currentUser', JSON.stringify(user))
    localStorage.setItem('isAuthenticated', 'true')
    setCurrentUser(user)
    setIsAuthenticated(true)
  }

  function logoutUser() {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('isAuthenticated')
    setCurrentUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
