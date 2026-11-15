"use client";

import { ProfilePicture } from "@/components/tools/ProfilePicture";

/** Lazy entry point for profile-picture — keeps the other tools out of this chunk. */
export default function profilepicture() {
  return <ProfilePicture />;
}
