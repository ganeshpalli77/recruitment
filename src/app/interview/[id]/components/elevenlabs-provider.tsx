'use client'

interface ElevenLabsProviderProps {
  children: React.ReactNode
}

// Note: @elevenlabs/react doesn't require a provider
// useConversation hook can be used directly in components
export function ElevenLabsProvider({ children }: ElevenLabsProviderProps) {
  return <>{children}</>
}
