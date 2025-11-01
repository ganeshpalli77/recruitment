"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconStar,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconEye,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CandidateDetailModal } from "./candidate-detail-modal"

export type CandidateEvaluation = {
  id: string
  candidate_id: string
  candidate_name: string
  overall_score: number
  average_score: number
  total_questions: number
  recommendation: string
  confidence_level: string
  communication_quality: string
  summary: string
  strengths: string[]
  key_strengths?: string[]
  areas_for_improvement: string[]
  key_weaknesses?: string[]
  question_analyses?: Array<{
    question: string
    answer: string
    score: number
    feedback: string
    strengths: string[]
    improvements: string[]
  }>
  analyzed_at: string
  created_at: string
  interview_recordings?: Array<{
    video_url: string
    file_path: string
  }>
}

interface CandidateEvaluationTableProps {
  data: CandidateEvaluation[]
  jobId: string
}

const getScoreColor = (score: number) => {
  if (score >= 4) return 'text-green-600 bg-green-50'
  if (score >= 3) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

const getRecommendationBadge = (recommendation: string) => {
  const rec = recommendation.toLowerCase()
  if (rec.includes('strong') || rec.includes('highly')) {
    return 'bg-green-100 text-green-800 border-green-300'
  }
  if (rec.includes('recommend')) {
    return 'bg-blue-100 text-blue-800 border-blue-300'
  }
  if (rec.includes('consider')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }
  return 'bg-red-100 text-red-800 border-red-300'
}

const getScoreIcon = (score: number) => {
  if (score >= 4) return <IconTrendingUp className="h-4 w-4" />
  if (score >= 3) return <IconMinus className="h-4 w-4" />
  return <IconTrendingDown className="h-4 w-4" />
}

export function CandidateEvaluationTable({ data, jobId }: CandidateEvaluationTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'overall_score', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedCandidate, setSelectedCandidate] = React.useState<CandidateEvaluation | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)

  const columns: ColumnDef<CandidateEvaluation>[] = React.useMemo(
    () => [
      {
        accessorKey: "candidate_name",
        header: "Candidate Name",
        cell: ({ row }) => (
          <div className="font-medium text-gray-900 dark:text-white">
            {row.getValue("candidate_name")}
          </div>
        ),
      },
      {
        accessorKey: "overall_score",
        header: "Overall Score",
        cell: ({ row }) => {
          const score = row.getValue("overall_score") as number
          return (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold ${getScoreColor(score)}`}>
                {getScoreIcon(score)}
                <span>{score}/5</span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "average_score",
        header: "Avg Score",
        cell: ({ row }) => {
          const score = row.getValue("average_score") as number
          return (
            <div className="text-sm text-gray-600">
              {score.toFixed(1)}/5
            </div>
          )
        },
      },
      {
        accessorKey: "total_questions",
        header: "Questions",
        cell: ({ row }) => (
          <div className="text-center text-sm text-gray-600">
            {row.getValue("total_questions")}
          </div>
        ),
      },
      {
        accessorKey: "recommendation",
        header: "Recommendation",
        cell: ({ row }) => {
          const recommendation = row.getValue("recommendation") as string
          return (
            <Badge 
              className={getRecommendationBadge(recommendation)}
              variant="outline"
            >
              {recommendation}
            </Badge>
          )
        },
      },
      {
        accessorKey: "communication_quality",
        header: "Communication",
        cell: ({ row }) => {
          const quality = row.getValue("communication_quality") as string
          return (
            <div className="text-sm text-gray-600 capitalize">
              {quality}
            </div>
          )
        },
      },
      {
        accessorKey: "analyzed_at",
        header: "Interview Date",
        cell: ({ row }) => {
          const dateString = row.getValue("analyzed_at") as string
          try {
            const date = new Date(dateString)
            const formattedDate = date.toISOString().split('T')[0]
            const formattedTime = date.toTimeString().split(' ')[0].slice(0, 5)
            return (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>{formattedDate}</div>
                <div className="text-xs text-gray-500">{formattedTime}</div>
              </div>
            )
          } catch (error) {
            return (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                N/A
              </div>
            )
          }
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const candidate = row.original
          return (
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedCandidate(candidate)
                  setModalOpen(true)
                }}
              >
                <IconEye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          )
        },
      },
    ],
    [setSelectedCandidate, setModalOpen]
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // Calculate statistics
  const avgOverallScore = data.length > 0 
    ? (data.reduce((sum, item) => sum + item.overall_score, 0) / data.length).toFixed(1)
    : '0'
  
  const recommendCount = data.filter(item => 
    item.recommendation.toLowerCase().includes('recommend')
  ).length

  return (
    <div className="w-full space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Candidates</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgOverallScore}/5</p>
        </div>
        <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Recommended</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {recommendCount}/{data.length}
          </p>
        </div>
      </div>

      {/* Filter and Column Controls */}
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter candidates..."
          value={(table.getColumn("candidate_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("candidate_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <IconChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No candidates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <IconChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
