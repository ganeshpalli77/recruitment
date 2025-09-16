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
  IconEye,
  IconClock,
  IconCheck,
  IconPlayerPause,
  IconBrain,
  IconStar,
  IconTags,
  IconUsers,
  IconCalendar,
  IconArrowsUpDown,
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

export type JobPosting = {
  id: string
  title: string
  description: string
  requirements: string
  experience_required: number
  skills_required: string[]
  status: 'draft' | 'active' | 'closed' | 'paused'
  created_at: string
  updated_at: string
  // AI Analysis field (consolidated)
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

interface CandidatesJobPostingsTableProps {
  data: JobPosting[]
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <IconCheck className="h-4 w-4" />
    case 'paused':
      return <IconPlayerPause className="h-4 w-4" />
    case 'closed':
      return <IconClock className="h-4 w-4" />
    case 'draft':
      return <IconClock className="h-4 w-4" />
    default:
      return <IconClock className="h-4 w-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300'
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300'
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-300'
    case 'draft':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-300'
  }
}

export function CandidatesJobPostingsTable({ data }: CandidatesJobPostingsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<JobPosting>[] = React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0 h-auto font-medium"
            >
              Job Title
              <IconArrowsUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <Link 
            href={`/job-postings/${row.original.id}/candidates`}
            className="font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 transition-colors"
          >
            {row.getValue("title")}
          </Link>
        ),
      },
      {
        accessorKey: "experience_required",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0 h-auto font-medium"
            >
              Experience
              <IconArrowsUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <IconClock className="h-4 w-4 text-gray-500" />
            <span>{row.getValue("experience_required")} years</span>
          </div>
        ),
      },
      {
        accessorKey: "ai_analysis_status",
        header: "AI Insights",
        cell: ({ row }) => {
          const hasAnalysis = row.original.ai_analysis
          const difficultyScore = row.original.ai_analysis?.difficulty_score
          const keySkillsCount = row.original.ai_analysis?.key_skills?.length || 0

          return (
            <div className="flex flex-col gap-1">
              {hasAnalysis ? (
                <>
                  <Badge className="bg-green-100 text-green-800 border-green-300 text-xs w-fit">
                    <IconBrain className="h-3 w-3 mr-1" />
                    Analyzed
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    {difficultyScore && (
                      <div className="flex items-center gap-1">
                        <IconStar className="h-3 w-3 text-yellow-500" />
                        <span>{difficultyScore}/10</span>
                      </div>
                    )}
                    {keySkillsCount > 0 && (
                      <div className="flex items-center gap-1">
                        <IconTags className="h-3 w-3 text-blue-500" />
                        <span>{keySkillsCount} skills</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-500 w-fit">
                  <IconClock className="h-3 w-3 mr-1" />
                  Processing
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="hover:bg-transparent p-0 h-auto font-medium"
            >
              Posted
              <IconArrowsUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const dateString = row.getValue("created_at") as string
          try {
            const date = new Date(dateString)
            // Use consistent ISO format to avoid hydration mismatches
            const formattedDate = date.toISOString().split('T')[0]
            return (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <IconCalendar className="h-4 w-4 text-gray-500" />
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
                  <Link href={`/job-postings/${job.id}/candidates`} className="flex w-full items-center">
                    <IconUsers className="mr-2 h-4 w-4" />
                    Manage Candidates
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/job-postings/${job.id}/candidates`} className="flex w-full items-center">
                    <IconUsers className="mr-2 h-4 w-4" />
                    Upload Resumes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/job-postings/${job.id}`} className="flex w-full items-center text-purple-600">
                    <IconEye className="mr-2 h-4 w-4" />
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
      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Search job titles..."
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
                  className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20"
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
