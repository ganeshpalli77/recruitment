"use client"

import { User } from '@supabase/supabase-js'
import { 
  IconMail, 
  IconUser, 
  IconCalendar, 
  IconShield,
  IconUserCircle
} from "@tabler/icons-react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserProfileCardProps {
  user: User
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  // Use consistent date formatting to avoid hydration mismatches
  const createdAt = new Date(user.created_at).toISOString().split('T')[0]

  const lastSignIn = user.last_sign_in_at 
    ? new Date(user.last_sign_in_at).toISOString().split('T')[0]
    : 'Never'

  const displayName = user.user_metadata?.full_name || 
                     user.email?.split('@')[0] || 
                     'User'

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-4">
          <Avatar className="h-20 w-20">
            <AvatarImage 
              src={user.user_metadata?.avatar_url} 
              alt={displayName} 
            />
            <AvatarFallback className="text-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
          {displayName}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Recruitment Team Member
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <IconMail className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300">{user.email}</span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <IconUser className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300">
            ID: {user.id.slice(0, 8)}...
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <IconCalendar className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300">
            Member since {createdAt}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <IconUserCircle className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300">
            Last login: {lastSignIn}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <IconShield className="h-4 w-4 text-gray-500" />
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {user.email_confirmed_at ? 'Verified' : 'Unverified'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {user.role || 'authenticated'}
            </Badge>
          </div>
        </div>

        {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Additional Info
            </h4>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {Object.entries(user.user_metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {String(value).slice(0, 30)}
                    {String(value).length > 30 ? '...' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
