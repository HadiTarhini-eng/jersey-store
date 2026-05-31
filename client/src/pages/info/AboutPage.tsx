import { Link } from 'react-router-dom';
import { InfoLayout, InfoSection } from './InfoLayout';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { theme } from '../../config/theme';

export function AboutPage() {
  const { name, tagline } = useSiteConfig();

  return (
    <InfoLayout
      title="About Us"
      intro={tagline ? `${name} — ${tagline}.` : `Welcome to ${name}.`}
    >
      <InfoSection heading="Who we are">
        <p>
          {name} was built by football and basketball fans who were tired of choosing between
          authentic quality and a fair price. We bring together official-grade kits from the world’s
          greatest clubs and national teams, so you can wear the shirt that tells your story.
        </p>
      </InfoSection>

      <InfoSection heading="What we stand for">
        <ul className="list-disc list-inside space-y-1.5">
          <li><strong>Authenticity first.</strong> Player-grade fabric, embroidered crests, real detailing — never cheap knockoffs.</li>
          <li><strong>Fair prices.</strong> Premium kits without the inflated markup.</li>
          <li><strong>Fans, served by fans.</strong> Honest advice on sizing and fit, and support that actually helps.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="Quality you can trust">
        <p>
          Every product is checked before it ships, and our 7-day returns mean you can shop with
          confidence. If something isn’t right, we’ll fix it.
        </p>
      </InfoSection>

      <div className="flex flex-wrap gap-3 pt-2">
        <Link to="/shop" className={theme.btnPrimary}>Shop the collection</Link>
        <Link to="/contact" className={theme.btnGhost}>Talk to us</Link>
      </div>
    </InfoLayout>
  );
}
