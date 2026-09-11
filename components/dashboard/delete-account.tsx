"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { DeleteAccountModal } from "@/components/modals/delete-account-modal";
import { Icons } from "@/components/shared/icons";

export function DeleteAccountSection() {
  const { user } = useAuthStore();
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isPendingDeletion, setIsPendingDeletion] = useState(false);

  const hasActiveSubscription = user?.subscription_status === "active";

  return (
    <>
      <DeleteAccountModal
        showDeleteAccountModal={showDeleteAccountModal}
        setShowDeleteAccountModal={setShowDeleteAccountModal}
        isPendingDeletion={isPendingDeletion}
        onSuccess={() => setIsPendingDeletion((prev) => !prev)}
      />
      <div className="flex flex-col gap-4 rounded-xl border border-red-400 p-4 dark:border-red-900">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium">Are you sure?</span>

            {hasActiveSubscription ? (
              <div className="flex items-center gap-1 rounded-md bg-red-600/10 p-1 pr-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-500">
                <div className="m-0.5 rounded-full bg-red-600 p-[3px]">
                  <Icons.close size={10} className="text-background" />
                </div>
                Active Subscription
              </div>
            ) : null}
          </div>
          <div className="text-balance text-sm text-muted-foreground">
            {isPendingDeletion
              ? "A deletion request is pending. Your account will be removed in 7 days."
              : `Permanently delete your ${siteConfig.name} account${hasActiveSubscription ? " and your subscription" : ""}. This action cannot be undone - please proceed with caution.`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPendingDeletion ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteAccountModal(true)}
            >
              <Icons.trash className="mr-2 size-4" />
              <span>Delete Account</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteAccountModal(true)}
            >
              <Icons.close className="mr-2 size-4" />
              <span>Cancel Delete Request</span>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
