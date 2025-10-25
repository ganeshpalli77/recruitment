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
  IconMail,
  IconPhone,
  IconTrophy,
  IconCalendarPlus,
  IconClock,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { generateInterviewQuestions } from '../lib/generate-questions'
import { useRouter } from 'next/navigation'

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
import { Progress } from "@/components/ui/progress"

export type ShortlistedCandidate = {
  id: string
  resume_result_id: string
  candidate_name: string
  candidate_email: string | null
  candidate_phone: string | null
  overall_score: number
  skills_score: number
  experience_score: number
  education_score: number
  recommendation: string | null
  interview_status: string
  interview_date: string | null
  shortlisted_at: string
}

interface ShortlistedTableProps {
  data: ShortlistedCandidate[]
  jobId: string
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <IconTrophy className="h-5 w-5 text-yellow-500" />
  if (rank === 2) return <IconTrophy className="h-5 w-5 text-gray-400" />
  if (rank === 3) return <IconTrophy className="h-5 w-5 text-amber-600" />
  return <span className="text-sm font-semibold text-gray-500">#{rank}</span>
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200'
  if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-orange-600 bg-orange-50 border-orange-200'
}

const getRecommendationColor = (recommendation: string | null) => {
  switch (recommendation) {
    case 'STRONG_MATCH':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'GOOD_MATCH':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'FAIR_MATCH':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export function ShortlistedTable({ data, jobId }: ShortlistedTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'overall_score', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [generatingFor, setGeneratingFor] = React.useState<string | null>(null)

  const handleScheduleInterview = async (candidate: ShortlistedCandidate & { rank: number }) => {
    setGeneratingFor(candidate.id)
    
    try {
      toast.info(`Generating interview questions for ${candidate.candidate_name}...`)
      
      const result = await generateInterviewQuestions({
        candidateId: candidate.id,
        candidateName: candidate.candidate_name,
        jobId: jobId
      })

      if (result.success) {
        toast.success(
          `Successfully generated ${result.data?.totalQuestions} interview questions!`,
          {
            description: `Starting interview... ${result.data?.distribution.screening} screening, ${result.data?.distribution.technical} technical, ${result.data?.distribution.hr} HR questions`
          }
        )
        
        // Navigate to interview screen
        setTimeout(() => {
          router.push(`/interview/${result.data?.questionId}`)
        }, 1500)
      } else {
        toast.error('Failed to generate questions', {
          description: result.error || 'An unexpected error occurred'
        })
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      toast.error('Failed to generate questions', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setGeneratingFor(null)
    }
  }

  const rankedCandidates = React.useMemo(() => {
    return data.map((candidate, index) => ({
      ...candidate,
      rank: index + 1
    }))
  }, [data])

  const columns: ColumnDef<ShortlistedCandidate & { rank: number }>[] = React.useMemo(
    () => [
      {
        accessorKey: "rank",
        header: "Rank",
        cell: ({ row }) => (
          <div className="flex items-center justify-center w-12">
            {getRankIcon(row.getValue("rank"))}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "candidate_name",
        header: "Candidate",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-white">
              {row.getValue("candidate_name")}
            </span>
            <div className="flex flex-col gap-1 mt-1">
              {row.original.candidate_email && (
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <IconMail className="h-3 w-3" />
                  {row.original.candidate_email}
                </span>
              )}
              {row.original.candidate_phone && (
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <IconPhone className="h-3 w-3" />
                  {row.original.candidate_phone}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "overall_score",
        header: "Overall",
        cell: ({ row }) => {
          const score = row.getValue("overall_score") as number
          return (
            <div className="flex flex-col items-center gap-2">
              <Badge className={`${getScoreColor(score)} font-bold px-3 py-1`}>
                {score}%
              </Badge>
              <Progress value={score} className="h-1.5 w-20" />
            </div>
          )
        },
      },
      {
        accessorKey: "skills_score",
        header: "Skills",
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-medium">{row.getValue("skills_score")}%</span>
          </div>
        ),
      },
      {
        accessorKey: "experience_score",
        header: "Experience",
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-medium">{row.getValue("experience_score")}%</span>
          </div>
        ),
      },
      {
        accessorKey: "education_score",
        header: "Education",
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-medium">{row.getValue("education_score")}%</span>
          </div>
        ),
      },
      {
        accessorKey: "recommendation",
        header: "Match",
        cell: ({ row }) => {
          const recommendation = row.getValue("recommendation") as string | null
          return (
            <div className="text-center">
              <Badge className={getRecommendationColor(recommendation)} variant="outline">
                {recommendation?.replace('_', ' ')}
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "interview_status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("interview_status") as string
          return (
            <div className="text-center">
              <Badge 
                variant="outline" 
                className={
                  status === 'scheduled' 
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : status === 'completed'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : status === 'cancelled'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }
              >
                <IconClock className="h-3 w-3 mr-1" />
                {status}
              </Badge>
            </div>
          )
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const isGenerating = generatingFor === row.original.id
          return (
            <div className="text-right">
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleScheduleInterview(row.original)}
                disabled={isGenerating || generatingFor !== null}
              >
                {isGenerating ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <IconCalendarPlus className="h-4 w-4 mr-1" />
                    Schedule
                  </>
                )}
              </Button>
            </div>
          )
        },
      },
    ],
    [generatingFor]
  )

  const table = useReactTable({
    data: rankedCandidates,
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

  return (
    <div className="w-full">
      <div className="flex items-center py-4 px-4">
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
      
      <div className="border-t">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-center">
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
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
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
                  No shortlisted candidates yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4 px-4">
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
    </div>
  )
}
