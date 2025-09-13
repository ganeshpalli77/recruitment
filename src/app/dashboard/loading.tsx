import { LoadingSpinner } from "@/components/loading-spinner"

export default function DashboardLoading() {
  return (
    <div className="flex h-screen">
      <div className="w-72 bg-sidebar border-r" />
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b bg-background" />
        <LoadingSpinner message="Loading recruitment data..." />
      </div>
    </div>
  )
}
