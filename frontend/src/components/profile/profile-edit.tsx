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
import { Label } from "@/components/ui/label";
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

import { Client } from "@/server-actions/client/types";
import { toast } from "sonner";

interface ProfileEditFormProps {
  initialData: Client;
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
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    contactInfo:
      initialData.contactInfo?.map((ci) => ({
        ...ci,
        id: ci.id || Math.random().toString(),
      })) || [],
    birthDate:
      initialData.birthDate instanceof Date
        ? initialData.birthDate
        : initialData.birthDate
          ? new Date(initialData.birthDate)
          : null,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contactInfo",
  });

  const handlePrimaryChange = (indexToSetPrimary: number) => {
    const contactInfos = form.getValues("contactInfo");

    const updatedContactInfos: {
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
    form.setValue("contactInfo", updatedContactInfos!, { shouldDirty: true });
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
          <CardContent className="space-y-6">
            {/* Avatar Preview Section */}
            <div className="flex flex-col items-center space-y-4 pb-4 border-b">
              <div className="relative">
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
                    if (fileInput) fileInput.click();
                  }}
                >
                  {form.watch("avatarUrl") ? (
                    <img
                      src={form.watch("avatarUrl") || ""}
                      alt="Profile picture"
                      className="w-24 h-24 rounded-full object-cover border-4 border-border shadow-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted border-4 border-border flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <span className="text-2xl text-muted-foreground">
                        {form.watch("firstName")?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                {form.watch("avatarUrl") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-background hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => form.setValue("avatarUrl", "")}
                  >
                    ×
                  </Button>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {form.watch("firstName")} {form.watch("lastName")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {form.watch("avatarUrl") ? "Click to change" : "Click to upload"}
                </p>
              </div>

              {/* Hidden file input */}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      // Import and use image utilities
                      const { validateImageFile, compressAndResizeImage } = await import('@/lib/imageUtils');

                      // Validate file
                      const validation = validateImageFile(file, 2);
                      if (!validation.valid) {
                        toast.error(validation.error || "Invalid image file");
                        return;
                      }

                      // Compress and resize image
                      const compressedImageUrl = await compressAndResizeImage(file, 200, 200, 0.8);
                      form.setValue("avatarUrl", compressedImageUrl);
                      toast.success("Profile picture uploaded successfully!");
                    } catch (error) {
                      console.error("Error processing image:", error);
                      toast.error("Failed to process image. Please try again.");
                    }
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
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
                name="lastName"
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
                    value={`${form.watch("firstName")} ${form.watch(
                      "lastName"
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
                name="birthDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : null;
                            field.onChange(date);
                          }}
                          max={format(new Date(), "yyyy-MM-dd")}
                          min="1900-01-01"
                          className="flex-1"
                        />
                      </FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="px-3"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-3 border-b">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Quick Navigation</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((year) => (
                                <Button
                                  key={year}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentDate = field.value || new Date();
                                    const newDate = new Date(currentDate);
                                    newDate.setFullYear(year);
                                    field.onChange(newDate);
                                  }}
                                  className="text-xs"
                                >
                                  {year}s
                                </Button>
                              ))}
                            </div>
                          </div>
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            captionLayout="dropdown"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="PreferNotToSay">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />


            </div>
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
                  name={`contactInfo.${index}.type`}
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
                  name={`contactInfo.${index}.value`}
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
                  name={`contactInfo.${index}.label`}
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
                    name={`contactInfo.${index}.primary`}
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
            {form.formState.errors.contactInfo?.root && (
              <p className="text-sm font-medium text-destructive mt-2">
                {form.formState.errors.contactInfo.root.message}
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
                  <Input value={form.watch("authId")} readOnly disabled />
                </FormControl>
                <FormDescription>
                  Your unique authentication identifier.
                </FormDescription>
              </FormItem>

              <FormItem>
                <FormLabel>Created At</FormLabel>
                <FormControl>
                  <Input
                    value={
                      form.watch("createdAt")
                        ? format(form.watch("createdAt")!, "PPP p")
                        : "Not set"
                    }
                    readOnly
                    disabled
                  />
                </FormControl>
                <FormDescription>
                  When your profile was created.
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
