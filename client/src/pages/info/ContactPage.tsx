import { InfoLayout, InfoSection } from './InfoLayout';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { getVisibleSocials } from '../../components/layout/socialPlatforms';

export function ContactPage() {
  const config = useSiteConfig();
  const { email, phone, name } = config;
  const socials = getVisibleSocials(config);

  return (
    <InfoLayout
      title="Contact Us"
      intro={`Questions about an order, sizing, or anything else? The ${name} team is happy to help.`}
    >
      <InfoSection heading="Get in touch">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {email && (
            <a
              href={`mailto:${email}`}
              className="block p-4 rounded-xl border border-stroke bg-surface hover:border-accent/50 transition-colors"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Email</p>
              <p className="text-primary font-semibold break-all">{email}</p>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/[^+\d]/g, '')}`}
              className="block p-4 rounded-xl border border-stroke bg-surface hover:border-accent/50 transition-colors"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Phone</p>
              <p className="text-primary font-semibold">{phone}</p>
            </a>
          )}
        </div>
      </InfoSection>

      <InfoSection heading="Support hours">
        <p>
          Our team replies Monday–Friday, 9am–6pm. We aim to respond to every message within one
          business day. Messages sent over the weekend are answered first thing Monday.
        </p>
      </InfoSection>

      {socials.length > 0 && (
        <InfoSection heading="Follow us">
          <div className="flex flex-wrap gap-3">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl border border-stroke text-secondary hover:text-primary hover:border-accent/50 transition-colors text-sm font-semibold"
              >
                {s.label}
              </a>
            ))}
          </div>
        </InfoSection>
      )}

      <InfoSection heading="Order help">
        <p>
          For the fastest help with an existing order, include your <strong>order number</strong> in
          your message so we can look it up right away.
        </p>
      </InfoSection>
    </InfoLayout>
  );
}
