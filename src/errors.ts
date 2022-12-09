export class FetchError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string, message: string) {
    super(message)
    this.name = 'FetchError'
    this.status = status
    this.statusText = statusText
  }
}
