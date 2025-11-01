"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { 
  IconPlus, 
  IconBriefcase, 
  IconClock, 
  IconTags, 
  IconFileText, 
  IconClipboardList,
  IconSparkles
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { createJobPosting } from '@/app/job-postings/actions'

type JobPostingFormValues = {
  title: string
  description: string
  experience_required: number
}

const jobPostingSchema = z.object({
  title: z.string().min(5, {
    message: "Job title must be at least 5 characters.",
  }),
  description: z.string().min(50, {
    message: "Job description must be at least 50 characters.",
  }),
  experience_required: z.number().min(0, {
    message: "Experience must be 0 or greater.",
  }).max(20, {
    message: "Experience cannot exceed 20 years.",
  }),
}) satisfies z.ZodType<JobPostingFormValues>

export function JobPostingForm() {
  const form = useForm<z.infer<typeof jobPostingSchema>>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      title: "",
      description: "",
      experience_required: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof jobPostingSchema>) {
    const formData = new FormData()
    formData.append('title', values.title)
    formData.append('description', values.description)
    formData.append('experience_required', values.experience_required.toString())
    
    await createJobPosting(formData)
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <Card className="border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
            <IconSparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Job Posting
          </CardTitle>
          <CardDescription className="text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Add a new job opening to attract top talent for your team. Fill out the details below to create a comprehensive job listing.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Form Section */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <IconBriefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-base font-medium flex items-center gap-2">
                          <IconBriefcase className="h-4 w-4 text-blue-600" />
                          Job Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Senior Full Stack Developer"
                            className="h-12 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a clear and specific job title that candidates will understand.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience_required"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center gap-2">
                          <IconClock className="h-4 w-4 text-blue-600" />
                          Minimum Experience (Years)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            placeholder="3"
                            className="h-12 text-base"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum years of relevant experience required.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-8" />

              {/* Job Details Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                    <IconFileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Job Details
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center gap-2">
                        <IconFileText className="h-4 w-4 text-green-600" />
                        Job Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the role, responsibilities, and company culture..."
                          className="min-h-[160px] text-base leading-relaxed"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe the role, responsibilities, company culture, and what makes this opportunity attractive.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-8" />

              {/* Submit Section */}
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-3">
                    <IconSparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Ready to Publish?
                    </h4>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Your job posting will be published as "Active" and will immediately start attracting candidates to your recruitment pipeline.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      AI-Powered Matching
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      Bias-Free Selection
                    </Badge>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                      Automated Screening
                    </Badge>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <IconSparkles className="h-5 w-5 mr-3 animate-spin" />
                      Creating Job Post...
                    </>
                  ) : (
                    <>
                      <IconPlus className="h-5 w-5 mr-3" />
                      Create Job Post
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
