import { InfoLayout, InfoSection } from './InfoLayout';

const ROWS = [
  { size: 'XS',  chest: '32–34', length: '26' },
  { size: 'S',   chest: '34–36', length: '27' },
  { size: 'M',   chest: '38–40', length: '28' },
  { size: 'L',   chest: '42–44', length: '29' },
  { size: 'XL',  chest: '46–48', length: '30' },
  { size: 'XXL', chest: '50–52', length: '31' },
];

export function SizeGuidePage() {
  return (
    <InfoLayout
      title="Size Guide"
      intro="All measurements are in inches. If you’re between sizes, choose the next size up for a relaxed fit."
    >
      <InfoSection>
        <div className="overflow-x-auto rounded-xl border border-stroke">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-[11px] uppercase tracking-widest bg-surface-raised">
                <th className="text-left py-3 px-4 font-semibold">Size</th>
                <th className="text-left py-3 px-4 font-semibold">Chest (in)</th>
                <th className="text-left py-3 px-4 font-semibold">Length (in)</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.size} className="border-t border-stroke">
                  <td className="py-3 px-4 font-bold text-primary">{r.size}</td>
                  <td className="py-3 px-4 text-secondary">{r.chest}"</td>
                  <td className="py-3 px-4 text-secondary">{r.length}"</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoSection>

      <InfoSection heading="How to measure">
        <ul className="list-disc list-inside space-y-1.5">
          <li><strong>Chest:</strong> measure around the fullest part of your chest, keeping the tape level under your arms.</li>
          <li><strong>Length:</strong> measure from the highest point of the shoulder straight down to the hem.</li>
        </ul>
        <p>For the most accurate result, measure over a light t-shirt and keep the tape snug but not tight.</p>
      </InfoSection>

      <InfoSection heading="Fit tips">
        <ul className="list-disc list-inside space-y-1.5">
          <li>Authentic match kits run slim and athletic — size up if you prefer extra room.</li>
          <li>Planning to layer underneath? Go one size up.</li>
          <li>Still unsure? Compare the measurements above with a jersey you already own and love.</li>
        </ul>
      </InfoSection>
    </InfoLayout>
  );
}
