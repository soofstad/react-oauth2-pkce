import { useContext, useEffect } from 'react'
import viteLogo from '/vite.svg'
import reactLogo from './assets/react.svg'
import './App.css'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { AuthContext } from 'react-oauth2-code-pkce'

function App() {
  const { tokenData, token, logOut, idToken, error, logIn } = useContext(AuthContext)

  // Handle deep link events from Capacitor for OAuth callback
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const handleAppUrlOpen = (event) => {
        console.log('Deep link received:', event.url)

        if (event.url.includes('com.yourapp.oauth://callback')) {
          console.log('OAuth callback detected via deep link')
        }
      }

      CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen)

      return () => {
        CapacitorApp.removeAllListeners()
      }
    }
  }, [])

  // Error state
  if (error) {
    return (
      <>
        <div>
          <a href='https://vite.dev' target='_blank' rel='noreferrer'>
            <img src={viteLogo} className='logo' alt='Vite logo' />
          </a>
          <a href='https://react.dev' target='_blank' rel='noreferrer'>
            <img src={reactLogo} className='logo react' alt='React logo' />
          </a>
        </div>
        <h1>Vite + React + OAuth2</h1>
        <div className='card'>
          <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>
            An error occurred during authentication: {error}
          </div>
          <button onClick={() => logOut()}>Log out</button>
        </div>
      </>
    )
  }

  return (
    <>
      <div>
        <a href='https://vite.dev' target='_blank' rel='noreferrer'>
          <img src={viteLogo} className='logo' alt='Vite logo' />
        </a>
        <a href='https://react.dev' target='_blank' rel='noreferrer'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </a>
      </div>

      <h1>
        Vite + React + OAuth2
        {Capacitor.isNativePlatform() && (
          <span
            style={{
              fontSize: '0.6em',
              color: '#61dafb',
              display: 'block',
              marginTop: '0.5rem',
            }}
          >
            📱 Native App ({Capacitor.getPlatform()})
          </span>
        )}
      </h1>

      <div className='card'>
        {token ? (
          // Authenticated state
          <>
            <p style={{ fontSize: '1.2rem', color: '#61dafb' }}>Welcome, you are connected! 🎉</p>

            <button onClick={() => logOut()}>Log out</button>

            <p>
              Edit <code>src/App.tsx</code> and save to test HMR
            </p>

            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#888' }}>Show authentication token</summary>
              <pre
                style={{
                  maxWidth: '400px',
                  margin: '1rem auto',
                  padding: '1rem',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                }}
              >
                {token}
              </pre>
            </details>
          </>
        ) : (
          // Unauthenticated state
          <>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Please login to continue</p>

            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              {Capacitor.isNativePlatform()
                ? 'Tap the button below to authenticate via in-app browser'
                : 'Connect with your Microsoft account to access the application'}
            </p>

            <button onClick={() => logIn()}>{Capacitor.isNativePlatform() ? '🔐 Login' : 'Log in'}</button>

            {Capacitor.isNativePlatform() && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: '#888',
                }}
              >
                <p>🔧 Debug: Deep link scheme configured</p>
                <p>Platform: {Capacitor.getPlatform()}</p>
              </div>
            )}
          </>
        )}
      </div>

      <p className='read-the-docs'>
        {Capacitor.isNativePlatform()
          ? 'Enjoy seamless OAuth authentication in your native app!'
          : 'Click on the Vite and React logos to learn more'}
      </p>
    </>
  )
}

export default App
