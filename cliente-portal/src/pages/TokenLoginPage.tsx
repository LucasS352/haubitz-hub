import { useState, FormEvent } from 'react'
import api from '../api'
import type { PortalCompany } from '../types'

interface Props {
  onLogin: (company: PortalCompany) => void
}

export default function TokenLoginPage({ onLogin }: Props) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return

    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/portal/auth', { token: token.trim() })
      const company: PortalCompany = data.data?.company || data.company

      localStorage.setItem('portal_token', token.trim())
      localStorage.setItem('portal_company', JSON.stringify(company))

      onLogin(company)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Token inválido. Verifique com a equipe Haubitz.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 bg-slate-950 relative overflow-hidden">
      {/* Glow de fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Card principal */}
      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-xl shadow-brand-600/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Portal Haubitz</h1>
          <p className="text-white/50 text-sm mt-1">Acesse seus resultados</p>
        </div>

        {/* Form */}
        <div className="glass p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-widest mb-2">
              Seu token de acesso
            </label>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                id="portal-token-input"
                type="text"
                value={token}
                onChange={(e) => { setToken(e.target.value); setError('') }}
                placeholder="Cole aqui o token enviado pela Haubitz"
                className="portal-input font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
              />

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                id="portal-login-btn"
                type="submit"
                disabled={loading || !token.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Entrando...
                  </>
                ) : 'Acessar meu portal'}
              </button>
            </form>
          </div>

          <p className="text-center text-white/30 text-xs">
            Não tem seu token?{' '}
            <a
              href="https://wa.me/5514991159546"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 transition-colors"
            >
              Fale com a Haubitz →
            </a>
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © {new Date().getFullYear()} Haubitz · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
