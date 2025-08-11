import { Suspense } from "react";
import ProfileContent from "./profile-content";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}