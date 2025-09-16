import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CandidatesLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
          
          {/* Back Navigation */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Page Header */}
          <div className="space-y-1">
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Job Overview Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-full max-w-lg" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="text-center p-4 bg-white/80 rounded-xl">
                    <Skeleton className="h-8 w-12 mx-auto mb-2" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-6 w-16" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Resume Upload Section */}
            <div className="xl:col-span-1">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-xl p-8 text-center">
                    <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-2xl" />
                    <Skeleton className="h-5 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-48 mx-auto mb-4" />
                    <div className="flex justify-center gap-2 mb-2">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-5 w-10" />
                      ))}
                    </div>
                    <Skeleton className="h-3 w-32 mx-auto" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Candidates Results Section */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-md" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4 p-6">
                    {/* Table Header */}
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-9 w-64" />
                      <Skeleton className="h-9 w-32" />
                    </div>
                    
                    {/* Table Rows */}
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <Skeleton className="h-8 w-8" />
                          <div className="flex-1">
                            <Skeleton className="h-5 w-40 mb-1" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-12" />
                          <Skeleton className="h-6 w-12" />
                          <Skeleton className="h-6 w-12" />
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Skeleton className="h-4 w-48" />
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                          <Skeleton key={i} className="h-8 w-8" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
