import { AccountForm } from "@/features/account/components/account-form";
import { useAuth } from "@/features/auth/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Account</h1>
        <p className="text-sm text-muted-foreground">Manage your personal profile information.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name and email are visible to your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm
            defaultValues={{
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
