// Force dynamic rendering for all sentry pages
export const dynamic = 'force-dynamic';

export default function SentryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
