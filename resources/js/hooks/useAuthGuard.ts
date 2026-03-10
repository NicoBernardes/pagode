import { usePage } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import { SharedProps } from "@/types/global";
import { toast } from "sonner";

const AUTH_STORAGE_KEY = "auth_user_id";

/**
 * Detects when the authenticated user changes across browser tabs in real-time.
 *
 * How it works:
 * - Each tab writes its current user ID to localStorage on login/navigation.
 * - The `storage` event fires in OTHER tabs when localStorage changes.
 * - When a tab detects a different user logged in or a logout, it redirects
 *   to the appropriate page (login if logged out, home if user switched).
 */
export function useAuthGuard() {
  const { auth } = usePage<SharedProps>().props;
  const currentUserId = auth?.user?.id ?? null;
  const initialUserIdRef = useRef<number | null>(currentUserId);

  // Write current user ID to localStorage so other tabs can detect changes
  useEffect(() => {
    const value = currentUserId !== null ? String(currentUserId) : "";
    localStorage.setItem(AUTH_STORAGE_KEY, value);
  }, [currentUserId]);

  // Listen for login/logout events from other tabs
  useEffect(() => {
    function onStorageChange(e: StorageEvent) {
      if (e.key !== AUTH_STORAGE_KEY) return;

      const newId = e.newValue ? Number(e.newValue) : null;
      const myId = initialUserIdRef.current;

      if (newId === myId) return;

      if (!newId) {
        // Another tab logged out — redirect to login page
        toast.warning("You have been logged out from another tab.");
        setTimeout(() => (window.location.href = "/user/login"), 1000);
      } else {
        // Another tab logged in as a different user — redirect to home
        toast.warning("Another account signed in. Redirecting...");
        setTimeout(() => (window.location.href = "/"), 1000);
      }
    }

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  // Also detect user changes from Inertia responses (same-tab safety net)
  useEffect(() => {
    if (initialUserIdRef.current !== currentUserId) {
      initialUserIdRef.current = currentUserId;
      window.location.href = currentUserId ? "/" : "/user/login";
    }
  }, [currentUserId]);
}
