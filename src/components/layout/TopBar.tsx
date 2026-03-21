"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { data: session } = useSession();
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "U";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
      <span className="md:hidden text-lg font-bold text-blue-600">CertHub</span>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <Button size="sm" asChild>
          <Link href="/certificates/new">
            <Plus className="h-4 w-4 mr-1" />
            Add Certificate
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={session?.user?.image ?? ""} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/settings/profile" className="w-full">Settings</Link>
            </DropdownMenuItem>
            {session?.user?.username && (
              <DropdownMenuItem>
                <Link href={`/u/${session.user.username}`} target="_blank" className="w-full">
                  Public Profile
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
