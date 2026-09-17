import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrganizationDialog } from "@/features/organizations/components/create-organization-dialog";

/** Spec 2.1: shown when the user has no active organization membership. */
export function NoOrganizationState() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <CardTitle>No organization yet</CardTitle>
        <CardDescription>
          Create an organization to get started, or ask your President to add you by email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" /> Create organization
        </Button>
        <CreateOrganizationDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </CardContent>
    </Card>
  );
}
