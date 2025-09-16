// app/habits/page.tsx (or a similar path)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readClientHabitsByDateRange } from "@/server-actions/client/habits/actions";
import HabitClientWrapper from "./HabitClientWrapper";

export default async function ServerHabitsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return <div>Please log in.</div>;
  }

  const clientHabits = await readClientHabitsByDateRange(
    session.user.id,
    new Date("2025-09-01T00:00:00Z").toISOString().split("T")[0],
    new Date("2025-09-07T23:59:59Z").toISOString().split("T")[0]
  );

  const daysData = clientHabits.success ? clientHabits.data.HabitDayData : [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-4">Experimental Habits Page</h1>
      </div>
      <div className="w-full">
        <HabitClientWrapper daysData={daysData} />
      </div>
      <div className="text-sm mt-2 text-white">
        <p>
          This page displays the raw JSON data from the habits server action.
        </p>
        <pre className="mt-4 p-4 bg-transparent rounded-md text-white">
          {JSON.stringify(clientHabits, null, 2)}
        </pre>
      </div>
    </div>
  );
}
