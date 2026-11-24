import { createContext, useContext } from 'react'

export const DiscoveryContext = createContext(null)
export const useDiscovery = () => useContext(DiscoveryContext)