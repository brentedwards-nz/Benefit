// components/profile-edit-form.tsx
"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import {
  ProfileSchema,
  //ContactInfoItemSchema,
  ProfileFormValues,
  //ContactInfoItemFormValues,
} from "./schema";

import { Profile } from "@/server-actions/profile/types";

interface ProfileEditFormProps {
  initialData: Profile;
  onSubmit: (data: ProfileFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProfileEditForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: ProfileEditFormProps) {
  const defaultValues: ProfileFormValues = {
    ...initialData,
    contact_info:
      initialData.contact_info?.map((ci) => ({
        ...ci,
        id: ci.id || Math.random().toString(),
      })) || [],
    birth_date:
      initialData.birth_date instanceof Date
        ? initialData.birth_date
        : initialData.birth_date
        ? new Date(initialData.birth_date)
        : null,
    DateTime:
      initialData.DateTime instanceof Date
        ? initialData.DateTime
        : initialData.DateTime
        ? new Date(initialData.DateTime)
        : null,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contact_info",
  });

  const handlePrimaryChange = (indexToSetPrimary: number) => {
    const contactInfos = form.getValues("contact_info");

    let updatedContactInfos: {
      type: "email" | "phone" | "address" | "social";
      value: string;
      primary: boolean;
      id?: string | undefined;
      label?: string | null | undefined;
    }[] = [];

    if (contactInfos) {
      const selectedInfo = contactInfos[indexToSetPrimary];
      contactInfos.forEach((contactInfo, index, array) => {
        if (contactInfo.type == selectedInfo.type) {
          if (index == indexToSetPrimary) {
            updatedContactInfos.push({ ...contactInfo, primary: true });
          } else {
            updatedContactInfos.push({ ...contactInfo, primary: false });
          }
        } else {
          updatedContactInfos.push(contactInfo);
        }
      });
    }
    form.setValue("contact_info", updatedContactInfos!, { shouldDirty: true });
  };

  const handleFormSubmit = (data: ProfileFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your basic profile details.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem className="md:col-span-2">
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  value={`${form.watch("first_name")} ${form.watch(
                    "last_name"
                  )}`}
                  readOnly
                  disabled
                />
              </FormControl>
              <FormDescription>
                Your full name is derived from your first and last name.
              </FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    A URL to your profile picture.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Manage your contact details (email, phone, address, social).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row gap-4 border p-4 rounded-md"
              >
                <FormField
                  control={form.control}
                  name={`contact_info.${index}.type`}
                  render={({ field }) => (
                    <FormItem className="w-full md:w-1/4">
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="address">Address</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`contact_info.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="w-full md:w-1/2">
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact detail" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`contact_info.${index}.label`}
                  render={({ field }) => (
                    <FormItem className="w-full md:w-1/4">
                      <FormLabel>Label (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Work, Home"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center space-x-2 self-end mb-1">
                  <FormField
                    control={form.control}
                    name={`contact_info.${index}.primary`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={() => handlePrimaryChange(index)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Primary</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({ type: "email", value: "", primary: false, label: "" })
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Contact
            </Button>
            {form.formState.errors.contact_info?.root && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.contact_info.root.message}
              </p>
            )}
          </CardContent>
        </Card>

        {false && (
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>
                Manage account current and disabled status.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Current Account
                      </FormLabel>
                      <FormDescription>
                        Is this your currently active profile.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-readonly={field.disabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="disabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Account Disabled
                      </FormLabel>
                      <FormDescription>
                        If enabled, this account cannot be used.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-readonly={field.disabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {false && (
          <Card>
            <CardHeader>
              <CardTitle>Other Details</CardTitle>
              <CardDescription>Additional information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormItem>
                <FormLabel>Auth ID</FormLabel>
                <FormControl>
                  <Input value={form.watch("auth_id")} readOnly disabled />
                </FormControl>
                <FormDescription>
                  Unique identifier from authentication system.
                </FormDescription>
              </FormItem>
              <FormItem>
                <FormLabel>Last Updated</FormLabel>
                <FormControl>
                  <Input
                    value={
                      form.watch("DateTime")
                        ? format(form.watch("DateTime")!, "PPP p")
                        : "N/A"
                    }
                    readOnly
                    disabled
                  />
                </FormControl>
                <FormDescription>
                  The last time this profile was updated.
                </FormDescription>
              </FormItem>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
