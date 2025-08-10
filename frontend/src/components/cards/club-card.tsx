import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { readClient } from "@/server-actions/client/actions";

export interface ClubCardProps {
  club_id: string;
  club_name: string;
  club_address: string | null;
  club_phone: string | null;
  current: boolean;
  disabled: boolean;
  created_at: Date | null;
  club_avatar: string;
}

export async function ClubCard({
  club_id,
  club_name,
  club_address,
  club_phone,
  current,
  disabled,
  created_at,
  club_avatar,
}: ClubCardProps) {
  return (
    <Card className="w-full  bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-col items-center">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage
            src={club_avatar ?? undefined}
            alt={club_name || "User Avatar"} // Good practice to have a fallback alt text
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl">{club_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5  min-w-0">
            <p className="text-sm font-medium leading-none">Club Id:</p>
            <p className="text-sm text-muted-foreground truncate">
              {club_id || "No address provided"}
            </p>
          </div>
          <div className="flex flex-col space-y-1.5  min-w-0">
            <p className="text-sm font-medium leading-none">Address:</p>
            <p className="text-sm text-muted-foreground truncate">
              {club_address || "No address provided"}
            </p>
          </div>
          <div className="flex flex-col space-y-1.5  min-w-0">
            <p className="text-sm font-medium leading-none">Email:</p>
            <p className="text-sm text-muted-foreground truncate">
              {club_phone || "No phone provided"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ClubCard;
