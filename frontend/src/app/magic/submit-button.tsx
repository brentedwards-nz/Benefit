"use client";

import { useFormStatus } from "react-dom";
import { type ComponentProps } from "react";
import { IconMail } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = ComponentProps<"button"> & {
  pendingText?: string;
};

export function SubmitButton({ children, pendingText, ...props }: Props) {
  const { pending, action } = useFormStatus();

  return (
    <Button type="submit" className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <IconMail />
      )}
      Login With Email
    </Button>
  );
}
