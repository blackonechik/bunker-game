import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminPanelClient from './AdminPanelClient';

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect('/?auth=required');
  }

  const role = (session.user as { role?: string }).role;
  if (role !== 'admin') {
    redirect('/');
  }

  return <AdminPanelClient />;
}