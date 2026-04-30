import { useState, useEffect } from 'react'
import TokenLoginPage from './pages/TokenLoginPage'
import DashboardPage from './pages/DashboardPage'
import type { PortalCompany } from './types'

export default function App() {
  const [company, setCompany] = useState<PortalCompany | null>(null)

  // Tenta restaurar a sessão ao carregar
  useEffect(() => {
    const saved = localStorage.getItem('portal_company')
    if (saved) {
      try {
        setCompany(JSON.parse(saved))
      } catch {
        localStorage.removeItem('portal_company')
        localStorage.removeItem('portal_token')
      }
    }
  }, [])

  const handleLogin = (company: PortalCompany) => {
    setCompany(company)
  }

  const handleLogout = () => {
    localStorage.removeItem('portal_token')
    localStorage.removeItem('portal_company')
    setCompany(null)
  }

  if (!company) {
    return <TokenLoginPage onLogin={handleLogin} />
  }

  return <DashboardPage company={company} onCompanyUpdate={setCompany} onLogout={handleLogout} />
}
