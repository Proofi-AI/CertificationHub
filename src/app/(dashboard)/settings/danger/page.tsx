"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/actions/user.actions";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";

export default function DangerZonePage() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    window.location.href = "/api/user/export";
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (!result.success) {
        toast.error(result.error);
        setDeleteOpen(false);
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Export your data or delete your account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
          <CardDescription>
            Download all your certificate data as a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Download My Data
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Delete Account</CardTitle>
          <CardDescription>
            Permanently delete your account and all your data. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="gap-2" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  This will permanently delete your account, all your certificates, and uploaded
                  files. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? "Deleting..." : "Yes, delete my account"}
                </Button>
              </DialogFooter>
            </DialogContent>
            </>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
