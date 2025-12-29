// Force dynamic rendering for all google auth pages
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function GoogleAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
