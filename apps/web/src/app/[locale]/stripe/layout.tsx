// Force dynamic rendering for all stripe pages
export const dynamic = 'force-dynamic';

export default function StripeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
