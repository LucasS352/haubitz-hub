import { useState, FormEvent } from 'react'
import api from '../api'
import ModalShell from './ModalShell'

interface Props {
  currentToken: string
  onClose: () => void
  onSave: (token: string) => void
}

export default function MetaTokenModal({ currentToken, onClose, onSave }: Props) {
  const [token, setToken] = useState(currentToken)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return

    setLoading(true)
    setError('')
    try {
      await api.put('/portal/meta-token', { metaToken: token.trim() })
      setSuccess(true)
      setTimeout(() => {
        onSave(token.trim())
      }, 800)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar o token.')
      setLoading(false)
    }
  }

  return (
    <ModalShell title="Integração Meta API" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-white/70 space-y-1">
          <p>Cole aqui o seu <strong className="text-white">Token de Acesso</strong> do Meta Business Manager.</p>
          <p className="text-xs text-white/40">Esse token permite que a Haubitz acesse dados de performance dos seus anúncios.</p>
        </div>

        <div>
          <label className="block text-xs text-white/50 uppercase tracking-widest font-medium mb-2">
            Meta Access Token
          </label>
          <div className="relative">
            <input
              id="input-meta-token"
              type={visible ? 'text' : 'password'}
              value={token}
              onChange={(e) => { setToken(e.target.value); setError('') }}
              placeholder="EAABwzLixnjYBO..."
              className="portal-input pr-12 font-mono text-sm"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
            >
              {visible ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {success && (
          <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-center">
            ✅ Token salvo com sucesso!
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            id="btn-salvar-meta"
            type="submit"
            disabled={loading || !token.trim() || success}
            className="btn-primary flex-1"
          >
            {loading ? 'Salvando...' : success ? 'Salvo!' : 'Salvar Token'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
