"use client";

import { useEffect } from "react";

export function ProfileRefresh() {
  useEffect(() => {
    window.dispatchEvent(new Event("founder-hub-profile-changed"));
  }, []);

  return null;
}
