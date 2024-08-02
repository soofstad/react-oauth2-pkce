import { FetchError } from './errors'
import type { TTokenRequest } from './types'

function buildUrlEncodedRequest(request: TTokenRequest): string {
  let queryString = ''
  for (const [key, value] of Object.entries(request)) {
    queryString += `${queryString ? '&' : ''}${key}=${encodeURIComponent(value)}`
  }
  return queryString
}

export async function postWithXForm(url: string, request: TTokenRequest, clientSecret?: string): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/x-www-form-urlencoded',
    ...(clientSecret ? { 'Authorization': `Basic ${btoa(`${request.client_id}:${clientSecret}`)}` } : {})
  };

  return fetch(url, {
    method: 'POST',
    body: buildUrlEncodedRequest(request),
    headers: headers,
  }).then(async (response: Response) => {
    if (!response.ok) {
      const responseBody = await response.text()
      throw new FetchError(response.status, response.statusText, responseBody)
    }
    return response
  })
}
