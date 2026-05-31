import { Link } from 'react-router-dom';
import { InfoLayout, InfoSection } from './InfoLayout';
import { useSiteConfig } from '../../contexts/SiteConfigContext';

export function PrivacyPolicyPage() {
  const { name, email } = useSiteConfig();

  return (
    <InfoLayout
      title="Privacy Policy"
      intro={`How ${name} collects, uses, and protects your personal information.`}
    >
      <InfoSection heading="Introduction">
        <p>
          This Privacy Policy explains how {name} (“we”, “us”, “our”) handles your information when you
          visit our website, create an account, or place an order. By using our site you agree to the
          practices described here.
        </p>
      </InfoSection>

      <InfoSection heading="Information we collect">
        <ul className="list-disc list-inside space-y-1.5">
          <li><strong>Account details</strong> — name, email, phone, and password when you register.</li>
          <li><strong>Order details</strong> — shipping/billing address and the items you purchase.</li>
          <li><strong>Payment information</strong> — processed securely by our payment provider; we never store full card numbers.</li>
          <li><strong>Usage data</strong> — pages visited, device and browser information, and cookies.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="How we use your information">
        <ul className="list-disc list-inside space-y-1.5">
          <li>To process and deliver your orders and provide customer support.</li>
          <li>To manage your account and keep you signed in.</li>
          <li>To improve our products, website, and service.</li>
          <li>To send order updates and, where you’ve opted in, marketing communications.</li>
          <li>To prevent fraud and meet our legal obligations.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="Cookies">
        <p>
          We use cookies and similar technologies to keep your cart and session working, remember your
          preferences, and understand how the site is used. You can control cookies through your browser
          settings, though some features may not work without them.
        </p>
      </InfoSection>

      <InfoSection heading="Sharing your information">
        <p>
          We do not sell your personal information. We share it only with service providers who help us
          operate — such as payment processors, shipping carriers, and analytics providers — and only as
          needed to provide our service or comply with the law.
        </p>
      </InfoSection>

      <InfoSection heading="Data retention">
        <p>
          We keep your information for as long as your account is active or as needed to provide our
          service, resolve disputes, and meet legal and accounting requirements.
        </p>
      </InfoSection>

      <InfoSection heading="Security">
        <p>
          We use industry-standard safeguards, including encryption in transit, to protect your data. No
          method of transmission or storage is completely secure, but we work hard to protect your
          information and review our practices regularly.
        </p>
      </InfoSection>

      <InfoSection heading="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, delete, or export your
          personal information, and to object to or restrict certain processing. To exercise any of these
          rights, contact us using the details below.
        </p>
      </InfoSection>

      <InfoSection heading="Children’s privacy">
        <p>
          Our site is not directed to children under 13, and we do not knowingly collect their personal
          information. If you believe a child has provided us data, please contact us and we’ll remove it.
        </p>
      </InfoSection>

      <InfoSection heading="Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be posted on this page with a
          revised effective date. Continued use of the site means you accept the updated policy.
        </p>
      </InfoSection>

      <InfoSection heading="Contact us">
        <p>
          Questions about your privacy? Email{' '}
          {email
            ? <a href={`mailto:${email}`} className="text-accent hover:underline">{email}</a>
            : 'our team'}{' '}
          or reach us via the <Link to="/contact" className="text-accent hover:underline">Contact</Link> page.
        </p>
      </InfoSection>
    </InfoLayout>
  );
}
