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
  IconDotsVertical,
  IconCalendarPlus,
  IconUsers,
  IconCheck,
  IconX,
  IconPlayerPause,
  IconBrain,
  IconStar,
  IconClock,
} from "@tabler/icons-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

export type InterviewJobPosting = {
  id: string
  title: string
  description: string
  requirements: string
  experience_required: number
  skills_required: string[]
  status: 'draft' | 'active' | 'closed' | 'paused'
  created_at: string
  updated_at: string
  candidateCount: number
  ai_analysis?: {
    key_skills: string[]
    required_experience?: string
    education_requirements: string[]
    responsibilities: string[]
    qualifications: string[]
    nice_to_have: string[]
    job_level?: string
    remote_work?: boolean
    salary_range?: string
    company_benefits: string[]
    industry?: string
    job_summary: string
    difficulty_score: number
    confidence_score: number
    analysis_date: string
  } | null
}

interface InterviewSetupTableProps {
  data: InterviewJobPosting[]
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <IconCheck className="h-4 w-4" />
    case 'paused':
      return <IconPlayerPause className="h-4 w-4" />
    case 'closed':
      return <IconX className="h-4 w-4" />
    case 'draft':
      return <IconClock className="h-4 w-4" />
    default:
      return <IconClock className="h-4 w-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    case 'draft':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export function InterviewSetupTable({ data }: InterviewSetupTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<InterviewJobPosting>[] = React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Job Title",
        cell: ({ row }) => (
          <Link 
            href={`/interview-setup/${row.original.id}/settings`} 
            className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            {row.getValue("title")}
          </Link>
        ),
      },
      {
        accessorKey: "experience_required",
        header: "Min Experience",
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("experience_required")} years
          </div>
        ),
      },
      {
        accessorKey: "candidateCount",
        header: "Candidates",
        cell: ({ row }) => {
          const count = row.getValue("candidateCount") as number
          return (
            <div className="flex items-center justify-center gap-1">
              <IconUsers className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{count}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "ai_analysis_status",
        header: "AI Analysis",
        cell: ({ row }) => {
          const hasAnalysis = row.original.ai_analysis
          const difficultyScore = row.original.ai_analysis?.difficulty_score

          return (
            <div className="text-center">
              {hasAnalysis ? (
                <div className="flex flex-col items-center gap-1">
                  <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                    <IconBrain className="h-3 w-3 mr-1" />
                    Analyzed
                  </Badge>
                  {difficultyScore && (
                    <div className="flex items-center gap-1">
                      <IconStar className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">{difficultyScore}/10</span>
                    </div>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-500">
                  <IconClock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Badge 
              className={`capitalize ${getStatusColor(status)}`}
              variant="outline"
            >
              {getStatusIcon(status)}
              {status}
            </Badge>
          )
        },
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => {
          const dateString = row.getValue("created_at") as string
          try {
            const date = new Date(dateString)
            const formattedDate = date.toISOString().split('T')[0]
            return (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formattedDate}
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
          const job = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <IconDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/interview-setup/${job.id}/settings`} className="flex w-full items-center">
                    <IconCalendarPlus className="mr-2 h-4 w-4" />
                    Interview Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/job-postings/${job.id}/candidates`} className="flex w-full items-center">
                    <IconUsers className="mr-2 h-4 w-4" />
                    View Candidates
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/job-postings`} className="flex w-full items-center">
                    <IconBrain className="mr-2 h-4 w-4" />
                    View Job Details
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    []
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

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter jobs..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
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
                  No job postings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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
    </div>
  )
}
