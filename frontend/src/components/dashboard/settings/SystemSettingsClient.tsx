"use client";

import {
  createSystemSetting,
  updateSystemSetting,
  deleteSystemSetting,
} from "@/server-actions/settings/actions";
import { ConfigurationList } from "@/components/dashboard/settings/ConfigurationList";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  SystemSettingForm,
  SystemSettingFormValues,
} from "@/components/dashboard/settings/system-setting-form";
import { SystemSetting } from "@/server-actions/settings/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SystemSettingsClientProps {
  initialSettings: SystemSetting[];
}

export function SystemSettingsClient({
  initialSettings,
}: SystemSettingsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<
    SystemSetting | undefined
  >(undefined);
  const [settings, setSettings] = useState<SystemSetting[]>(initialSettings);
  const router = useRouter();

  // Update settings state when initialSettings prop changes (after router.refresh() on parent server component)
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleAdd = () => {
    setEditingSetting(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (values: SystemSettingFormValues) => {
    let result;
    if (editingSetting) {
      // Update existing setting
      result = await updateSystemSetting(editingSetting.id!, values);
    } else {
      // Create new setting
      result = await createSystemSetting(values);
    }

    if (result.success) {
      toast.success(
        `Setting ${editingSetting ? "updated" : "created"} successfully.`
      );
      setIsModalOpen(false);
      // Revalidate path to show updated list
      router.refresh(); // This will re-fetch data on the server and re-render
    } else {
      toast.error(
        `Failed to ${editingSetting ? "update" : "create"} setting: ${
          result.message
        }`
      );
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingSetting(undefined);
  };

  const handleDelete = async (setting: SystemSetting) => {
    if (!setting.id) return;
    const result = await deleteSystemSetting(setting.id);
    if (result.success) {
      toast.success(`Setting "${setting.key}" deleted successfully.`);
      router.refresh();
    } else {
      toast.error(`Failed to delete setting: ${result.message}`);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">
          System Configuration
        </h1>
        <Button className="ml-auto" size="sm" onClick={handleAdd}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      <ConfigurationList
        settings={settings}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingSetting ? "Edit" : "Create"} System Setting
            </DialogTitle>
            <DialogDescription>
              {editingSetting
                ? "Edit the details of the system setting."
                : "Create a new system setting."}
            </DialogDescription>
          </DialogHeader>
          <SystemSettingForm
            setting={editingSetting}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
