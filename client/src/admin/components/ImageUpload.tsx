import { useRef, useState } from 'react';

interface SingleImageUploadProps {
  value:    string;
  onChange: (dataUrl: string) => void;
  label?:   string;
}

/**
 * Reads a File via FileReader and resolves to a base64 data URL — fine for
 * the JSON-seeded localStorage admin store; would be swapped for a real
 * uploader once a backend is wired in.
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Single-image picker — used inside the white admin modals. */
export function ImageUpload({ value, onChange, label = 'Upload image' }: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    try {
      const url = await fileToDataUrl(file);
      onChange(url);
    } finally {
      setLoading(false);
    }
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
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-white text-xs font-bold uppercase tracking-wider border-2 border-accent hover:bg-accent-light transition-colors disabled:opacity-60"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
            </svg>
            {loading ? 'Reading…' : label}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-danger hover:bg-danger/10 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-500">PNG or JPG. Stored locally as a data URL.</p>
      </div>
    </div>
  );
}

interface MultiImageUploadProps {
  values:   string[];
  onChange: (next: string[]) => void;
  /** Max images allowed. Defaults to 6. */
  max?:     number;
}

/** Multi-image gallery uploader — used for product images. */
export function MultiImageUpload({ values, onChange, max = 6 }: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const pickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      const urls = await Promise.all(Array.from(files).slice(0, max - values.length).map(fileToDataUrl));
      onChange([...values, ...urls]);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx: number) => onChange(values.filter((_, i) => i !== idx));

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
        {values.map((src, i) => (
          <div
            key={`${i}-${src.slice(-8)}`}
            className={[
              'relative w-20 h-24 rounded-xl overflow-hidden border-2 group',
              i === 0 ? 'border-accent' : 'border-gray-200',
            ].join(' ')}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-accent text-white">
                Primary
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
            disabled={loading}
            className="w-20 h-24 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:text-accent hover:border-accent transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-60"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
          </button>
        )}
      </div>

      <p className="text-[10px] text-gray-500">
        {values.length}/{max} images — first one is the primary thumbnail. Hover an image to make primary or remove.
      </p>
    </div>
  );
}
