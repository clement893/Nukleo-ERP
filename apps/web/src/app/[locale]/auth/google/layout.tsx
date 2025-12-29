// Force dynamic rendering for all google auth pages
export const dynamic = 'force-dynamic';

export default function GoogleAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
