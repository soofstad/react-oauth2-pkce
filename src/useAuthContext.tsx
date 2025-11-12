import { useContext } from 'react'
import { AuthContext, DEFAULT_CONTEXT_TOKEN } from './AuthContext'
import type { IAuthContext } from './types'

export function useAuthContext(): IAuthContext {
  const ctx = useContext(AuthContext)
  if (ctx.token === DEFAULT_CONTEXT_TOKEN) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return ctx
}
