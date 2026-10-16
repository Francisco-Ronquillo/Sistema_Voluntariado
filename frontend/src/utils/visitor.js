const VISITOR_KEY = 'sumamos-visitor-id'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getVisitorId() {
  const savedVisitorId = window.localStorage.getItem(VISITOR_KEY)
  if (savedVisitorId && UUID_PATTERN.test(savedVisitorId)) {
    return savedVisitorId
  }

  const visitorId = window.crypto.randomUUID()
  window.localStorage.setItem(VISITOR_KEY, visitorId)
  return visitorId
}
