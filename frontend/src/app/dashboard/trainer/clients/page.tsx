"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  differenceInDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

import {
  fetchClientsForTrainer,
  ClientForTrainer,
} from "@/server-actions/trainer/clients/actions";
import { ClientHabitsSummary } from "@/components/dashboard/trainer/ClientHabitsSummary";
import { FitbitActivities } from "@/components/dashboard/trainer/FitbitActivities";
import { ClientEmailsSummary } from "@/components/dashboard/trainer/ClientEmailsSummary";

const calculateAge = (dateOfBirth: string | undefined) => {
  if (!dateOfBirth) return "N/A";
  const dob = new Date(dateOfBirth);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
};

interface Client extends ClientForTrainer {}

const TrainerClientsPage = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    return endOfWeek(new Date(), { weekStartsOn: 1 });
  });

  const { data: clients = [], error: fetchClientsError } = useQuery({
    queryKey: ["clients", searchTerm],
    queryFn: () => fetchClientsForTrainer(searchTerm),
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (fetchClientsError) {
      console.error("Failed to fetch clients:", fetchClientsError);
      toast.error("Failed to load clients", {
        description: "Could not retrieve client list.",
      });
    }
  }, [fetchClientsError]);

  useEffect(() => {
    if (selectedClientId) {
      setSelectedClient(clients.find((c) => c.id === selectedClientId) || null);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId, clients]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Client Management</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Find a Client</CardTitle>
          <div className="pt-4 min-w-0">
            <Combobox
              options={clients.map((client) => ({
                value: client.id,
                label: `${client.name} (${client.email})`,
              }))}
              value={selectedClientId || ""}
              onValueChange={setSelectedClientId}
              placeholder="Select a client..."
              searchPlaceholder="Search clients..."
              noResultsText="No clients found."
              onSearchChange={setSearchTerm}
            />
          </div>
        </CardHeader>
      </Card>

      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-6">
            <Link
              href={`/dashboard/client/profile?clientId=${selectedClient.id}`}
            >
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 border-primary">
                <AvatarImage
                  src={selectedClient.avatarUrl || "/placeholder-avatar.jpg"}
                  alt={selectedClient.name}
                  className="object-cover"
                />
                <AvatarFallback>{selectedClient.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <p className="text-xl font-semibold">{selectedClient.name}</p>
              <p className="text-muted-foreground">
                Email: {selectedClient.email}
              </p>
              {selectedClient.phone && (
                <p className="text-muted-foreground">
                  Phone: {selectedClient.phone}
                </p>
              )}
              {selectedClient.dateOfBirth && (
                <p className="text-muted-foreground">
                  Date of Birth:{" "}
                  {new Date(selectedClient.dateOfBirth).toLocaleDateString()}{" "}
                  (Age: {calculateAge(selectedClient.dateOfBirth)})
                </p>
              )}
              {selectedClient.gender && (
                <p className="text-muted-foreground">
                  Gender: {selectedClient.gender}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClient && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Date Range</CardTitle>
            <CardDescription>
              Select a date range to view client data. (Max 7-days)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Start Date</Label>
              <Popover
                open={isStartDatePopoverOpen}
                onOpenChange={setIsStartDatePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "EEE, dd-MMM-yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(newDate) => {
                      if (newDate) {
                        const normalizedDate = startOfDay(newDate);

                        setStartDate(normalizedDate);
                        if (
                          endDate &&
                          (Math.abs(differenceInDays(endDate, normalizedDate)) >
                            6 ||
                            normalizedDate > endDate)
                        ) {
                          const adjustedEndDate = new Date(normalizedDate);
                          adjustedEndDate.setDate(
                            adjustedEndDate.getDate() + 6
                          );
                          setEndDate(endOfDay(adjustedEndDate));
                          toast.info("Date Range Adjusted", {
                            description:
                              "End date adjusted to maintain a 7-day range.",
                          });
                        }
                        setIsStartDatePopoverOpen(false); // Close popover after selection
                      }
                    }}
                    className="w-full"
                    weekStartsOn={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <Label>End Date</Label>
              <Popover
                open={isEndDatePopoverOpen}
                onOpenChange={setIsEndDatePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "EEE, dd-MMM-yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(newDate) => {
                      if (newDate) {
                        // Normalize newDate to the end of the day to avoid timezone issues
                        const normalizedDate = endOfDay(newDate); // Use endOfDay
                        setEndDate(normalizedDate);
                        if (
                          startDate &&
                          (Math.abs(
                            differenceInDays(normalizedDate, startDate)
                          ) > 6 ||
                            normalizedDate < startDate)
                        ) {
                          const adjustedStartDate = new Date(normalizedDate);
                          adjustedStartDate.setDate(
                            adjustedStartDate.getDate() - 6
                          );
                          setStartDate(startOfDay(adjustedStartDate));
                          toast.info("Date Range Adjusted", {
                            description:
                              "Start date adjusted to maintain a 7-day range.",
                          });
                        }
                        setIsEndDatePopoverOpen(false); // Close popover after selection
                      }
                    }}
                    className="w-full"
                    weekStartsOn={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClient && (
        <>
          <ClientHabitsSummary
            clientId={selectedClient.id}
            startDate={startDate}
            endDate={endDate}
          />
          <FitbitActivities
            clientId={selectedClient.id}
            startDate={startDate}
            endDate={endDate}
          />
          <ClientEmailsSummary
            clientId={selectedClient.id}
            clientEmail={selectedClient.email}
            startDate={startDate}
            endDate={endDate}
          />
        </>
      )}
    </div>
  );
};

export default TrainerClientsPage;