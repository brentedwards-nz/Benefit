"use client";

import { useQuery, QueryFunctionContext } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { getClientActivities } from "@/server-actions/fitbit/actions";
import {
  Dumbbell,
  Footprints,
  Bike,
  Waves,
  Activity,
  Calculator,
  LucideIcon,
} from "lucide-react";
import { differenceInDays, startOfDay, endOfDay } from "date-fns";

interface FitbitActivitiesProps {
  clientId: string;
  startDate: Date;
  endDate: Date;
}

const fetchClientActivities = async (context: QueryFunctionContext) => {
  const [_key, clientId, startDate, endDate] = context.queryKey;

  if (!clientId || !(startDate instanceof Date) || !(endDate instanceof Date)) {
    return [];
  }

  const activities = await getClientActivities(
    clientId as string,
    startOfDay(startDate),
    endOfDay(endDate)
  );
  return activities;
};

export const FitbitActivities = ({
  clientId,
  startDate,
  endDate,
}: FitbitActivitiesProps) => {
  const {
    data: clientActivities = [],
    isLoading: isLoadingActivities,
    error: clientActivitiesError,
  } = useQuery({
    queryKey: ["clientActivities", clientId, startDate, endDate],
    queryFn: fetchClientActivities,
    enabled: !!clientId,
  });

  if (clientActivitiesError) {
    console.error(
      "Failed to fetch client activities:",
      clientActivitiesError
    );
    toast.error("Failed to load activities", {
      description: "Could not retrieve client Fitbit activities.",
    });
  }

  return (
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
                  {IconComponent && <IconComponent className="h-8 w-8 mb-2" />}
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
  );
};