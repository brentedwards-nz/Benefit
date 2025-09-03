import { getSystemSettings } from "@/server-actions/settings/actions";
import { SystemSettingsClient } from "@/components/dashboard/settings/SystemSettingsClient";

export default async function SystemSettingsPage() {
  const result = await getSystemSettings();

  if (!result.success) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="text-red-500 bg-red-100 border border-red-400 rounded p-4" role="alert">
          <p className="font-bold">Error loading settings</p>
          <p>{result.message}</p>
        </div>
      </main>
    );
  }

  return <SystemSettingsClient initialSettings={result.data} />;
}
