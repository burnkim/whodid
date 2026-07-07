import { encouragement } from '../../lib/copy.js'

export function EncouragementLine({ total, done, hasChores = false }) {
  return <p className="encouragement">{encouragement({ total, done, hasChores })}</p>
}
