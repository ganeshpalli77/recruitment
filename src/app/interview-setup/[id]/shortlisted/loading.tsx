import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ShortlistedCandidatesLoading() {
  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
      {/* Back Button */}
      <Skeleton className="h-9 w-48" />

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
