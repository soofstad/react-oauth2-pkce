import { beforeEach, vi } from 'vitest'
import 'vitest-browser-react'

vi.mock(import('../src/httpUtils'), async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/httpUtils')>()
  return {
    ...actual,
    navigate: vi.fn(),
    openPopup: vi.fn(),
  }
})

beforeEach(() => {
  localStorage.removeItem('ROCP_loginInProgress')
  localStorage.removeItem('ROCP_token')
  localStorage.removeItem('ROCP_refreshToken')
  localStorage.removeItem('ROCP_PKCE_code_verifier')
})
