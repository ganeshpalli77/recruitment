// Utility functions for consistent date formatting across server and client

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    // Use ISO format to avoid hydration mismatches
    return date.toISOString().split('T')[0]
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    // Use ISO format for consistent rendering
    const isoString = date.toISOString()
    const [datePart, timePart] = isoString.split('T')
    const timeWithoutSeconds = timePart.split('.')[0]
    return `${datePart} ${timeWithoutSeconds}`
  } catch (error) {
    console.error('Error formatting datetime:', error)
    return 'Invalid date'
  }
}

export function formatRelativeDate(dateString: string): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  } catch (error) {
    console.error('Error formatting relative date:', error)
    return 'Invalid date'
  }
}
