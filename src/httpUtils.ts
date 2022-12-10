import { TTokenRequest } from './Types'
import { FetchError } from './errors'

function buildUrlEncodedRequest(request: TTokenRequest): string {
  let queryString = ''
  Object.entries(request).forEach(([key, value]) => {
    queryString += (queryString ? '&' : '') + key + '=' + encodeURIComponent(value)
  })
  return queryString
}

export async function postWithXForm(url: string, request: TTokenRequest): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    body: buildUrlEncodedRequest(request),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then(async (response: Response) => {
    if (!response.ok) {
      const responseBody = await response.text()
      throw new FetchError(response.status, response.statusText, responseBody)
    }
    return response
  })
}
