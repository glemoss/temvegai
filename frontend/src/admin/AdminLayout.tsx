import { Outlet, useOutletContext } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import type { Admin } from '../api/auth';
import { AdminHeader } from './AdminHeader';
import { AdminMenu } from './AdminMenu';
import {
  useAdminSuggestions,
  type AdminSuggestionsState,
} from './useAdminSuggestions';

interface AdminLayoutContext {
  suggestions: AdminSuggestionsState;
  reloadSuggestions: () => void;
}

// Every page of the panel: the header with the menu of modules on top, the
// open module below and the notices at the bottom. The suggestions are
// loaded here, so the count on the menu follows what the suggestions module
// does with them.
export function AdminLayout({ admin }: { admin: Admin }) {
  const [suggestions, reloadSuggestions] = useAdminSuggestions();

  return (
    <main className="min-h-full bg-secondary px-4 py-6">
      <AdminHeader admin={admin}>
        <AdminMenu suggestions={suggestions} />
      </AdminHeader>
      <div className="mx-auto mt-6 max-w-240">
        <Outlet context={{ suggestions, reloadSuggestions }} />
      </div>
      <Toaster closeButton />
    </main>
  );
}

// For the modules opened below the header.
export function useAdminLayout(): AdminLayoutContext {
  return useOutletContext<AdminLayoutContext>();
}
