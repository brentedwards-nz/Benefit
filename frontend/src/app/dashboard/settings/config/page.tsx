import { getSystemSettings } from "@/server-actions/settings/actions";
import { ConfigurationList } from "@/components/dashboard/settings/ConfigurationList";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default async function SystemSettingsPage() {
  const result = await getSystemSettings();

  // TODO: Add a modal or form for creating a new setting
  const handleAdd = () => {
    console.log("Add new setting clicked");
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">System Configuration</h1>
        <Button className="ml-auto" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>
      
      {result.success ? (
        <ConfigurationList settings={result.data} />
      ) : (
        <div className="text-red-500 bg-red-100 border border-red-400 rounded p-4" role="alert">
          <p className="font-bold">Error loading settings</p>
          <p>{result.message}</p>
        </div>
      )}
    </main>
  );
}
