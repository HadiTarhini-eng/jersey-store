import { useState, type ReactNode } from 'react';
import { useAdminCollection } from '../hooks/useAdminCollection';
import { ConfirmModal } from '../components/ConfirmModal';
import { ImageUpload } from '../components/ImageUpload';
import { Modal } from '../../components/ui/Modal';
import sportsSeed     from '../../data/sports.json';
import teamsSeed      from '../../data/teams.json';
import categoriesSeed from '../../data/categories.json';
import type { Sport, Team, UiCategory } from '../../types';

const sportsSeedTyped     = sportsSeed     as Sport[];
const teamsSeedTyped      = teamsSeed      as Team[];
const categoriesSeedTyped = categoriesSeed as UiCategory[];

type Tab = 'sports' | 'teams' | 'kit';

export function AdminCategories() {
  const [tab, setTab] = useState<Tab>('sports');

  return (
    <div className="space-y-5">
      {/* Tab strip */}
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
// Shared CRUD grid + Add/Delete affordances
// ─────────────────────────────────────────────────────────────────────────────

interface CrudGridProps<T extends { id: string }> {
  items:        T[];
  renderCard:   (item: T) => ReactNode;
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
          {items.map((item) => renderCard(item))}
        </div>
      )}
    </div>
  );
}

const inputClass = 'w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-stroke">
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
  );
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">{label}</span>
        {hint && <span className="text-[10px] text-gray-500 normal-case">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Sports tab
// ─────────────────────────────────────────────────────────────────────────────

function SportsTab() {
  const { items, add, update, remove } = useAdminCollection<Sport>('sports', sportsSeedTyped);
  const [editing, setEditing] = useState<Sport | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Sport | null>(null);

  const newSport = (): Sport => ({
    id:       `sport-${Date.now().toString(36)}`,
    name:     '',
    slug:     '',
    icon:     '⚽',
    image:    '',
    color:    '#007aff',
    featured: true,
  });

  return (
    <>
      <CrudGrid
        items={items}
        addLabel="Add Sport"
        emptyMessage="No sports yet."
        onAdd={() => setEditing(newSport())}
        renderCard={(sport) => (
          <div key={sport.id} className="bg-surface border border-stroke rounded-2xl p-4 space-y-3">
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
            <CardActions onEdit={() => setEditing(sport)} onDelete={() => setPendingDelete(sport)} />
          </div>
        )}
      />

      <SportEditor
        sport={editing}
        onCancel={() => setEditing(null)}
        onSave={(s) => {
          if (items.some((existing) => existing.id === s.id)) update(s.id, s);
          else                                                add(s);
          setEditing(null);
        }}
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete sport"
        message={pendingDelete ? `Delete "${pendingDelete.name}"? Existing products tagged with this sport will keep their tag but the sport navigation entry will disappear.` : ''}
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

function SportEditor({ sport, onCancel, onSave }: { sport: Sport | null; onCancel: () => void; onSave: (s: Sport) => void }) {
  const [form, setForm] = useState<Sport | null>(sport);
  if (sport && (!form || form.id !== sport.id)) setForm(sport);
  if (!sport || !form) return null;

  const set = <K extends keyof Sport>(k: K, v: Sport[K]) => setForm((p) => p ? { ...p, [k]: v } : p);

  return (
    <Modal isOpen={!!sport} onClose={onCancel} title="Sport" maxWidth="max-w-lg">
      <div className="space-y-4">
        <FormField label="Name">
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => !form.slug && set('slug', slugify(form.name))}
            className={inputClass}
            placeholder="Football"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Slug" hint="URL identifier">
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} className={inputClass} placeholder="football" />
          </FormField>
          <FormField label="Icon (emoji)">
            <input value={form.icon} onChange={(e) => set('icon', e.target.value)} className={inputClass} placeholder="⚽" maxLength={4} />
          </FormField>
        </div>
        <FormField label="Image">
          <ImageUpload value={form.image ?? ''} onChange={(url) => set('image', url)} label="Upload image" />
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

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={() => onSave(form)} className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm uppercase tracking-wider border-2 border-white hover:bg-black hover:text-white transition-colors">
          Save
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teams tab
// ─────────────────────────────────────────────────────────────────────────────

function TeamsTab() {
  const sports = useAdminCollection<Sport>('sports', sportsSeedTyped).items;
  const { items, add, update, remove } = useAdminCollection<Team>('teams', teamsSeedTyped);
  const [editing, setEditing] = useState<Team | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Team | null>(null);
  const [sportFilter, setSportFilter] = useState<string>('all');

  const visible = sportFilter === 'all' ? items : items.filter((t) => t.sport === sportFilter);

  const newTeam = (): Team => ({
    id:             `team-${Date.now().toString(36)}`,
    name:           '',
    slug:           '',
    sport:          sports[0]?.id ?? 'football',
    logo:           '',
    country:        '',
    color:          '#000000',
    colorSecondary: '#ffffff',
    abbreviation:   '',
  });

  return (
    <div className="space-y-4">
      {/* Sport filter */}
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
        renderCard={(team) => (
          <div key={team.id} className="bg-surface border border-stroke rounded-2xl p-4 space-y-3">
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
            <CardActions onEdit={() => setEditing(team)} onDelete={() => setPendingDelete(team)} />
          </div>
        )}
      />

      <TeamEditor
        team={editing}
        sports={sports}
        onCancel={() => setEditing(null)}
        onSave={(t) => {
          if (items.some((existing) => existing.id === t.id)) update(t.id, t);
          else                                                add(t);
          setEditing(null);
        }}
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete team"
        message={pendingDelete ? `Delete "${pendingDelete.name}"? Existing products tagged with this team will keep their tag.` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

function TeamEditor({ team, sports, onCancel, onSave }: { team: Team | null; sports: Sport[]; onCancel: () => void; onSave: (t: Team) => void }) {
  const [form, setForm] = useState<Team | null>(team);
  if (team && (!form || form.id !== team.id)) setForm(team);
  if (!team || !form) return null;

  const set = <K extends keyof Team>(k: K, v: Team[K]) => setForm((p) => p ? { ...p, [k]: v } : p);

  return (
    <Modal isOpen={!!team} onClose={onCancel} title="Team" maxWidth="max-w-lg">
      <div className="space-y-4">
        <FormField label="Name">
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => !form.slug && set('slug', slugify(form.name))}
            className={inputClass}
            placeholder="Real Madrid"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Slug">
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} className={inputClass} placeholder="real-madrid" />
          </FormField>
          <FormField label="Abbreviation" hint="3-letter code">
            <input value={form.abbreviation ?? ''} onChange={(e) => set('abbreviation', e.target.value.toUpperCase())} maxLength={4} className={inputClass} placeholder="RMA" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Sport">
            <select value={form.sport} onChange={(e) => set('sport', e.target.value)} className={inputClass}>
              {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Country">
            <input value={form.country} onChange={(e) => set('country', e.target.value)} className={inputClass} placeholder="Spain" />
          </FormField>
        </div>
        <FormField label="Logo" hint="PNG / SVG of the team crest">
          <ImageUpload value={form.logo} onChange={(url) => set('logo', url)} label="Upload crest" />
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

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={() => onSave(form)} className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm uppercase tracking-wider border-2 border-white hover:bg-black hover:text-white transition-colors">
          Save
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kit categories tab
// ─────────────────────────────────────────────────────────────────────────────

function KitTab() {
  const { items, add, update, remove } = useAdminCollection<UiCategory>('kit-categories', categoriesSeedTyped);
  const [editing, setEditing] = useState<UiCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UiCategory | null>(null);

  const newCategory = (): UiCategory => ({
    id:          `cat-${Date.now().toString(36)}`,
    name:        '',
    slug:        '',
    description: '',
    color:       '#007aff',
    colorDark:   '#0055cc',
    image:       '',
  });

  return (
    <>
      <CrudGrid
        items={items}
        addLabel="Add Category"
        emptyMessage="No kit categories yet."
        onAdd={() => setEditing(newCategory())}
        renderCard={(cat) => (
          <div key={cat.id} className="bg-surface border border-stroke rounded-2xl overflow-hidden">
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
              <p className="text-[10px] uppercase tracking-widest text-muted mb-2">/shop?categoryId={cat.slug}</p>
              <CardActions onEdit={() => setEditing(cat)} onDelete={() => setPendingDelete(cat)} />
            </div>
          </div>
        )}
      />

      <KitEditor
        category={editing}
        onCancel={() => setEditing(null)}
        onSave={(c) => {
          if (items.some((existing) => existing.id === c.id)) update(c.id, c);
          else                                                add(c);
          setEditing(null);
        }}
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete category"
        message={pendingDelete ? `Delete "${pendingDelete.name}"? It will be removed from the homepage category section.` : ''}
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

function KitEditor({ category, onCancel, onSave }: { category: UiCategory | null; onCancel: () => void; onSave: (c: UiCategory) => void }) {
  const [form, setForm] = useState<UiCategory | null>(category);
  if (category && (!form || form.id !== category.id)) setForm(category);
  if (!category || !form) return null;

  const set = <K extends keyof UiCategory>(k: K, v: UiCategory[K]) => setForm((p) => p ? { ...p, [k]: v } : p);

  return (
    <Modal isOpen={!!category} onClose={onCancel} title="Kit Category" maxWidth="max-w-lg">
      <div className="space-y-4">
        <FormField label="Name">
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => !form.slug && set('slug', slugify(form.name))}
            className={inputClass}
            placeholder="Hoodies"
          />
        </FormField>
        <FormField label="Slug">
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)} className={inputClass} placeholder="hoodies" />
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
          <ImageUpload value={form.image ?? ''} onChange={(url) => set('image', url)} label="Upload image" />
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

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={() => onSave(form)} className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm uppercase tracking-wider border-2 border-white hover:bg-black hover:text-white transition-colors">
          Save
        </button>
      </div>
    </Modal>
  );
}
