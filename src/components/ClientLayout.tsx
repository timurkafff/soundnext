"use client";

import { PlayerProvider } from "@/contexts/PlayerContext";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <PlayerProvider>{children}</PlayerProvider>;
}

