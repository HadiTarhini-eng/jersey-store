import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { DataGrid, type DataGridColumn } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { Modal } from '../../components/ui/Modal';
import { MultiImageUpload, type GalleryEntry } from '../components/ImageUpload';
import { useToast } from '../../components/ui/Toast';
import { useAppSelector } from '../../app/hooks';
import { extractErrorMessage } from '../../services/api/client';
import { useAdminProducts } from '../hooks/useAdminProducts';
import type { AdminProductRow, UpsertProductInput } from '../services/adminProductsApi';
import type { AdminProduct, Category } from '../../types';
import { formatPrice } from '../../utils/formatters';

const totalStock = (p: AdminProduct) => p.variants.reduce((s, v) => s + v.stock, 0);

// ─────────────────────────────────────────────────────────────────────────────
// Products list
// ─────────────────────────────────────────────────────────────────────────────

export function AdminProducts() {
  const { items: products, loading, remove, setStock } = useAdminProducts();

  const [pendingDelete, setPendingDelete] = useState<AdminProductRow | null>(null);
  const [stockEditing,  setStockEditing]  = useState<AdminProductRow | null>(null);
  const navigate = useNavigate();
  const { promise } = useToast();

  const columns: DataGridColumn<AdminProductRow>[] = [
    {
      key: 'product',
      label: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-surface-raised overflow-hidden shrink-0">
            {p.images[0] && (
              <img src={p.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-primary truncate">{p.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted mt-0.5">
              {p.sport || '—'} · {p.team ? p.team.replace(/-/g, ' ') : '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (p) => <span className="text-secondary capitalize">{p.category || '—'}</span>,
    },
    {
      key: 'price',
      label: 'Price',
      align: 'right',
      render: (p) => (
        <div className="text-right">
          <p className="font-bold text-primary tabular-nums">{formatPrice(p.price, p.currency)}</p>
          {p.originalPrice && (
            <p className="text-xs text-muted line-through tabular-nums">{formatPrice(p.originalPrice, p.currency)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      align: 'center',
      render: (p) => {
        const total = totalStock(p);
        const low = total > 0 && total < 10;
        return (
          <span className={`font-bold tabular-nums ${total === 0 ? 'text-danger' : low ? 'text-caution' : 'text-primary'}`}>
            {total}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <StatusBadge status={p.inStock ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setStockEditing(p); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-accent hover:bg-accent/10 transition-colors"
          >
            Stock
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/products/${p.id}/edit`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-primary hover:bg-white/10 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPendingDelete(p); }}
            aria-label="Delete product"
            className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  const onSaveStock = async (variants: AdminProduct['variants']) => {
    if (!stockEditing) return;
    const target = stockEditing;
    setStockEditing(null);
    await promise(setStock(target.id, variants), {
      success: 'Stock updated',
      error:   (err) => extractErrorMessage(err, 'Could not update stock'),
    }).catch(() => undefined);
  };

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    await promise(remove(target.id), {
      success: `${target.name} deleted`,
      error:   (err) => extractErrorMessage(err, 'Could not delete product'),
    }).catch(() => undefined);
  };

  return (
    <>
      {loading ? (
        <div className="bg-surface border border-stroke rounded-2xl px-4 py-10 text-center text-muted text-sm">
          Loading products…
        </div>
      ) : (
        <DataGrid<AdminProductRow>
          rows={products}
          columns={columns}
          rowKey={(p) => p.id}
          searchableText={(p) => `${p.name} ${p.sport} ${p.team} ${p.category} ${p.tags.join(' ')}`}
          searchPlaceholder="Search products…"
          toolbar={
            <Link
              to="/admin/products/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-wider border-2 border-accent hover:bg-accent-light transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              Add Product
            </Link>
          }
          emptyMessage="No products yet. Click 'Add Product' to create one."
        />
      )}

      <StockEditorModal product={stockEditing} onClose={() => setStockEditing(null)} onSave={onSaveStock} />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete product"
        message={pendingDelete ? `Permanently delete "${pendingDelete.name}"? This can't be undone.` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stock editor modal
// ─────────────────────────────────────────────────────────────────────────────

interface StockEditorModalProps {
  product: AdminProductRow | null;
  onClose: () => void;
  onSave:  (variants: AdminProduct['variants']) => void;
}

function StockEditorModal({ product, onClose, onSave }: StockEditorModalProps) {
  const [variants, setVariants] = useState<AdminProduct['variants']>([]);

  useEffect(() => {
    if (product) setVariants(product.variants.map((v) => ({ ...v })));
  }, [product]);

  if (!product) return null;

  const setStock = (idx: number, value: number) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, stock: Math.max(0, value) } : v)));
  };

  return (
    <Modal isOpen={!!product} onClose={onClose} title={`Stock — ${product.name}`} maxWidth="max-w-lg">
      <div className="space-y-3">
        {variants.map((v, i) => (
          <div key={`${v.size}-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
            <span className="font-sport text-xl tracking-wide text-gray-900 uppercase w-12 text-center">{v.size}</span>
            <div className="flex-1 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setStock(i, v.stock - 1)}
                disabled={v.stock <= 0}
                className="w-9 h-9 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                −
              </button>
              <input
                type="number"
                min={0}
                value={v.stock}
                onChange={(e) => setStock(i, Number(e.target.value) || 0)}
                className={lightInputClass + ' w-20 text-center'}
              />
              <button
                type="button"
                onClick={() => setStock(i, v.stock + 1)}
                className="w-9 h-9 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(variants)}
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm uppercase tracking-wider border-2 border-accent hover:bg-accent-light shadow-lg shadow-accent/30 transition-colors"
        >
          Save stock
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add / Edit pages — wrap ProductForm with empty defaults / existing record
// ─────────────────────────────────────────────────────────────────────────────

export function AdminAddProduct() {
  const navigate = useNavigate();
  const { items, categories, create } = useAdminProducts();
  const { promise } = useToast();
  const adminUser = useAppSelector((s) => s.auth.user);

  return (
    <div className="space-y-5 max-w-5xl">
      <Link to="/admin/products" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors">
        ← All products
      </Link>
      <ProductForm
        initial={null}
        categories={categories}
        existingSlugs={items.map((p) => p.slug)}
        onCancel={() => navigate('/admin/products')}
        onSubmit={async (input) => {
          if (!adminUser?.id) throw new Error('Admin user missing');
          await promise(create(input, adminUser.id), {
            success: 'Product created',
            error:   (err) => extractErrorMessage(err, 'Could not create product'),
          });
          navigate('/admin/products');
        }}
        submitLabel="Save Product"
      />
    </div>
  );
}

export function AdminEditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { items, categories, loading, update } = useAdminProducts();
  const product = items.find((item) => item.id === id);
  const { promise } = useToast();

  if (loading) {
    return (
      <div className="bg-surface border border-stroke rounded-2xl px-4 py-10 text-center text-muted text-sm">
        Loading product…
      </div>
    );
  }
  if (!product) return <Navigate to="/admin/products" replace />;

  return (
    <div className="space-y-5 max-w-5xl">
      <Link to="/admin/products" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors">
        ← All products
      </Link>
      <ProductForm
        key={product.id}
        initial={product}
        categories={categories}
        existingSlugs={items.filter((p) => p.id !== product.id).map((p) => p.slug)}
        onCancel={() => navigate('/admin/products')}
        onSubmit={async (input) => {
          await promise(update(product.id, input), {
            success: 'Product saved',
            error:   (err) => extractErrorMessage(err, 'Could not save product'),
          });
          navigate('/admin/products');
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared ProductForm
// ─────────────────────────────────────────────────────────────────────────────

const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface FormState {
  name:           string;
  slug:           string;
  sport:          string;
  team:           string;
  categoryId:     string;
  price:          string;
  originalPrice:  string;
  currency:       string;
  description:    string;
  features:       string;
  tags:           string;
  gallery:        GalleryEntry[];
  badge:          string;
  variants:       { size: string; stock: number }[];
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function fromProduct(p: AdminProductRow | null): FormState {
  if (!p) {
    return {
      name: '', slug: '', sport: 'football', team: '', categoryId: '',
      price: '', originalPrice: '', currency: 'USD',
      description: '', features: '', tags: '',
      gallery: [], badge: '',
      variants: defaultSizes.map((size) => ({ size, stock: 0 })),
    };
  }
  return {
    name:          p.name,
    slug:          p.slug,
    sport:         p.sport,
    team:          p.team,
    categoryId:    p.categoryId,
    price:         String(p.price),
    originalPrice: p.originalPrice ? String(p.originalPrice) : '',
    currency:      p.currency,
    description:   p.description,
    features:      p.features.join('\n'),
    tags:          p.tags.join(', '),
    gallery:       p.images.map((url, i) => ({ url, attachmentId: p.imageAttachmentIds[i] })),
    badge:         p.badge ?? '',
    variants:      defaultSizes.map((size) => {
      const existing = p.variants.find((v) => v.size === size);
      return { size, stock: existing?.stock ?? 0 };
    }),
  };
}

interface ProductFormProps {
  initial:       AdminProductRow | null;
  categories:    Category[];
  existingSlugs: string[];
  onSubmit:      (input: UpsertProductInput) => Promise<void>;
  onCancel:      () => void;
  submitLabel:   string;
}

function ProductForm({ initial, categories, existingSlugs, onSubmit, onCancel, submitLabel }: ProductFormProps) {
  const [form, setForm] = useState<FormState>(() => fromProduct(initial));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(fromProduct(initial));
    setErrors({});
  }, [initial]);

  // Default the category to the first available when creating new.
  useEffect(() => {
    if (!form.categoryId && categories.length > 0) {
      setForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setVariantStock = (size: string, stock: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => (v.size === size ? { ...v, stock: Math.max(0, stock) } : v)),
    }));
  };

  const onNameBlur = () => {
    if (!form.slug && form.name) set('slug', slugify(form.name));
  };

  const previewImage = form.gallery[0]?.url ?? '';

  const initialAttachmentIds = useMemo(
    () => new Set(initial?.imageAttachmentIds ?? []),
    [initial],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim())                                       errs.name = 'Required';
    if (!form.slug.trim())                                       errs.slug = 'Required';
    if (existingSlugs.includes(form.slug))                       errs.slug = 'Slug already in use';
    if (!form.team.trim())                                       errs.team = 'Required';
    if (!form.categoryId)                                        errs.categoryId = 'Pick a category';
    if (!form.price.trim() || Number.isNaN(Number(form.price)))  errs.price = 'Valid price required';
    if (form.gallery.length === 0)                               errs.gallery = 'At least one image';

    if (Object.values(errs).some(Boolean)) {
      setErrors(errs);
      return;
    }

    const removedImageIds = (initial?.imageAttachmentIds ?? [])
      .filter((id) => !form.gallery.some((g) => g.attachmentId === id));
    const newImageFiles = form.gallery.filter((g) => g.file).map((g) => g.file as File);

    const input: UpsertProductInput = {
      id:            initial?.id ?? '',
      name:          form.name.trim(),
      slug:          form.slug.trim(),
      sport:         form.sport.trim(),
      team:          form.team.trim(),
      category:      categories.find((c) => c.id === form.categoryId)?.slug ?? '',
      price:         Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      currency:      form.currency || 'USD',
      images:        form.gallery.map((g) => g.url),
      description:   form.description.trim(),
      features:      form.features.split('\n').map((s) => s.trim()).filter(Boolean),
      tags:          form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      variants:      form.variants,
      badge:         form.badge.trim() || undefined,
      inStock:       form.variants.some((v) => v.stock > 0),
      rating:        initial?.rating ?? 0,
      reviewCount:   initial?.reviewCount ?? 0,
      createdAt:     initial?.createdAt ?? new Date().toISOString(),
      categoryId:    form.categoryId,
      newImageFiles,
      removedImageIds,
    };

    void initialAttachmentIds; // referenced for memoization deps
    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Main panel ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <FormSection title="Basics">
            <FormField label="Product name" error={errors.name} required>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                onBlur={onNameBlur}
                placeholder="Real Madrid Home Jersey 2024/25"
                className={lightInputClass}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Slug" error={errors.slug} required hint="Auto-generated from name">
                <input
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="real-madrid-home-2024-25"
                  className={lightInputClass}
                />
              </FormField>
              <FormField label="Badge (optional)" hint="New, Sale, Limited">
                <input
                  value={form.badge}
                  onChange={(e) => set('badge', e.target.value)}
                  placeholder="New"
                  className={lightInputClass}
                />
              </FormField>
            </div>

            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                placeholder="Authentic 2024/25 home jersey crafted with…"
                className={`${lightInputClass} resize-y`}
              />
            </FormField>

            <FormField label="Features" hint="One per line">
              <textarea
                value={form.features}
                onChange={(e) => set('features', e.target.value)}
                rows={3}
                placeholder={'AeroReady moisture-wicking\nRecycled polyester construction\nHeat-pressed crests'}
                className={`${lightInputClass} resize-y`}
              />
            </FormField>

            <FormField label="Tags" hint="Comma-separated">
              <input
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="white, home, adidas"
                className={lightInputClass}
              />
            </FormField>
          </FormSection>

          <FormSection title="Images">
            <FormField label="Product photos" error={errors.gallery} required hint="Upload up to 6">
              <MultiImageUpload
                values={form.gallery}
                onChange={(next) => set('gallery', next)}
                max={6}
              />
            </FormField>
          </FormSection>

          <FormSection title="Variants & Stock">
            <p className="text-xs text-gray-600 mb-2">Set stock per size. Sizes with 0 stock will be marked unavailable on the storefront.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {form.variants.map((v) => (
                <div key={v.size} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <p className="font-sport text-lg text-center text-gray-900 uppercase tracking-wide">{v.size}</p>
                  <input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) => setVariantStock(v.size, Number(e.target.value) || 0)}
                    className={`${lightInputClass} mt-2 text-center text-sm`}
                  />
                </div>
              ))}
            </div>
          </FormSection>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <FormSection title="Live preview">
            <div className="aspect-[3/4] rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
              {previewImage ? (
                <img src={previewImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs uppercase tracking-widest">
                  No image
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">
                {form.sport || 'sport'} · {form.team || 'team'}
              </p>
              <p className="font-medium text-gray-900 leading-snug">{form.name || 'Product name'}</p>
              <p className="font-bold text-gray-900 tabular-nums">
                {form.price ? formatPrice(Number(form.price), form.currency) : '—'}
              </p>
            </div>
          </FormSection>

          <FormSection title="Pricing">
            <FormField label="Price" error={errors.price} required>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="129.99"
                className={lightInputClass}
              />
            </FormField>
            <FormField label="Original price (optional)" hint="Shows a strike-through discount when set">
              <input
                type="number"
                step="0.01"
                value={form.originalPrice}
                onChange={(e) => set('originalPrice', e.target.value)}
                placeholder="149.99"
                className={lightInputClass}
              />
            </FormField>
            <FormField label="Currency">
              <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className={lightInputClass}>
                <option value="USD">USD — $</option>
                <option value="EUR">EUR — €</option>
                <option value="GBP">GBP — £</option>
                <option value="JPY">JPY — ¥</option>
              </select>
            </FormField>
          </FormSection>

          <FormSection title="Taxonomy">
            <FormField label="Sport">
              <input
                value={form.sport}
                onChange={(e) => set('sport', e.target.value)}
                placeholder="football"
                className={lightInputClass}
              />
            </FormField>
            <FormField label="Team" error={errors.team} required>
              <input
                value={form.team}
                onChange={(e) => set('team', e.target.value)}
                placeholder="real-madrid"
                className={lightInputClass}
              />
            </FormField>
            <FormField label="Category" error={errors.categoryId} required hint="Backend category (required)">
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={lightInputClass}>
                <option value="" disabled>Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>
          </FormSection>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl bg-black text-white font-bold text-sm uppercase tracking-wider border-2 border-accent hover:bg-accent-light shadow-lg shadow-accent/30 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Light form primitives
// ─────────────────────────────────────────────────────────────────────────────

const lightInputClass = 'w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</h3>
      {children}
    </section>
  );
}

function FormField({
  label, hint, error, required, children,
}: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
          {label} {required && <span className="text-danger">*</span>}
        </span>
        {hint && !error && <span className="text-[10px] text-gray-500 normal-case">{hint}</span>}
        {error && <span className="text-[10px] text-danger normal-case">{error}</span>}
      </label>
      {children}
    </div>
  );
}
