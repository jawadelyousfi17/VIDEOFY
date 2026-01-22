import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl w-full px-4 py-1">{children}</div>;
}
