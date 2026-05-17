import { useState } from 'react';
import { DataGrid, type DataGridColumn } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAdminCollection } from '../hooks/useAdminCollection';
import customersSeed from '../../data/admin/customers.json';
import type { AdminCustomer } from '../../types';
import { formatPrice } from '../../utils/formatters';

const customersSeedTyped = customersSeed as AdminCustomer[];

export function AdminCustomers() {
  const { items: customers, remove } = useAdminCollection<AdminCustomer>('customers', customersSeedTyped);
  const [pendingDelete, setPendingDelete] = useState<AdminCustomer | null>(null);

  const columns: DataGridColumn<AdminCustomer>[] = [
    {
      key: 'name',
      label: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
            {c.firstName[0]}{c.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-primary truncate">{c.firstName} {c.lastName}</p>
            <p className="text-xs text-muted truncate">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'country',
      label: 'Country',
      render: (c) => <span className="text-secondary text-sm">{c.country ?? '—'}</span>,
    },
    {
      key: 'orders',
      label: 'Orders',
      align: 'center',
      render: (c) => <span className="text-primary font-bold tabular-nums">{c.ordersCount}</span>,
    },
    {
      key: 'spent',
      label: 'Lifetime Value',
      align: 'right',
      render: (c) => <span className="text-primary font-bold tabular-nums">{formatPrice(c.totalSpent)}</span>,
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (c) => (
        <span className="text-xs text-muted">
          {new Date(c.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (c) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setPendingDelete(c); }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-danger hover:bg-danger/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
          </svg>
          Delete
        </button>
      ),
    },
  ];

  return (
    <>
      <DataGrid<AdminCustomer>
        rows={customers}
        columns={columns}
        rowKey={(c) => c.id}
        searchableText={(c) => `${c.firstName} ${c.lastName} ${c.email} ${c.country ?? ''}`}
        searchPlaceholder="Search by name, email, or country…"
        emptyMessage="No customers yet."
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete customer"
        message={
          pendingDelete
            ? `Permanently delete ${pendingDelete.firstName} ${pendingDelete.lastName}? Their ${pendingDelete.ordersCount} order${pendingDelete.ordersCount !== 1 ? 's' : ''} will remain in the orders log but the customer record will be gone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
