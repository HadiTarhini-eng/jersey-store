import { useEffect, useRef, useState } from 'react';
import { useSiteConfig } from '../../contexts/SiteConfigContext';

/**
 * Strip everything except digits from a phone string — required by wa.me URLs.
 * Returns null when fewer than 6 digits remain so we can hide the button
 * gracefully rather than open a broken link.
 */
function phoneToWaNumber(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 6 ? digits : null;
}

/**
 * Instagram-style floating WhatsApp chat. A circular green bubble sits in the
 * bottom-right corner of every public page; tapping it expands a small panel
 * with a one-line greeting and a "Start chat" CTA that opens WhatsApp web/app
 * with a prefilled message. Hidden entirely when no phone is configured.
 */
export function FloatingWhatsApp() {
  const siteConfig = useSiteConfig();
  const waNumber   = phoneToWaNumber(siteConfig.phone ?? undefined);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!waNumber) return null;

  const greeting = `Hi ${siteConfig.name}, I have a question about your store.`;
  const waUrl    = `https://wa.me/${waNumber}?text=${encodeURIComponent(greeting)}`;

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
      {/* Expanded chat preview */}
      {open && (
        <div
          role="dialog"
          aria-label="Chat with us on WhatsApp"
          className="w-72 rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 shadow-2xl shadow-black/60 overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#075E54]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <WhatsAppGlyph className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{siteConfig.name}</p>
                <p className="text-[11px] text-white/80 leading-tight">Typically replies in minutes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat preview"
              className="shrink-0 p-1.5 -mr-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message bubble — looks like the first incoming line in a WhatsApp thread */}
          <div className="px-4 py-5 bg-[#0b141a]">
            <div className="inline-block max-w-[85%] rounded-xl rounded-tl-sm bg-[#202c33] text-white text-sm px-3 py-2 leading-snug">
              Hey 👋 How can we help you today?
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 py-3 bg-[#0b141a] border-t border-white/5">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#1ebe57] transition-colors"
            >
              <WhatsAppGlyph className="w-4 h-4" />
              Start chat on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Trigger bubble */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp'}
        aria-expanded={open}
        className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus-accent"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <WhatsAppGlyph className="w-7 h-7" />
        )}
      </button>
    </div>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.521.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.711.306 1.265.489 1.697.625.713.227 1.362.195 1.875.118.572-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  );
}
