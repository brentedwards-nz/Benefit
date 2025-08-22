import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrainerClientsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="bg-muted/50 flex-1 rounded-xl md:min-h-min p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Trainer Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mt-2 text-muted-foreground">
              Manage your clients here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
