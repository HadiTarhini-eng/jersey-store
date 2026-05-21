import { useEffect, useRef } from 'react';

/**
 * File-handover pattern: the picker emits an object-URL preview (for instant
 * feedback) plus the underlying File. The parent is responsible for shipping
 * the File to the backend via the appropriate upload endpoint
 * (uiContentApi.setImage, productApi.images.create, etc.) and replacing the
 * preview with the persisted URL once the upload resolves.
 *
 * The `value` prop is whatever URL should be displayed right now — local
 * objectURL while pending, remote URL once persisted. Both single and multi
 * variants follow the same contract.
 */

interface SingleImageUploadProps {
  value:     string;
  /** Called with (preview-url, file). When the user removes, file is null. */
  onChange:  (url: string, file: File | null) => void;
  label?:    string;
}

export function ImageUpload({ value, onChange, label = 'Upload image' }: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    onChange(url, file);
  };

  const clear = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    onChange('', null);
  };

  return (
    <div className="flex items-stretch gap-3">
      <div className="relative w-20 h-20 shrink-0 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden">
        {value ? (
          <img
            src={value}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-gray-400">
            None
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => pick(e.target.files?.[0])}
          className="hidden"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-white text-xs font-bold uppercase tracking-wider border-2 border-accent hover:bg-accent-light transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
            </svg>
            {label}
          </button>
          {value && (
            <button
              type="button"
              onClick={clear}
              className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-danger hover:bg-danger/10 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-500">PNG or JPG. Uploaded to the server on save.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-image gallery (used by products). Each entry is { url, file? } — `file`
// is set for newly picked entries that still need to be uploaded.
// ─────────────────────────────────────────────────────────────────────────────

export interface GalleryEntry {
  /** Either a remote URL (already persisted) or a transient object URL. */
  url:  string;
  /** Set for new picks awaiting upload. Undefined for already-persisted rows. */
  file?: File;
  /** Server-side attachment id once persisted. Useful for delete/reorder. */
  attachmentId?: string;
}

interface MultiImageUploadProps {
  values:   GalleryEntry[];
  onChange: (next: GalleryEntry[]) => void;
  max?:     number;
}

export function MultiImageUpload({ values, onChange, max = 6 }: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => () => {
    objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrls.current.clear();
  }, []);

  const pickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = max - values.length;
    const accepted = Array.from(files).slice(0, room);
    const additions: GalleryEntry[] = accepted.map((file) => {
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      return { url, file };
    });
    onChange([...values, ...additions]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (idx: number) => {
    const removed = values[idx];
    if (removed?.file && objectUrls.current.has(removed.url)) {
      URL.revokeObjectURL(removed.url);
      objectUrls.current.delete(removed.url);
    }
    onChange(values.filter((_, i) => i !== idx));
  };

  const movePrimary = (idx: number) => {
    if (idx === 0) return;
    const next = [...values];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    onChange(next);
  };

  const atLimit = values.length >= max;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => pickFiles(e.target.files)}
        className="hidden"
      />

      <div className="flex flex-wrap gap-2">
        {values.map((entry, i) => (
          <div
            key={`${i}-${entry.url.slice(-12)}`}
            className={[
              'relative w-20 h-24 rounded-xl overflow-hidden border-2 group',
              i === 0 ? 'border-accent' : 'border-gray-200',
            ].join(' ')}
          >
            <img src={entry.url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-accent text-white">
                Primary
              </span>
            )}
            {entry.file && (
              <span className="absolute top-1 right-1 px-1 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-power text-white">
                New
              </span>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => movePrimary(i)}
                  className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-white text-black"
                  title="Make primary"
                >
                  ★
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-danger text-white"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-24 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:text-accent hover:border-accent transition-colors flex flex-col items-center justify-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
          </button>
        )}
      </div>

      <p className="text-[10px] text-gray-500">
        {values.length}/{max} images — first one is the primary thumbnail. New picks upload on save.
      </p>
    </div>
  );
}
