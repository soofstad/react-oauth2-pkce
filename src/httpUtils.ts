import { TTokenRequest } from './Types'

function buildUrlEncodedRequest(request: TTokenRequest): string {
  let queryString = ''
  Object.entries(request).forEach(([key, value]) => {
    queryString += (queryString ? '&' : '') + key + '=' + encodeURIComponent(value)
  })
  return queryString
}

export function postWithXForm(url: string, request: TTokenRequest): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    body: buildUrlEncodedRequest(request),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then((response: Response) => {
    if (!response.ok) {
      console.error(response)
      throw Error(response.statusText)
    }
    return response
  })
}
