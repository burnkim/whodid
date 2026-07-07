import { createContext } from 'react'

// Kept in its own module so files that read the store can stay fast-refresh friendly.
export const StoreContext = createContext(null)
