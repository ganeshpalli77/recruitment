'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { IconUpload } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { uploadResume } from '../actions'
import { toast } from 'sonner'

interface UploadButtonProps {
  jobId: string
}

export function UploadButton({ jobId }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    try {
      // Process each file
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('resume', file)
        formData.append('jobId', jobId)
        
        const result = await uploadResume(formData)
        
        if (result.error) {
          toast.error(result.error)
        } else if (result.success) {
          toast.success(`Successfully uploaded ${file.name}`)
        }
      }
      
      // Refresh the page to show new candidates
      router.refresh()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload resumes')
    } finally {
      setIsUploading(false)
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      
      <Button 
        onClick={handleButtonClick}
        className="bg-green-600 hover:bg-green-700 text-white" 
        size="lg"
        disabled={isUploading}
      >
        <IconUpload className="h-4 w-4 mr-2" />
        {isUploading ? 'Uploading...' : 'Upload Resumes'}
      </Button>
    </>
  )
}
