// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { redirect } from 'next/navigation';

export default function AdminLogsRedirect({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/admin/testing`);
}
