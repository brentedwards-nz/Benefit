import { readClientHabitsByDateRange } from "@/server-actions/client/habits/actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ExperimentalHabitsPage = async () => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || "no-user-id";

  const habitsData = await readClientHabitsByDateRange(
    userId,
    new Date("2025-08-25T00:00:00"),
    new Date("2025-08-28T23:59:59")
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min border">
        <h1 className="text-2xl font-bold mb-4">Experimental Habits Page</h1>
        <p>
          This page displays the raw JSON data from the habits server action.
        </p>
        <pre className="mt-4 p-4 bg-transparent rounded-md">
          {JSON.stringify(habitsData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ExperimentalHabitsPage;
