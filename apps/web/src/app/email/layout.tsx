// Force dynamic rendering for all email pages
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function EmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

