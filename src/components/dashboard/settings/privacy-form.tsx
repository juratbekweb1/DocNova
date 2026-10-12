"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const privacyFormSchema = z.object({
  profile_visibility: z.enum(["public", "private"]),
  analytics_preferences: z.boolean().default(true).optional(),
})

type PrivacyFormValues = z.infer<typeof privacyFormSchema>

const defaultValues: Partial<PrivacyFormValues> = {
  profile_visibility: "private",
  analytics_preferences: true,
}

export function PrivacyForm() {
  const { toast } = useToast()

  const form = useForm<PrivacyFormValues>({
    resolver: zodResolver(privacyFormSchema),
    defaultValues,
  })

  function onSubmit(_data: PrivacyFormValues) {
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved.",
      variant: "success",
    })
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="profile_visibility"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Profile Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="public" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Public - Anyone can view your profile
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="private" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Private - Only you can view your profile
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="h-px w-full bg-border" />

            <FormField
              control={form.control}
              name="analytics_preferences"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Data Analytics
                    </FormLabel>
                    <FormDescription>
                      Allow DocNova to collect anonymous usage data to improve our services.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit">Save preferences</Button>
          </form>
        </Form>
      </Card>

      <Card className="p-6">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Data Export</h3>
            <p className="text-sm text-foreground-secondary">
              Request a copy of your personal data stored on DocNova.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => {
          toast({
            title: "Data export requested",
            description: "We will email you a link to download your data within 24 hours.",
          })
        }}>
          <Download className="mr-2 h-4 w-4" />
          Request Data Export
        </Button>
      </Card>
    </div>
  )
}
