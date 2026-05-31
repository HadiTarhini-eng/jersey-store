import { Link } from 'react-router-dom';
import { InfoLayout, InfoSection } from './InfoLayout';
import { useSiteConfig } from '../../contexts/SiteConfigContext';

export function CompanyPage() {
  const { name } = useSiteConfig();

  return (
    <InfoLayout
      title="Company"
      intro={`The story, mission, and people behind ${name}.`}
    >
      <InfoSection heading="Our mission">
        <p>
          To make authentic team apparel accessible to every fan — combining official-grade quality,
          honest pricing, and service that treats supporters the way we’d want to be treated.
        </p>
      </InfoSection>

      <InfoSection heading="What we do">
        <p>
          {name} curates and sells authentic jerseys and sportswear from top football and basketball
          clubs worldwide. From matchday kits to training gear and personalised shirts, we focus on the
          pieces fans actually want — and we stand behind every one of them.
        </p>
      </InfoSection>

      <InfoSection heading="Our values">
        <ul className="list-disc list-inside space-y-1.5">
          <li><strong>Authenticity</strong> — real products, described honestly.</li>
          <li><strong>Customer obsession</strong> — fast, genuine support before and after you buy.</li>
          <li><strong>Integrity</strong> — fair prices, clear policies, no surprises at checkout.</li>
          <li><strong>Passion for sport</strong> — we’re fans first, and it shows.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="Working with us">
        <p>
          For wholesale, partnership, or press enquiries, get in touch through our{' '}
          <Link to="/contact" className="text-accent hover:underline">Contact</Link> page and the right
          person on our team will get back to you.
        </p>
      </InfoSection>
    </InfoLayout>
  );
}
