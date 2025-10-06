import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function InterviewSettingsLoading() {
  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
      {/* Back Button */}
      <Skeleton className="h-9 w-48" />

      {/* Page Header */}
      <div className="space-y-1">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Job Info Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
      </Card>

      {/* Settings Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
              <div className="flex justify-end pt-4 border-t">
                <Skeleton className="h-10 w-36" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between py-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
