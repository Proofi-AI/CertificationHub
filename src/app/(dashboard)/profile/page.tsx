import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default async function ProfilePreviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (!session.user.username) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-16">
        <h1 className="text-xl font-bold text-gray-900">Set up your public profile</h1>
        <p className="text-gray-500">
          Set a username in settings to get your public profile URL.
        </p>
        <Button asChild>
          <Link href="/settings/profile">Go to Settings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center space-y-4 py-16">
      <h1 className="text-xl font-bold text-gray-900">Your Public Profile</h1>
      <p className="text-gray-500">
        Your public profile is available at:
      </p>
      <code className="block rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-800">
        {process.env.NEXT_PUBLIC_APP_URL}/u/{session.user.username}
      </code>
      <Button asChild>
        <Link href={`/u/${session.user.username}`} target="_blank">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Public Profile
        </Link>
      </Button>
    </div>
  );
}
