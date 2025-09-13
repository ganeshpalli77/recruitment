"use client"

import { IconLoader } from "@tabler/icons-react"

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <IconLoader className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
