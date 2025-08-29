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
import {
  format,
  differenceInDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
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
import { readEmail } from "@/server-actions/email/actions";
import { Email } from "@/server-actions/email/types";
import {
  WeekView,
  WeekViewProps,
  DayData,
  ProgrammeHabit,
  ClientHabits,
} from "@/components/habits/week-view";

interface Client extends ClientForTrainer {}

const TrainerClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [clientActivities, setClientActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [clientEmails, setClientEmails] = useState<Email[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isLoadingClientHabits, setIsLoadingClientHabits] = useState(false);
  const [weekViewProps, setWeekViewProps] = useState<WeekViewProps>({
    selectedWeek: {
      days: [],
    },
    selectedDate: new Date(),
    programmeHabits: [],
    habitCompletions: [],
    isSelf: false,
    onHabitToggle: (
      programmeHabitId: string,
      date: Date,
      completed: boolean
    ) => {},
  });
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    return endOfDay(endOfWeek(new Date(), { weekStartsOn: 1 }));
  });

  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    return startOfDay(startOfWeek(new Date(), { weekStartsOn: 1 }));
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

  useEffect(() => {
    if (selectedClient?.id) {
      setIsLoadingEmails(true);
      startTransition(async () => {
        try {
          const emailsResult = await readEmail(
            selectedClient.email,
            startDate,
            endDate,
            [],
            ["Benefit"]
          );
          if (emailsResult.success) {
            setClientEmails(emailsResult.data || []);
          } else {
            toast.error("Failed to load emails", {
              description:
                emailsResult.message || "Could not retrieve client emails.",
            });
          }
        } catch (error) {
          console.error("Failed to fetch client emails:", error);
          toast.error("Failed to load emails", {
            description: "Could not retrieve client emails.",
          });
        } finally {
          setIsLoadingEmails(false);
        }
      });
    } else {
      setClientEmails([]);
      setIsLoadingEmails(false);
    }
  }, [selectedClient, startDate, endDate, startTransition]);

  useEffect(() => {
    const clientId = selectedClient?.id || null;

    const calculateCompletionRate = (
      dayDate: Date,
      allProgrammeHabits: ProgrammeHabit[],
      allHabitCompletions: ClientHabits[]
    ): number => {
      const dateString = dayDate.toISOString().split("T")[0];
      const dayCompletions = allHabitCompletions.filter(
        (c) => c.completionDate.split("T")[0] === dateString
      );

      const isHabitActiveOnDate = (ph: ProgrammeHabit): boolean => {
        const s = ph.programme?.startDate
          ? new Date(
              new Date(ph.programme.startDate).toISOString().split("T")[0]
            )
          : null;
        const e = ph.programme?.endDate
          ? new Date(new Date(ph.programme.endDate).toISOString().split("T")[0])
          : null;
        if (!s || !e) return true;
        const d = new Date(dateString);
        return d >= s && d <= e;
      };

      const activeHabits = allProgrammeHabits.filter(isHabitActiveOnDate);
      const completedCount = activeHabits.filter((ph) => {
        const requiredPerDay = Math.max(1, ph.frequencyPerDay ?? 1);
        const rec = dayCompletions.find((c) => c.programmeHabitId === ph.id);
        const times = rec?.timesDone ?? (rec?.completed ? requiredPerDay : 0);
        return times >= requiredPerDay;
      }).length;

      return activeHabits.length > 0 ? completedCount / activeHabits.length : 0;
    };

    const fetchData = async () => {
      try {
        setIsLoadingClientHabits(true);

        if (!clientId) {
          return;
        }

        const habitsResponse = await fetch(
          `/api/client/habits?clientId=${clientId}`
        );
        if (!habitsResponse.ok) {
          return;
        }
        const programmeHabitsData = await habitsResponse.json();

        // Create new Date objects to avoid mutating state
        const startForApi = startDate ? new Date(startDate) : new Date();
        const endForApi = endDate ? new Date(endDate) : new Date();

        const completionsResponse = await fetch(
          `/api/client/habits/completions?startDate=${
            startForApi.toISOString().split("T")[0]
          }&endDate=${
            endForApi.toISOString().split("T")[0]
          }&clientId=${clientId}`
        );
        if (!completionsResponse.ok) {
          return;
        }
        const completionsData = await completionsResponse.json();

        const days: DayData[] = [];
        const currentDate = new Date(startForApi || new Date()); // Use startDate directly for display logic
        const loopEndDate = endForApi || new Date(); // Use endDate directly for display logic

        while (currentDate <= loopEndDate) {
          const completionRate = calculateCompletionRate(
            currentDate,
            programmeHabitsData,
            completionsData
          );
          days.push({
            date: new Date(currentDate),
            dayNumber: currentDate.getDate(),
            isCurrentMonth: true,
            completionRate: completionRate,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const viewProps: WeekViewProps = {
          selectedWeek: {
            days: days,
          },
          selectedDate: new Date(startDate || new Date()), // Use startDate directly
          programmeHabits: programmeHabitsData,
          habitCompletions: completionsData,
          isSelf: false,
          onHabitToggle: () => {},
        };
        setWeekViewProps(viewProps);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingClientHabits(false);
      }
    };

    fetchData();
  }, [endDate, startDate, selectedClient]);

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
                    onSelect={(newDate) => {
                      if (newDate) {
                        const normalizedDate = startOfDay(newDate);

                        setStartDate(normalizedDate);
                        if (
                          endDate &&
                          Math.abs(differenceInDays(endDate, normalizedDate)) > 6 || normalizedDate > endDate
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
                    onSelect={(newDate) => {
                      if (newDate) {
                        // Normalize newDate to the end of the day to avoid timezone issues
                        const normalizedDate = endOfDay(newDate); // Use endOfDay
                        setEndDate(normalizedDate);
                        if (
                          startDate &&
                          Math.abs(differenceInDays(normalizedDate, startDate)) > 6 || normalizedDate < startDate
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
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Client Habits Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingClientHabits ? (
              <Loading
                title="Loading Client Habits"
                description="Fetching client's habit data..."
                size="sm"
              />
            ) : weekViewProps.selectedWeek.days.length > 0 ? (
              <WeekView
                selectedWeek={weekViewProps.selectedWeek}
                selectedDate={weekViewProps.selectedDate}
                programmeHabits={weekViewProps.programmeHabits}
                habitCompletions={weekViewProps.habitCompletions}
                isSelf={weekViewProps.isSelf}
                onHabitToggle={() => {}}
              />
            ) : (
              <p>No habit data found for this client.</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedClient && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Fitbit Activities</CardTitle>
            {clientActivities.length > 0 && startDate && endDate && (
              <CardDescription>
                {`${differenceInDays(endDate, startDate) + 1} day${
                  differenceInDays(endDate, startDate) + 1 === 1 ? "" : "s"
                } of Fitbit activity.`}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <Loading
                title="Loading Fitbit Activities"
                description="Fetching client's Fitbit data..."
                size="sm"
              />
            ) : clientActivities.length > 0 ? (
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
            ) : (
              <p>
                No Fitbit activities found for this client or Fitbit is not
                connected.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedClient && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Client Emails Summary</CardTitle>
            {!isLoadingEmails && clientEmails.length === 0 && (
              <CardDescription>
                Summary of client's emails will be displayed here.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingEmails ? (
              <Loading
                title="Loading Client Emails"
                description="Fetching client's email data..."
                size="sm"
              />
            ) : clientEmails.length > 0 ? (
              <ul className="space-y-4">
                {clientEmails.map((email, index) => (
                  <li key={index} className="border p-3 rounded-md">
                    <p className="font-semibold">Subject: {email.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      Received: {email.receivedAt}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {email.body}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No emails found for this client.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainerClientsPage;
