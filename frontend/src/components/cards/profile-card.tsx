import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { readProfile } from "@/server-actions/profile/actions";

interface ProfileCardProps {
  auth_id: string;
}

export async function ProfileCard({ auth_id }: ProfileCardProps) {
  if (!auth_id) {
    return (
      <Card className="w-full max-w-sm bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">User Not Found</CardTitle>
          <CardDescription>Unable to retrieve profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const profile = await readProfile(auth_id);
  if (profile.success == false) {
    return (
      <Card className="w-full max-w-sm bg-white shadow-lg hover:shadow-xl">
        <CardHeader className="flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">Profile Not Found</CardTitle>
          <CardDescription>No profile data available.</CardDescription>
          {profile && "message" in profile && (
            <p className="text-red-500 text-sm mt-2">
              Error: {profile.message}
            </p>
          )}
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full  bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-col items-center">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage
            src={profile.data.avatar_url ?? undefined}
            alt={profile.data.full_name || "User Avatar"} // Good practice to have a fallback alt text
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl">{profile.data?.full_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5  min-w-0">
            <p className="text-sm font-medium leading-none">Phone:</p>
            <p className="text-sm text-muted-foreground truncate">
              {profile.data?.primary_phone || "No phone number provided"}
            </p>
          </div>
          <div className="flex flex-col space-y-1.5  min-w-0">
            <p className="text-sm font-medium leading-none">Email:</p>
            <p className="text-sm text-muted-foreground truncate">
              {profile.data?.primary_email || "No email provided"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileCard;
