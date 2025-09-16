'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { IconBrain, IconCheck } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface FixNamesButtonProps {
  jobId: string
}

export function FixNamesButton({ jobId }: FixNamesButtonProps) {
  const [isFixing, setIsFixing] = useState(false)
  const router = useRouter()

  const handleFixNames = async () => {
    setIsFixing(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/fix-candidate-names/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fix names')
      }
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`✅ Fixed ${result.fixed_count} candidate names using AI`)
        // Refresh the page to show updated names
        router.refresh()
      } else {
        toast.error('Failed to fix candidate names')
      }
    } catch (error) {
      console.error('Error fixing names:', error)
      toast.error('Failed to fix candidate names')
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <Button
      onClick={handleFixNames}
      disabled={isFixing}
      variant="outline"
      size="sm"
      className="ml-2"
    >
      <IconBrain className="h-4 w-4 mr-2" />
      {isFixing ? 'Fixing Names...' : 'Fix Names with AI'}
    </Button>
  )
}
