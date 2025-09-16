"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MinusIcon, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DailyHabit,
  upsertClientHabit,
} from "@/server-actions/client/habits/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface HabitDailyCardProps {
  habit: DailyHabit;
  onHabitUpdated: () => void;
}

export const HabitDailyCard = ({
  habit,
  onHabitUpdated,
}: HabitDailyCardProps) => {
  const [isPending, startTransition] = useTransition();

  const [timesDone, setTimesDone] = useState(habit.timesDone);
  const [habitFrequency, setHabitFrequency] = useState(
    habit.habitFrequency || 1
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(habit.completed);

  const [clientHabitId, setClientHabitId] = useState(
    habit.clientHabitId ?? null
  );

  // const habitFrequency = habit.habitFrequency ?? 1;
  // const isCompleted = timesDone >= habitFrequency;

  // console.log("*** Rendering HabitDailyCard for:");
  // console.log(JSON.stringify(habit,null,2));

  const handleUpdate = (newTimesDone: number) => {
    const oldTimesDone = timesDone;
    setTimesDone(newTimesDone); // Optimistic update

    startTransition(async () => {
      const result = await upsertClientHabit({
        programmeHabitId: habit.programmeHabitId,
        habitDate: habit.habitDate,
        timesDone: newTimesDone,
        completed: newTimesDone >= habitFrequency,
      });

      if (result.success) {
        toast.success(`'${habit.title}' updated.`);
        if (result.data.id !== clientHabitId) {
          setClientHabitId(result.data.id);
        }
        setIsCompleted(result.data.completed);
        onHabitUpdated();
      } else {
        toast.error(`Failed to update '${habit.title}'.`);
        setTimesDone(oldTimesDone); // Revert on failure
      }
    });
  };

  const handleIncrement = () => {
    if (timesDone < habitFrequency) {
      handleUpdate(timesDone + 1);
    }
  };

  const handleDecrement = () => {
    if (timesDone > 0) {
      handleUpdate(timesDone - 1);
    }
  };

  const progress = (timesDone / habitFrequency) * 100;

  return (
    <Card
      className={cn(
        "w-full transition-colors p-3 gap-1.5",
        isCompleted ? "bg-green-500" : "bg-red-500"
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg text-center">{habit.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={isPending || timesDone === 0}
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="text-lg font-bold">
              {timesDone} of {habitFrequency}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={isPending || timesDone >= habitFrequency}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        {habitFrequency > 1 && <Progress value={progress} className="w-full" />}

        {/* <div>
          <p>Is Completed {isCompleted ? "true" : "false"}</p>
          <pre>{JSON.stringify(habit, null, 2)}</pre>
        </div> */}
      </CardContent>
    </Card>
  );
};
