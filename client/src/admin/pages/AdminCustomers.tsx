import { useEffect, useState } from 'react';
import { DataGrid, type DataGridColumn } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { adminApi } from '../services/adminApi';
import { userApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import { useToast } from '../../components/ui/Toast';
import type { AdminCustomer } from '../../types';
import { formatPrice } from '../../utils/formatters';

export function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [pendingDeactivate, setPendingDeactivate] = useState<AdminCustomer | null>(null);
  const [pendingReactivate, setPendingReactivate] = useState<AdminCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const { push, promise } = useToast();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const next = await adminApi.listCustomers();
        if (!cancelled) setCustomers(next);
      } catch (err) {
        if (!cancelled) push({ variant: 'error', message: extractErrorMessage(err, 'Failed to load customers') });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [push]);

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
        customer.status === 'active' ? (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); setPendingDeactivate(customer); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-danger hover:bg-danger/10 transition-colors"
          >
            Deactivate
          </button>
        ) : (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); setPendingReactivate(customer); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-delivered hover:bg-delivered/10 transition-colors"
          >
            Reactivate
          </button>
        )
      ),
    },
  ];

  const onConfirmDeactivate = async () => {
    if (!pendingDeactivate) return;
    const target = pendingDeactivate;
    setPendingDeactivate(null);
    await promise(userApi.deactivate(target.id), {
      success: `${target.firstName} ${target.lastName} deactivated`,
      error:   (err) => extractErrorMessage(err, 'Could not deactivate customer'),
    }).then(() => {
      setCustomers((current) => current.map((c) => (c.id === target.id ? { ...c, status: 'inactive' } : c)));
    }).catch(() => undefined);
  };

  const onConfirmReactivate = async () => {
    if (!pendingReactivate) return;
    const target = pendingReactivate;
    setPendingReactivate(null);
    await promise(userApi.activate(target.id), {
      success: `${target.firstName} ${target.lastName} reactivated`,
      error:   (err) => extractErrorMessage(err, 'Could not reactivate customer'),
    }).then(() => {
      setCustomers((current) => current.map((c) => (c.id === target.id ? { ...c, status: 'active' } : c)));
    }).catch(() => undefined);
  };

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
        isOpen={!!pendingDeactivate}
        title="Deactivate customer"
        message={
          pendingDeactivate
            ? `Deactivate ${pendingDeactivate.firstName} ${pendingDeactivate.lastName}? Their ${pendingDeactivate.ordersCount} order${pendingDeactivate.ordersCount !== 1 ? 's' : ''} will remain in the orders log. You can reactivate them at any time.`
            : ''
        }
        confirmLabel="Deactivate"
        destructive
        onCancel={() => setPendingDeactivate(null)}
        onConfirm={onConfirmDeactivate}
      />

      <ConfirmModal
        isOpen={!!pendingReactivate}
        title="Reactivate customer"
        message={
          pendingReactivate
            ? `Reactivate ${pendingReactivate.firstName} ${pendingReactivate.lastName}? They'll be able to sign in and place orders again.`
            : ''
        }
        confirmLabel="Reactivate"
        onCancel={() => setPendingReactivate(null)}
        onConfirm={onConfirmReactivate}
      />
    </>
  );
}
