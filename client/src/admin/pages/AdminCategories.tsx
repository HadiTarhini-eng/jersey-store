import { useEffect, useState, type ReactNode } from 'react';
import { useUiContentSlot, type UseUiContentSlotResult } from '../../hooks/useUiContentSlot';
import { ConfirmModal } from '../components/ConfirmModal';
import { ImageUpload } from '../components/ImageUpload';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { extractErrorMessage } from '../../services/api/client';
import { categoryApi } from '../../services/api';
import type { Category, Sport, Team, UiCategory } from '../../types';

type Tab = 'sports' | 'teams' | 'kit';

export function AdminCategories() {
  const [tab, setTab] = useState<Tab>('sports');

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
        <TabButton active={tab === 'sports'} onClick={() => setTab('sports')}>Sports</TabButton>
        <TabButton active={tab === 'teams'}  onClick={() => setTab('teams')}>Teams</TabButton>
        <TabButton active={tab === 'kit'}    onClick={() => setTab('kit')}>Kit Categories</TabButton>
      </div>

      {tab === 'sports' && <SportsTab />}
      {tab === 'teams'  && <TeamsTab />}
      {tab === 'kit'    && <KitTab />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 px-4 py-2 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors',
        active
          ? 'bg-white text-black border-white'
          : 'border-stroke text-secondary hover:text-primary hover:border-white/50',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared CRUD grid + reusable card primitives
// ─────────────────────────────────────────────────────────────────────────────

interface CrudGridProps<T extends { id: string }> {
  items:        T[];
  renderCard:   (item: T, index: number) => ReactNode;
  onAdd:        () => void;
  addLabel:     string;
  emptyMessage: string;
}

function CrudGrid<T extends { id: string }>({ items, renderCard, onAdd, addLabel, emptyMessage }: CrudGridProps<T>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-secondary">
          {items.length} {items.length === 1 ? 'entry' : 'entries'}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider border-2 border-white hover:bg-black hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-surface border border-stroke rounded-2xl px-4 py-10 text-center text-muted text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => renderCard(item, idx))}
        </div>
      )}
    </div>
  );
}

const inputClass = 'w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';
const inputErrorClass = inputClass + ' border-danger ring-2 ring-danger/20';

interface CardChromeProps {
  isActive:   boolean;
  isFirst:    boolean;
  isLast:     boolean;
  onMoveUp:   () => void;
  onMoveDown: () => void;
  onToggle:   () => void;
  onEdit:     () => void;
  onDelete:   () => void;
}

function CardChrome({ isActive, isFirst, isLast, onMoveUp, onMoveDown, onToggle, onEdit, onDelete }: CardChromeProps) {
  return (
    <div className="flex items-center justify-between gap-2 pt-3 border-t border-stroke">
      <div className="flex items-center gap-1">
        <button type="button" onClick={onMoveUp} disabled={isFirst} aria-label="Move up"
          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">↑</button>
        <button type="button" onClick={onMoveDown} disabled={isLast} aria-label="Move down"
          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">↓</button>
        <button
          type="button"
          onClick={onToggle}
          className={[
            'ml-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-colors',
            isActive
              ? 'border-delivered/40 text-delivered hover:bg-delivered/10'
              : 'border-stroke text-muted hover:text-primary hover:border-white/50',
          ].join(' ')}
        >
          {isActive ? 'Active' : 'Inactive'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-2 rounded-lg bg-white text-black font-bold text-xs uppercase tracking-wider border-2 border-white hover:bg-black hover:text-white transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function FormField({ label, hint, error, required, children }: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
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

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Reorder helpers — swap sortOrder values between adjacent items
// ─────────────────────────────────────────────────────────────────────────────

function useMove<T extends { id: string; sortOrder: number }>(
  items: T[],
  hook: UseUiContentSlotResult<any>,
  describe: string,
) {
  const { push } = useToast();
  return async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    const a = items[idx];
    const b = items[next];
    try {
      await Promise.all([hook.reorder(a.id, b.sortOrder), hook.reorder(b.id, a.sortOrder)]);
    } catch (err) {
      push({ variant: 'error', message: extractErrorMessage(err, `Could not reorder ${describe}`) });
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sports tab
// ─────────────────────────────────────────────────────────────────────────────

function SportsTab() {
  const hook = useUiContentSlot<Omit<Sport, 'id'>>('sport');
  const { items } = hook;
  const [editing, setEditing] = useState<Sport | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Sport | null>(null);
  const { push, promise } = useToast();
  const move = useMove(items, hook, 'sport');

  const newSport = (): Sport => ({
    id:       '', // server-assigned
    name:     '',
    slug:     '',
    icon:     '⚽',
    image:    '',
    color:    '#007aff',
    featured: true,
  });

  const onSave = async (s: Sport, file: File | null) => {
    const exists = items.some((existing) => existing.id === s.id);
    const { id: _id, ...payload } = s;
    void _id;
    try {
      if (exists) {
        await promise(hook.update(s.id, payload), {
          success: `${s.name} saved`,
          error:   (err) => extractErrorMessage(err, 'Could not save sport'),
        });
        if (file) await hook.setImage(s.id, file);
      } else {
        await promise(hook.add(payload, file ?? undefined), {
          success: `${s.name} created`,
          error:   (err) => extractErrorMessage(err, 'Could not create sport'),
        });
      }
      setEditing(null);
    } catch { /* toast already shown */ }
  };

  const onToggle = async (s: Sport & { isActive: boolean }) => {
    try {
      await hook.setActive(s.id, !s.isActive);
      push({ variant: 'success', message: `${s.name} ${s.isActive ? 'deactivated' : 'activated'}` });
    } catch (err) {
      push({ variant: 'error', message: extractErrorMessage(err, 'Could not toggle status') });
    }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    await promise(hook.remove(target.id), {
      success: `${target.name} deleted`,
      error:   (err) => extractErrorMessage(err, 'Could not delete sport'),
    }).catch(() => undefined);
  };

  return (
    <>
      <CrudGrid
        items={items}
        addLabel="Add Sport"
        emptyMessage="No sports yet."
        onAdd={() => setEditing(newSport())}
        renderCard={(sport, idx) => (
          <div key={sport.id} className={['bg-surface border border-stroke rounded-2xl p-4 space-y-3', !sport.isActive && 'opacity-60'].filter(Boolean).join(' ')}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${sport.color ?? '#007aff'}30` }}>
                {sport.icon}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-primary truncate">{sport.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted truncate">/shop?sport={sport.slug}</p>
              </div>
            </div>
            {sport.image && (
              <div className="aspect-[16/9] rounded-xl bg-surface-raised overflow-hidden">
                <img src={sport.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <CardChrome
              isActive={sport.isActive}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
              onMoveUp={() => move(sport.id, -1)}
              onMoveDown={() => move(sport.id, 1)}
              onToggle={() => onToggle(sport)}
              onEdit={() => setEditing(sport)}
              onDelete={() => setPendingDelete(sport)}
            />
          </div>
        )}
      />

      <SportEditor sport={editing} onCancel={() => setEditing(null)} onSave={onSave} />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete sport"
        message={pendingDelete ? `Delete "${pendingDelete.name}"? Existing products tagged with this sport will keep their tag but the sport navigation entry will disappear.` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={onDelete}
      />
    </>
  );
}

function SportEditor({ sport, onCancel, onSave }: { sport: Sport | null; onCancel: () => void; onSave: (s: Sport, file: File | null) => void }) {
  const [form, setForm] = useState<Sport | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Sport, string>>>({});

  useEffect(() => {
    setForm(sport);
    setFile(null);
    setErrors({});
  }, [sport]);

  if (!sport || !form) return null;

  const set = <K extends keyof Sport>(k: K, v: Sport[K]) => {
    setForm((p) => p ? { ...p, [k]: v } : p);
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const submit = () => {
    const errs: Partial<Record<keyof Sport, string>> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.slug.trim()) errs.slug = 'Required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form, file);
  };

  return (
    <Modal isOpen={!!sport} onClose={onCancel} title="Sport" maxWidth="max-w-lg">
      <div className="space-y-4">
        <FormField label="Name" error={errors.name} required>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => !form.slug && set('slug', slugify(form.name))}
            className={errors.name ? inputErrorClass : inputClass}
            placeholder="Football"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Slug" hint="URL identifier" error={errors.slug} required>
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} className={errors.slug ? inputErrorClass : inputClass} placeholder="football" />
          </FormField>
          <FormField label="Icon (emoji)">
            <input value={form.icon} onChange={(e) => set('icon', e.target.value)} className={inputClass} placeholder="⚽" maxLength={4} />
          </FormField>
        </div>
        <FormField label="Image">
          <ImageUpload
            value={form.image ?? ''}
            onChange={(url, picked) => { set('image', url); setFile(picked); }}
            label="Upload image"
          />
        </FormField>
        <FormField label="Accent color">
          <div className="flex gap-2">
            <input
              type="color"
              value={form.color ?? '#007aff'}
              onChange={(e) => set('color', e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-300 bg-white cursor-pointer"
            />
            <input value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} className={inputClass} placeholder="#007aff" />
          </div>
        </FormField>
        <FormField label="Featured" hint="Show in homepage carousel">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 bg-white text-accent focus:ring-accent"
            />
            <span className="text-sm text-gray-700">Display on storefront homepage</span>
          </label>
        </FormField>
      </div>

      <EditorFooter onCancel={onCancel} onSave={submit} />
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teams tab
// ─────────────────────────────────────────────────────────────────────────────

function TeamsTab() {
  const sports = useUiContentSlot<Omit<Sport, 'id'>>('sport').items;
  const hook = useUiContentSlot<Omit<Team, 'id'>>('team');
  const { items } = hook;
  const [editing, setEditing] = useState<Team | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Team | null>(null);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const { push, promise } = useToast();
  const move = useMove(items, hook, 'team');

  const visible = sportFilter === 'all' ? items : items.filter((t) => t.sport === sportFilter);

  const newTeam = (): Team => ({
    id:             '',
    name:           '',
    slug:           '',
    sport:          sports[0]?.id ?? '',
    logo:           '',
    country:        '',
    color:          '#000000',
    colorSecondary: '#ffffff',
    abbreviation:   '',
  });

  const onSave = async (t: Team, file: File | null) => {
    const exists = items.some((existing) => existing.id === t.id);
    const { id: _id, ...payload } = t;
    void _id;
    try {
      if (exists) {
        await promise(hook.update(t.id, payload), {
          success: `${t.name} saved`,
          error:   (err) => extractErrorMessage(err, 'Could not save team'),
        });
        if (file) await hook.setImage(t.id, file);
      } else {
        await promise(hook.add(payload, file ?? undefined), {
          success: `${t.name} created`,
          error:   (err) => extractErrorMessage(err, 'Could not create team'),
        });
      }
      setEditing(null);
    } catch { /* toast already shown */ }
  };

  const onToggle = async (t: Team & { isActive: boolean }) => {
    try {
      await hook.setActive(t.id, !t.isActive);
      push({ variant: 'success', message: `${t.name} ${t.isActive ? 'deactivated' : 'activated'}` });
    } catch (err) {
      push({ variant: 'error', message: extractErrorMessage(err, 'Could not toggle status') });
    }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    await promise(hook.remove(target.id), {
      success: `${target.name} deleted`,
      error:   (err) => extractErrorMessage(err, 'Could not delete team'),
    }).catch(() => undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
        <button
          type="button"
          onClick={() => setSportFilter('all')}
          className={[
            'shrink-0 px-3 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors',
            sportFilter === 'all' ? 'bg-white text-black border-white' : 'border-stroke text-secondary hover:text-primary hover:border-white/50',
          ].join(' ')}
        >
          All
        </button>
        {sports.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSportFilter(s.id)}
            className={[
              'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors',
              sportFilter === s.id ? 'bg-white text-black border-white' : 'border-stroke text-secondary hover:text-primary hover:border-white/50',
            ].join(' ')}
          >
            <span>{s.icon}</span>
            {s.name}
          </button>
        ))}
      </div>

      <CrudGrid
        items={visible}
        addLabel="Add Team"
        emptyMessage="No teams in this view."
        onAdd={() => setEditing(newTeam())}
        renderCard={(team, idx) => (
          <div key={team.id} className={['bg-surface border border-stroke rounded-2xl p-4 space-y-3', !team.isActive && 'opacity-60'].filter(Boolean).join(' ')}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden">
                {team.logo ? (
                  <img src={team.logo} alt="" className="w-9 h-9 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="font-sport text-xs font-bold" style={{ color: team.color ?? '#000' }}>
                    {team.abbreviation ?? team.name.slice(0, 3).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-primary truncate">{team.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted truncate">{team.sport} · {team.country}</p>
              </div>
            </div>
            <CardChrome
              isActive={team.isActive}
              isFirst={idx === 0}
              isLast={idx === visible.length - 1}
              onMoveUp={() => move(team.id, -1)}
              onMoveDown={() => move(team.id, 1)}
              onToggle={() => onToggle(team)}
              onEdit={() => setEditing(team)}
              onDelete={() => setPendingDelete(team)}
            />
          </div>
        )}
      />

      <TeamEditor team={editing} sports={sports as Sport[]} onCancel={() => setEditing(null)} onSave={onSave} />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete team"
        message={pendingDelete ? `Delete "${pendingDelete.name}"? Existing products tagged with this team will keep their tag.` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={onDelete}
      />
    </div>
  );
}

function TeamEditor({ team, sports, onCancel, onSave }: { team: Team | null; sports: Sport[]; onCancel: () => void; onSave: (t: Team, file: File | null) => void }) {
  const [form, setForm] = useState<Team | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Team, string>>>({});

  useEffect(() => {
    setForm(team);
    setFile(null);
    setErrors({});
  }, [team]);

  if (!team || !form) return null;

  const set = <K extends keyof Team>(k: K, v: Team[K]) => {
    setForm((p) => p ? { ...p, [k]: v } : p);
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const submit = () => {
    const errs: Partial<Record<keyof Team, string>> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.slug.trim()) errs.slug = 'Required';
    if (!form.sport)       errs.sport = 'Required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form, file);
  };

  return (
    <Modal isOpen={!!team} onClose={onCancel} title="Team" maxWidth="max-w-lg">
      <div className="space-y-4">
        <FormField label="Name" error={errors.name} required>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => !form.slug && set('slug', slugify(form.name))}
            className={errors.name ? inputErrorClass : inputClass}
            placeholder="Real Madrid"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Slug" error={errors.slug} required>
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} className={errors.slug ? inputErrorClass : inputClass} placeholder="real-madrid" />
          </FormField>
          <FormField label="Abbreviation" hint="3-letter code">
            <input value={form.abbreviation ?? ''} onChange={(e) => set('abbreviation', e.target.value.toUpperCase())} maxLength={4} className={inputClass} placeholder="RMA" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Sport" error={errors.sport} required>
            <select value={form.sport} onChange={(e) => set('sport', e.target.value)} className={errors.sport ? inputErrorClass : inputClass}>
              <option value="" disabled>Select a sport</option>
              {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Country">
            <input value={form.country} onChange={(e) => set('country', e.target.value)} className={inputClass} placeholder="Spain" />
          </FormField>
        </div>
        <FormField label="Logo" hint="PNG / SVG of the team crest">
          <ImageUpload
            value={form.logo}
            onChange={(url, picked) => { set('logo', url); setFile(picked); }}
            label="Upload crest"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Primary color">
            <div className="flex gap-2">
              <input type="color" value={form.color ?? '#000000'} onChange={(e) => set('color', e.target.value)} className="w-12 h-10 rounded-lg border border-gray-300 bg-white cursor-pointer" />
              <input value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} className={inputClass} />
            </div>
          </FormField>
          <FormField label="Secondary color">
            <div className="flex gap-2">
              <input type="color" value={form.colorSecondary ?? '#ffffff'} onChange={(e) => set('colorSecondary', e.target.value)} className="w-12 h-10 rounded-lg border border-gray-300 bg-white cursor-pointer" />
              <input value={form.colorSecondary ?? ''} onChange={(e) => set('colorSecondary', e.target.value)} className={inputClass} />
            </div>
          </FormField>
        </div>
      </div>

      <EditorFooter onCancel={onCancel} onSave={submit} />
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kit categories tab
// ─────────────────────────────────────────────────────────────────────────────

function KitTab() {
  const hook = useUiContentSlot<Omit<UiCategory, 'id'>>('kit-category');
  const { items } = hook;
  const [editing, setEditing] = useState<UiCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UiCategory | null>(null);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const { push, promise } = useToast();
  const move = useMove(items, hook, 'category');

  // Backend product categories — the editor binds each kit tile to one of
  // these so /shop links actually filter products. Loaded once per tab mount.
  useEffect(() => {
    let cancelled = false;
    categoryApi.list({ isActive: true })
      .then((cats) => { if (!cancelled) setProductCategories(cats); })
      .catch(() => { /* leave empty if the API is down */ });
    return () => { cancelled = true; };
  }, []);

  const newCategory = (): UiCategory => ({
    id:          '',
    name:        '',
    slug:        '',
    description: '',
    color:       '#007aff',
    colorDark:   '#0055cc',
    image:       '',
  });

  const onSave = async (c: UiCategory, file: File | null) => {
    const exists = items.some((existing) => existing.id === c.id);
    const { id: _id, ...payload } = c;
    void _id;
    try {
      if (exists) {
        await promise(hook.update(c.id, payload), {
          success: `${c.name} saved`,
          error:   (err) => extractErrorMessage(err, 'Could not save category'),
        });
        if (file) await hook.setImage(c.id, file);
      } else {
        await promise(hook.add(payload, file ?? undefined), {
          success: `${c.name} created`,
          error:   (err) => extractErrorMessage(err, 'Could not create category'),
        });
      }
      setEditing(null);
    } catch { /* toast already shown */ }
  };

  const onToggle = async (c: UiCategory & { isActive: boolean }) => {
    try {
      await hook.setActive(c.id, !c.isActive);
      push({ variant: 'success', message: `${c.name} ${c.isActive ? 'deactivated' : 'activated'}` });
    } catch (err) {
      push({ variant: 'error', message: extractErrorMessage(err, 'Could not toggle status') });
    }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    await promise(hook.remove(target.id), {
      success: `${target.name} deleted`,
      error:   (err) => extractErrorMessage(err, 'Could not delete category'),
    }).catch(() => undefined);
  };

  return (
    <>
      <CrudGrid
        items={items}
        addLabel="Add Category"
        emptyMessage="No kit categories yet."
        onAdd={() => setEditing(newCategory())}
        renderCard={(cat, idx) => (
          <div key={cat.id} className={['bg-surface border border-stroke rounded-2xl overflow-hidden', !cat.isActive && 'opacity-60'].filter(Boolean).join(' ')}>
            <div className="relative aspect-[16/10] bg-surface-raised">
              {cat.image && (
                <img src={cat.image} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${cat.colorDark ?? cat.color ?? '#000'}f0, transparent 65%)` }} />
              <div className="absolute inset-0 flex items-end p-4">
                <div>
                  <p className="font-sport text-xl tracking-wide text-white uppercase">{cat.name || 'Untitled'}</p>
                  {cat.description && <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{cat.description}</p>}
                </div>
              </div>
            </div>
            <div className="p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted mb-2 truncate">
                {cat.productCategoryId
                  ? `Links to product category: ${productCategories.find((c) => c.id === cat.productCategoryId)?.name ?? cat.productCategoryId}`
                  : 'Unlinked — tile won\'t filter products'}
              </p>
              <CardChrome
                isActive={cat.isActive}
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
                onMoveUp={() => move(cat.id, -1)}
                onMoveDown={() => move(cat.id, 1)}
                onToggle={() => onToggle(cat)}
                onEdit={() => setEditing(cat)}
                onDelete={() => setPendingDelete(cat)}
              />
            </div>
          </div>
        )}
      />

      <KitEditor
        category={editing}
        productCategories={productCategories}
        onCancel={() => setEditing(null)}
        onSave={onSave}
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete category"
        message={pendingDelete ? `Delete "${pendingDelete.name}"? It will be removed from the homepage category section.` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={onDelete}
      />
    </>
  );
}

function KitEditor({
  category, productCategories, onCancel, onSave,
}: {
  category: UiCategory | null;
  productCategories: Category[];
  onCancel: () => void;
  onSave: (c: UiCategory, file: File | null) => void;
}) {
  const [form, setForm] = useState<UiCategory | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof UiCategory, string>>>({});

  useEffect(() => {
    setForm(category);
    setFile(null);
    setErrors({});
  }, [category]);

  if (!category || !form) return null;

  const set = <K extends keyof UiCategory>(k: K, v: UiCategory[K]) => {
    setForm((p) => p ? { ...p, [k]: v } : p);
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const submit = () => {
    const errs: Partial<Record<keyof UiCategory, string>> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.slug.trim()) errs.slug = 'Required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form, file);
  };

  return (
    <Modal isOpen={!!category} onClose={onCancel} title="Kit Category" maxWidth="max-w-lg">
      <div className="space-y-4">
        <FormField label="Name" error={errors.name} required>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => !form.slug && set('slug', slugify(form.name))}
            className={errors.name ? inputErrorClass : inputClass}
            placeholder="Hoodies"
          />
        </FormField>
        <FormField label="Slug" error={errors.slug} required>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)} className={errors.slug ? inputErrorClass : inputClass} placeholder="hoodies" />
        </FormField>
        <FormField
          label="Linked product category"
          hint="Pick the backend category this tile filters by on the shop page"
        >
          <select
            value={form.productCategoryId ?? ''}
            onChange={(e) => set('productCategoryId', e.target.value || undefined)}
            className={inputClass}
          >
            <option value="">— None (tile won't filter products) —</option>
            {productCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Description">
          <textarea
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            className={`${inputClass} resize-y`}
            placeholder="Premium team hoodies & sweatshirts"
          />
        </FormField>
        <FormField label="Image">
          <ImageUpload
            value={form.image ?? ''}
            onChange={(url, picked) => { set('image', url); setFile(picked); }}
            label="Upload image"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Primary color">
            <div className="flex gap-2">
              <input type="color" value={form.color ?? '#007aff'} onChange={(e) => set('color', e.target.value)} className="w-12 h-10 rounded-lg border border-gray-300 bg-white cursor-pointer" />
              <input value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} className={inputClass} />
            </div>
          </FormField>
          <FormField label="Dark accent">
            <div className="flex gap-2">
              <input type="color" value={form.colorDark ?? '#0055cc'} onChange={(e) => set('colorDark', e.target.value)} className="w-12 h-10 rounded-lg border border-gray-300 bg-white cursor-pointer" />
              <input value={form.colorDark ?? ''} onChange={(e) => set('colorDark', e.target.value)} className={inputClass} />
            </div>
          </FormField>
        </div>
      </div>

      <EditorFooter onCancel={onCancel} onSave={submit} />
    </Modal>
  );
}

function EditorFooter({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
      <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors">
        Cancel
      </button>
      <button type="button" onClick={onSave} className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm uppercase tracking-wider border-2 border-white hover:bg-black hover:text-white transition-colors">
        Save
      </button>
    </div>
  );
}
