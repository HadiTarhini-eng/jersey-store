import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { DataGrid, type DataGridColumn } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { Modal } from '../../components/ui/Modal';
import { MultiImageUpload } from '../components/ImageUpload';
import { useAdminCollection } from '../hooks/useAdminCollection';
import productsSeed from '../../data/products.json';
import type { AdminProduct } from '../../types';
import { formatPrice } from '../../utils/formatters';

const productsSeedTyped = productsSeed as AdminProduct[];

const totalStock = (p: AdminProduct) => p.variants.reduce((s, v) => s + v.stock, 0);

// ─────────────────────────────────────────────────────────────────────────────
// Products list (dark — lives on the dark admin layout)
// ─────────────────────────────────────────────────────────────────────────────

export function AdminProducts() {
  const { items: products, update, remove } = useAdminCollection<AdminProduct>('products', productsSeedTyped);

  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null);
  const [stockEditing,  setStockEditing]  = useState<AdminProduct | null>(null);
  const navigate = useNavigate();

  const columns: DataGridColumn<AdminProduct>[] = [
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
              {p.sport} · {p.team.replace(/-/g, ' ')}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (p) => <span className="text-secondary capitalize">{p.category}</span>,
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

  return (
    <>
      <DataGrid<AdminProduct>
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

      <StockEditorModal
        product={stockEditing}
        onClose={() => setStockEditing(null)}
        onSave={(variants) => {
          if (stockEditing) {
            const inStock = variants.some((v) => v.stock > 0);
            update(stockEditing.id, { variants, inStock });
          }
          setStockEditing(null);
        }}
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete product"
        message={pendingDelete ? `Permanently delete "${pendingDelete.name}"? This can't be undone.` : ''}
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

// ─────────────────────────────────────────────────────────────────────────────
// Stock editor — white modal (matches the panel theme)
// ─────────────────────────────────────────────────────────────────────────────

interface StockEditorModalProps {
  product: AdminProduct | null;
  onClose: () => void;
  onSave:  (variants: AdminProduct['variants']) => void;
}

function StockEditorModal({ product, onClose, onSave }: StockEditorModalProps) {
  const [variants, setVariants] = useState<AdminProduct['variants']>([]);

  if (product && variants.length !== product.variants.length) {
    setVariants(product.variants.map((v) => ({ ...v })));
  }

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
// Edit-product modal — wraps the shared ProductForm with the existing record.
// ─────────────────────────────────────────────────────────────────────────────

export function EditProductModal({ product, onCancel, onSave }: {
  product: AdminProduct | null; onCancel: () => void; onSave: (p: AdminProduct) => void;
}) {
  if (!product) return null;
  return (
    <Modal isOpen={!!product} onClose={onCancel} title={`Edit — ${product.name}`} maxWidth="max-w-4xl">
      <ProductForm
        initial={product}
        onCancel={onCancel}
        onSave={onSave}
        submitLabel="Save changes"
      />
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add product page — wraps the shared ProductForm with empty defaults.
// The form is light-themed; on the dark admin layout it reads as white cards.
// ─────────────────────────────────────────────────────────────────────────────

export function AdminAddProduct() {
  const navigate = useNavigate();
  const { add } = useAdminCollection<AdminProduct>('products', productsSeedTyped);

  return (
    <div className="space-y-5 max-w-5xl">
      <Link to="/admin/products" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors">
        ← All products
      </Link>
      <ProductForm
        initial={null}
        onCancel={() => navigate('/admin/products')}
        onSave={(product) => {
          add(product);
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
  const { items: products, update } = useAdminCollection<AdminProduct>('products', productsSeedTyped);
  const product = products.find((item) => item.id === id);

  if (!product) return <Navigate to="/admin/products" replace />;

  return (
    <div className="space-y-5 max-w-5xl">
      <Link to="/admin/products" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors">
        ← All products
      </Link>
      <ProductForm
        key={product.id}
        initial={product}
        onCancel={() => navigate('/admin/products')}
        onSave={(next) => {
          update(next.id, next);
          navigate('/admin/products');
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared ProductForm (light theme — works inside white modal and on dark page)
// ─────────────────────────────────────────────────────────────────────────────

const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface FormState {
  name:           string;
  slug:           string;
  sport:          string;
  team:           string;
  category:       string;
  price:          string;
  originalPrice:  string;
  currency:       string;
  description:    string;
  features:       string;
  tags:           string;
  images:         string[];
  badge:          string;
  variants:       { size: string; stock: number }[];
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function fromProduct(p: AdminProduct | null): FormState {
  if (!p) {
    return {
      name: '', slug: '', sport: 'football', team: '', category: 'jerseys',
      price: '', originalPrice: '', currency: 'USD',
      description: '', features: '', tags: '',
      images: [], badge: '',
      variants: defaultSizes.map((size) => ({ size, stock: 0 })),
    };
  }
  return {
    name:          p.name,
    slug:          p.slug,
    sport:         p.sport,
    team:          p.team,
    category:      p.category,
    price:         String(p.price),
    originalPrice: p.originalPrice ? String(p.originalPrice) : '',
    currency:      p.currency,
    description:   p.description,
    features:      p.features.join('\n'),
    tags:          p.tags.join(', '),
    images:        [...p.images],
    badge:         p.badge ?? '',
    variants:      defaultSizes.map((size) => {
      const existing = p.variants.find((v) => v.size === size);
      return { size, stock: existing?.stock ?? 0 };
    }),
  };
}

interface ProductFormProps {
  initial:     AdminProduct | null;
  onSave:      (product: AdminProduct) => void;
  onCancel:    () => void;
  submitLabel: string;
}

function ProductForm({ initial, onSave, onCancel, submitLabel }: ProductFormProps) {
  const [form, setForm] = useState<FormState>(() => fromProduct(initial));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    setForm(fromProduct(initial));
    setErrors({});
  }, [initial]);

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

  const previewImage = form.images[0] ?? '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim())   errs.name = 'Required';
    if (!form.slug.trim())   errs.slug = 'Required';
    if (!form.team.trim())   errs.team = 'Required';
    if (!form.price.trim() || Number.isNaN(Number(form.price))) errs.price = 'Valid price required';
    if (form.images.length === 0) errs.images = 'At least one image';

    if (Object.values(errs).some(Boolean)) {
      setErrors(errs);
      return;
    }

    const totalVariantStock = form.variants.reduce((s, v) => s + v.stock, 0);

    const product: AdminProduct = {
      id:            initial?.id ?? `prod-${Date.now().toString(36)}`,
      name:          form.name.trim(),
      slug:          form.slug.trim(),
      sport:         form.sport.trim(),
      team:          form.team.trim(),
      category:      form.category.trim(),
      price:         Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      currency:      form.currency || 'USD',
      images:        form.images,
      description:   form.description.trim(),
      features:      form.features.split('\n').map((s) => s.trim()).filter(Boolean),
      tags:          form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      variants:      form.variants,
      badge:         form.badge.trim() || undefined,
      inStock:       totalVariantStock > 0,
      rating:        initial?.rating ?? 0,
      reviewCount:   initial?.reviewCount ?? 0,
      createdAt:     initial?.createdAt ?? new Date().toISOString(),
    };

    onSave(product);
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
                placeholder="real madrid, white, home, adidas"
                className={lightInputClass}
              />
            </FormField>
          </FormSection>

          <FormSection title="Images">
            <FormField label="Product photos" error={errors.images} required hint="Upload up to 6">
              <MultiImageUpload
                values={form.images}
                onChange={(next) => set('images', next)}
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
              <select value={form.sport} onChange={(e) => set('sport', e.target.value)} className={lightInputClass}>
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="american-football">American Football</option>
                <option value="baseball">Baseball</option>
                <option value="formula1">Formula 1</option>
              </select>
            </FormField>
            <FormField label="Team" error={errors.team} required>
              <input
                value={form.team}
                onChange={(e) => set('team', e.target.value)}
                placeholder="real-madrid"
                className={lightInputClass}
              />
            </FormField>
            <FormField label="Category">
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={lightInputClass}>
                <option value="jerseys">Jerseys</option>
                <option value="shorts">Shorts</option>
                <option value="tshirts">T-Shirts</option>
                <option value="hoodies">Hoodies</option>
                <option value="jackets">Jackets</option>
                <option value="shoes">Shoes</option>
              </select>
            </FormField>
          </FormSection>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-black text-white font-bold text-sm uppercase tracking-wider border-2 border-accent hover:bg-accent-light shadow-lg shadow-accent/30 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Light form primitives — shared by ProductForm
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
