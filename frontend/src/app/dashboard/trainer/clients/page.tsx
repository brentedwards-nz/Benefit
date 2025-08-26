"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dumbbell,
  Footprints,
  Bike,
  Waves,
  Activity,
  Calculator,
  LucideIcon,
  CalendarIcon,
} from "lucide-react";

import {
  fetchClientsForTrainer,
  ClientForTrainer,
} from "@/server-actions/trainer/clients/actions";
import { getClientActivities } from "@/server-actions/fitbit/actions";

interface Client extends ClientForTrainer {}

const TrainerClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [clientActivities, setClientActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date;
  });

  useEffect(() => {
    startTransition(async () => {
      try {
        const fetchedClients = await fetchClientsForTrainer(searchTerm);
        setClients(fetchedClients);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
        toast.error("Failed to load clients", {
          description: "Could not retrieve client list.",
        });
      }
    });
  }, [searchTerm]);

  useEffect(() => {
    if (selectedClientId) {
      setSelectedClient(clients.find((c) => c.id === selectedClientId) || null);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId, clients]);

  useEffect(() => {
    if (selectedClient?.id && startDate && endDate) {
      setIsLoadingActivities(true);
      startTransition(async () => {
        try {
          const activities = await getClientActivities(
            selectedClient.id,
            startDate,
            endDate
          );
          setClientActivities(activities);
        } catch (error) {
          console.error("Failed to fetch client activities:", error);
          toast.error("Failed to load activities", {
            description: "Could not retrieve client Fitbit activities.",
          });
        } finally {
          setIsLoadingActivities(false);
        }
      });
    } else {
      setClientActivities([]);
      setIsLoadingActivities(false);
    }
  }, [selectedClient, startDate, endDate, startTransition]);

  const calculateAge = (dateOfBirth: string | undefined) => {
    if (!dateOfBirth) return "N/A";
    const dob = new Date(dateOfBirth);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Client Management</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Find a Client</CardTitle>
          <div className="pt-4">
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
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage
                src={selectedClient.avatarUrl || "/placeholder-avatar.jpg"}
                alt={selectedClient.name}
              />
              <AvatarFallback>{selectedClient.name.charAt(0)}</AvatarFallback>
            </Avatar>
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
              Select a date range to view client data.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Start Date</Label>
              <Popover>
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
                      format(startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="w-full"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <Label>End Date</Label>
              <Popover>
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
                      format(endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="w-full"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClient && isLoadingActivities && (
        <Loading
          title="Loading Fitbit Activities"
          description="Fetching client's Fitbit data..."
          size="lg"
        />
      )}

      {selectedClient &&
        !isLoadingActivities &&
        clientActivities.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-2xl">Fitbit Activities</CardTitle>
              <CardDescription>
                {startDate && endDate
                  ? `Last ${
                      differenceInDays(endDate, startDate) + 1
                    } days of Fitbit activity.`
                  : "Select a date range to view Fitbit activity."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-wrap gap-4">
                {clientActivities.map((activity, index) => {
                  const IconComponent: LucideIcon | undefined = {
                    Dumbbell: Dumbbell,
                    Footprints: Footprints,
                    Bike: Bike,
                    Waves: Waves,
                    Activity: Activity,
                    Calculator: Calculator,
                  }[activity.summary?.iconName as string];

                  const renderDetail = (
                    label: string,
                    value: any,
                    unit: string = ""
                  ) => {
                    if (
                      value === null ||
                      value === undefined ||
                      value === "N/A"
                    ) {
                      return null;
                    }
                    return (
                      <p>
                        {label}: {value} {unit}
                      </p>
                    );
                  };

                  return (
                    <li
                      key={index}
                      className="flex-1 min-w-[200px] border p-3 rounded-md flex flex-col items-center justify-center text-center space-y-1"
                    >
                      {IconComponent && (
                        <IconComponent className="h-8 w-8 mb-2" />
                      )}
                      <p className="font-semibold text-lg">{activity.date}</p>
                      {renderDetail("Times Done", activity.summary?.count)}
                      {activity.summary?.totalDuration !== undefined &&
                        activity.summary.totalDuration > 0 && (
                          <p>
                            Time:{" "}
                            {Math.round(activity.summary.totalDuration / 60000)}{" "}
                            minutes
                          </p>
                        )}
                      {renderDetail("Steps", activity.summary?.steps)}
                      {renderDetail("Calories", activity.summary?.caloriesOut)}
                      {renderDetail(
                        "Distance",
                        activity.summary?.distances?.find(
                          (d: any) => d.activity === "total"
                        )?.distance,
                        "km"
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default TrainerClientsPage;
