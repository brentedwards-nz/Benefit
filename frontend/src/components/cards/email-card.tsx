import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface EmailCard {
  from: {
    name: string;
    email: string;
  };
  subject: string;
  body: string;
}

export interface EmailCardProps {
  email: EmailCard;
}

export async function EmailCard({ email }: EmailCardProps) {
  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-col items-center">
        <CardTitle className="text-2xl">{email.from.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5  min-w-0">
            <p className="text-sm font-medium leading-none">Email:</p>
            <p className="text-sm text-muted-foreground truncate">
              {email.from.email}
            </p>
          </div>
          <div className="flex flex-col space-y-1.5  min-w-0">
            <p className="text-sm font-medium leading-none">Subject:</p>
            <p className="text-sm text-muted-foreground truncate">
              {email.subject}
            </p>
          </div>
          <div className="flex flex-col space-y-1.5  min-w-0">
            <p className="text-sm font-medium leading-none">Body:</p>
            <p className="text-sm text-muted-foreground">{email.body}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EmailCard;
