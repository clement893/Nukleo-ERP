/**
 * Employee Portal [id] Layout
 * 
 * Layout wrapper for all routes under /portail-employe/[id]/*
 * This layout is required for Next.js to properly route nested dynamic segments.
 */

'use client';

// This layout simply passes children through
// The actual layout logic is in the parent portail-employe/layout.tsx
export default function EmployeePortalIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
