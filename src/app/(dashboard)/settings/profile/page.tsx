"use client";

import { useSession } from "next-auth/react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile } from "@/actions/user.actions";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (!result.success) {
        toast.error(result.error);
      } else {
        await update();
        toast.success("Profile updated!");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your public profile and account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>This information may appear on your public profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" defaultValue={session?.user?.name ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">/u/</span>
                <Input
                  id="username"
                  name="username"
                  placeholder="your-username"
                  defaultValue={session?.user?.username ?? ""}
                  pattern="[a-z0-9_-]+"
                  title="Lowercase letters, numbers, hyphens and underscores only"
                />
              </div>
              <p className="text-xs text-gray-500">Your public profile URL will be /u/your-username</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                name="bio"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
                placeholder="Tell people about yourself"
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                name="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="isPublicProfile" name="isPublicProfile" value="true" />
              <Label htmlFor="isPublicProfile">Make my profile public</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="notificationsEnabled" name="notificationsEnabled" value="true" defaultChecked />
              <Label htmlFor="notificationsEnabled">Enable expiry email notifications</Label>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
