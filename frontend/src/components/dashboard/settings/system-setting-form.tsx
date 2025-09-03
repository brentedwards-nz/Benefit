"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SystemSettingSchema, SystemSetting } from "@/server-actions/settings/types";
import { SystemSettingType } from "@prisma/client";

const formSchema = SystemSettingSchema.omit({ id: true });

export type SystemSettingFormValues = z.infer<typeof formSchema>;

interface SystemSettingFormProps {
  setting?: SystemSetting;
  onSubmit: (values: SystemSettingFormValues) => void;
  onCancel: () => void;
}

export function SystemSettingForm({
  setting,
  onSubmit,
  onCancel,
}: SystemSettingFormProps) {
  const form = useForm<SystemSettingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: setting
      ? {
          key: setting.key,
          value: setting.value,
          type: setting.type,
          description: setting.description || "",
        }
      : {
          key: "",
          value: "",
          type: SystemSettingType.String, // Default to String type
          description: "",
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input placeholder="Setting Key" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input placeholder="Setting Value" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(SystemSettingType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description (optional)"
                  className="resize-y"
                  {...field}
                  value={field.value || ""} // Ensure controlled component
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {setting ? "Update" : "Create"} Setting
          </Button>
        </div>
      </form>
    </Form>
  );
}
