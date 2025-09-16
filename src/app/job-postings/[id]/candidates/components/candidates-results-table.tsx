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
  IconMail,
  IconPhone,
  IconTrophy,
  IconStar,
  IconBrain,
  IconBriefcase,
  IconUser,
  IconEye,
  IconDownload,
  IconCircleCheckFilled,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react"

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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface CandidateData {
  evaluationId: string
  id: string
  name: string
  email: string
  phone?: string | null
  position: string
  status: string
  ai_score?: number | null
  overallScore: number
  skillsScore: number
  experienceScore: number
  educationScore: number
  skills_match?: string | null
  experience_years?: number | null
  education?: string | null
  resume_url?: string | null
  submission_date?: string | null
  evaluationDetails?: any
  evaluatedAt: string
}

interface CandidatesResultsTableProps {
  candidates: CandidateData[]
  jobId: string
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <IconTrophy className="h-4 w-4 text-yellow-500" />
  if (rank === 2) return <IconTrophy className="h-4 w-4 text-gray-400" />
  if (rank === 3) return <IconTrophy className="h-4 w-4 text-amber-600" />
  return <span className="text-sm font-semibold text-gray-500">#{rank}</span>
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200'
  if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

const getScoreTrend = (score: number) => {
  if (score >= 80) return <IconTrendingUp className="h-3 w-3 text-green-500" />
  if (score >= 60) return <IconMinus className="h-3 w-3 text-yellow-500" />
  return <IconTrendingDown className="h-3 w-3 text-red-500" />
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'shortlisted':
      return <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
    case 'under_review':
    case 'under review':
      return <IconClock className="h-4 w-4 text-yellow-500" />
    case 'processing':
      return <IconBrain className="h-4 w-4 text-blue-500 animate-pulse" />
    default:
      return <IconUser className="h-4 w-4 text-gray-500" />
  }
}

export function CandidatesResultsTable({ candidates, jobId }: CandidatesResultsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'overallScore', desc: true } // Default sort by overall score descending
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Add rank based on sort order
  const rankedCandidates = React.useMemo(() => {
    return candidates.map((candidate, index) => ({
      ...candidate,
      rank: index + 1
    }))
  }, [candidates])

  const columns: ColumnDef<CandidateData & { rank: number }>[] = React.useMemo(
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
        accessorKey: "name",
        header: "Candidate",
        cell: ({ row }) => (
          <Drawer>
            <DrawerTrigger asChild>
              <Button 
                variant="link" 
                className="h-auto p-0 text-left font-medium justify-start"
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {row.getValue("name")}
                  </span>
                  <span className="text-xs text-gray-500 font-normal">
                    {row.original.email}
                  </span>
                </div>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-w-4xl mx-auto">
              <DrawerHeader>
                <DrawerTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                    <IconUser className="h-5 w-5 text-white" />
                  </div>
                  {row.original.name}
                  <Badge className={`ml-auto ${getScoreColor(row.original.overallScore)}`}>
                    {row.original.overallScore}% Match
                  </Badge>
                </DrawerTitle>
                <DrawerDescription>
                  Detailed candidate analysis and AI evaluation results
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="px-6 pb-6 space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <IconUser className="h-4 w-4" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <IconMail className="h-4 w-4 text-gray-500" />
                        <span>{row.original.email}</span>
                      </div>
                      {row.original.phone && (
                        <div className="flex items-center gap-2">
                          <IconPhone className="h-4 w-4 text-gray-500" />
                          <span>{row.original.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <IconBriefcase className="h-4 w-4 text-gray-500" />
                        <span>{row.original.position}</span>
                      </div>
                      {row.original.experience_years && (
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4 text-gray-500" />
                          <span>{row.original.experience_years} years experience</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Scores Breakdown */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <IconBrain className="h-4 w-4" />
                      AI Analysis Breakdown
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Score</span>
                          <div className="flex items-center gap-2">
                            {getScoreTrend(row.original.overallScore)}
                            <span className="font-semibold">{row.original.overallScore}%</span>
                          </div>
                        </div>
                        <Progress value={row.original.overallScore} className="h-3" />
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Skills Match</span>
                            <span className="text-sm font-semibold">{row.original.skillsScore}%</span>
                          </div>
                          <Progress value={row.original.skillsScore} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Experience</span>
                            <span className="text-sm font-semibold">{row.original.experienceScore}%</span>
                          </div>
                          <Progress value={row.original.experienceScore} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Education</span>
                            <span className="text-sm font-semibold">{row.original.educationScore}%</span>
                          </div>
                          <Progress value={row.original.educationScore} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Details */}
                {(row.original.education || row.original.skills_match) && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Additional Details</h4>
                      <div className="space-y-2 text-sm">
                        {row.original.education && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Education: </span>
                            <span>{row.original.education}</span>
                          </div>
                        )}
                        {row.original.skills_match && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Skills Match: </span>
                            <span>{row.original.skills_match}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Analyzed: </span>
                          <span>{new Date(row.original.evaluatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <DrawerFooter>
                <div className="flex gap-2">
                  {row.original.resume_url && (
                    <Button variant="outline">
                      <IconDownload className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                  )}
                  <Button>
                    Schedule Interview
                  </Button>
                </div>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ),
      },
      {
        accessorKey: "overallScore",
        header: "Overall Score",
        cell: ({ row }) => (
          <div className="text-center">
            <Badge className={`font-bold ${getScoreColor(row.original.overallScore)}`}>
              {row.original.overallScore}%
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "skillsScore",
        header: "Skills",
        cell: ({ row }) => (
          <div className="text-center">
            <div className="font-semibold text-sm">{row.original.skillsScore}%</div>
            <Progress value={row.original.skillsScore} className="h-1 mt-1" />
          </div>
        ),
      },
      {
        accessorKey: "experienceScore",
        header: "Experience",
        cell: ({ row }) => (
          <div className="text-center">
            <div className="font-semibold text-sm">{row.original.experienceScore}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {row.original.experience_years || 0} years
            </div>
          </div>
        ),
      },
      {
        accessorKey: "educationScore",
        header: "Education",
        cell: ({ row }) => (
          <div className="text-center">
            <div className="font-semibold text-sm">{row.original.educationScore}%</div>
            <Progress value={row.original.educationScore} className="h-1 mt-1" />
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Badge variant="outline" className="capitalize">
              {getStatusIcon(status)}
              {status.replace('_', ' ')}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
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
                <DropdownMenuItem>
                  <IconEye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {row.original.resume_url && (
                  <DropdownMenuItem>
                    <IconDownload className="mr-2 h-4 w-4" />
                    Download Resume
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  Schedule Interview
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Add to Shortlist
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
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
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
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
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
      
      <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} candidates selected.
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
