import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import React from 'react'
import ReactDOM, { createRoot } from 'react-dom/client'
import { AuthProvider, type TAuthConfig } from 'react-oauth2-code-pkce'
import App from './App.tsx'
import './index.css'

/**
 * Check if the app is running in a Capacitor environment
 * @returns {boolean} True if running in Capacitor (native), false otherwise
 */
const isCapacitor = (): boolean => {
  return Capacitor.isNativePlatform()
}

/**
 * Handle opening OAuth login URL in browser for Capacitor environment
 * @param {string} url - The OAuth authorization URL to open
 */
const handleLoginUrlReady = async (url: string): Promise<void> => {
  if (isCapacitor()) {
    try {
      // Open the OAuth URL in an in-app browser
      await Browser.open({
        url,
        windowName: '_self',
        // Additional options for better UX
        presentationStyle: 'popover',
        toolbarColor: '#61dafb',
      })
    } catch (error) {
      console.error('Error opening browser:', error)
      // Fallback: try to open in system browser
      window.open(url, '_blank')
    }
  }
}

/**
 * OAuth2 configuration for Microsoft Azure AD
 * Adapts configuration based on whether running in Capacitor or web
 */
const authConfig: TAuthConfig = {
  clientId: '6559ce69-219d-4e82-b6ed-889a861c7c94',
  authorizationEndpoint:
    'https://login.microsoftonline.com/d422398d-b6a5-454d-a202-7ed4c1bec457/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/d422398d-b6a5-454d-a202-7ed4c1bec457/oauth2/v2.0/token',

  // Use deep link for Capacitor, localhost for web
  redirectUri: isCapacitor()
    ? 'com.yourapp.oauth://callback' // Replace with your app's deep link scheme
    : 'http://localhost:5173/',

  // Use native login method for Capacitor
  loginMethod: isCapacitor() ? 'native' : undefined,

  // Handle login URL ready event for Capacitor in-app browser
  onLoginUrlReady: isCapacitor() ? handleLoginUrlReady : undefined,

  // Handle token expiration by prompting user to refresh
  onRefreshTokenExpire: (event) =>
    window.confirm('Tokens have expired. Refresh page to continue using the site?') && event.logIn(),

  // Store current path before login to redirect back after authentication
  preLogin: () => localStorage.setItem('preLoginPath', window.location.pathname),
  postLogin: () => {
    const redirectPath = localStorage.getItem('preLoginPath') || '/'
    if (isCapacitor()) {
      // For Capacitor, use replace to avoid browser navigation issues
      window.location.replace(redirectPath)
    } else {
      window.location.replace(redirectPath)
    }
  },

  // Additional configuration
  decodeToken: true,
  scope: 'User.read',
  autoLogin: false, // Set to true if you want automatic login on page load
}

/**
 * Root component that wraps the App with AuthProvider
 * This ensures authentication context is available throughout the app
 */
const container = document.getElementById('root')
if (!container) throw new Error('No container found')
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <AuthProvider authConfig={authConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
