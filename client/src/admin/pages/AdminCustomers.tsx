import { useEffect, useState } from 'react';
import { DataGrid, type DataGridColumn } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { adminApi } from '../services/adminApi';
import { userApi } from '../../services/api';
import type { AdminCustomer } from '../../types';
import { formatPrice } from '../../utils/formatters';

export function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [pendingDelete, setPendingDelete] = useState<AdminCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const next = await adminApi.listCustomers();
        if (!cancelled) setCustomers(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  const columns: DataGridColumn<AdminCustomer>[] = [
    {
      key: 'name',
      label: 'Customer',
      render: (customer) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
            {customer.firstName[0]}{customer.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-primary truncate">{customer.firstName} {customer.lastName}</p>
            <p className="text-xs text-muted truncate">{customer.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'country',
      label: 'Country',
      render: (customer) => <span className="text-secondary text-sm">{customer.country ?? '-'}</span>,
    },
    {
      key: 'orders',
      label: 'Orders',
      align: 'center',
      render: (customer) => <span className="text-primary font-bold tabular-nums">{customer.ordersCount}</span>,
    },
    {
      key: 'spent',
      label: 'Lifetime Value',
      align: 'right',
      render: (customer) => <span className="text-primary font-bold tabular-nums">{formatPrice(customer.totalSpent)}</span>,
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (customer) => (
        <span className="text-xs text-muted">
          {new Date(customer.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (customer) => <StatusBadge status={customer.status} />,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (customer) => (
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); setPendingDelete(customer); }}
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
      {loading ? (
        <div className="bg-surface border border-stroke rounded-2xl px-4 py-10 text-center text-muted text-sm">
          Loading customers...
        </div>
      ) : (
      <DataGrid<AdminCustomer>
        rows={customers}
        columns={columns}
        rowKey={(customer) => customer.id}
        searchableText={(customer) => `${customer.firstName} ${customer.lastName} ${customer.email} ${customer.country ?? ''}`}
        searchPlaceholder="Search by name, email, or country..."
        emptyMessage="No customers yet."
      />
      )}

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete customer"
        message={
          pendingDelete
            ? `Deactivate ${pendingDelete.firstName} ${pendingDelete.lastName}? Their ${pendingDelete.ordersCount} order${pendingDelete.ordersCount !== 1 ? 's' : ''} will remain in the orders log.`
            : ''
        }
        confirmLabel="Deactivate"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) {
            await userApi.deactivate(pendingDelete.id);
            setCustomers((current) => current.map((customer) => (
              customer.id === pendingDelete.id
                ? { ...customer, status: 'inactive' }
                : customer
            )));
          }
          setPendingDelete(null);
        }}
      />
    </>
  );
}
