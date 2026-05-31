import { Link } from 'react-router-dom';
import { InfoLayout, InfoSection } from './InfoLayout';
import { useSiteConfig } from '../../contexts/SiteConfigContext';

export function TermsPage() {
  const { name } = useSiteConfig();

  return (
    <InfoLayout
      title="Terms of Service"
      intro={`The terms that govern your use of ${name} and your purchases from us.`}
    >
      <InfoSection heading="Acceptance of terms">
        <p>
          By accessing or using {name}, you agree to be bound by these Terms of Service and our{' '}
          <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>. If you do not
          agree, please do not use the site.
        </p>
      </InfoSection>

      <InfoSection heading="Eligibility & accounts">
        <p>
          You must be able to form a legally binding contract to purchase from us. If you create an
          account, you’re responsible for keeping your credentials secure and for all activity under your
          account. Please give accurate, current information and keep it up to date.
        </p>
      </InfoSection>

      <InfoSection heading="Orders & pricing">
        <ul className="list-disc list-inside space-y-1.5">
          <li>All orders are subject to acceptance and availability.</li>
          <li>Prices are shown in the displayed currency and may change at any time before you order.</li>
          <li>We strive for accuracy, but if a pricing or product error is found we may cancel the order and refund any payment.</li>
          <li>Promotional codes and coupons are subject to their own terms and may be limited or withdrawn.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="Payment">
        <p>
          Payment is taken at checkout through our secure payment provider. By submitting an order you
          confirm you’re authorised to use the chosen payment method.
        </p>
      </InfoSection>

      <InfoSection heading="Shipping, returns & refunds">
        <p>
          Delivery and returns are governed by our{' '}
          <Link to="/shipping-policy" className="text-accent hover:underline">Shipping Policy</Link> and{' '}
          <Link to="/returns" className="text-accent hover:underline">Returns</Link> pages, which form part
          of these terms.
        </p>
      </InfoSection>

      <InfoSection heading="Intellectual property">
        <p>
          All content on this site — including logos, text, images, and design — is owned by {name} or its
          licensors and is protected by intellectual property laws. You may not reproduce or use it without
          our written permission. Team names and crests remain the property of their respective owners.
        </p>
      </InfoSection>

      <InfoSection heading="Acceptable use">
        <p>You agree not to misuse the site, including by attempting to:</p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>Breach security, disrupt the service, or access data that isn’t yours.</li>
          <li>Use the site for fraud or any unlawful purpose.</li>
          <li>Scrape, copy, or resell content without permission.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="Disclaimers">
        <p>
          The site and products are provided “as is” without warranties of any kind beyond those that
          cannot be excluded under applicable law. We do not guarantee the site will be uninterrupted or
          error-free.
        </p>
      </InfoSection>

      <InfoSection heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, {name} will not be liable for any indirect, incidental,
          or consequential damages arising from your use of the site or products. Nothing in these terms
          limits liability that cannot be excluded by law.
        </p>
      </InfoSection>

      <InfoSection heading="Changes to these terms">
        <p>
          We may update these terms from time to time. The current version is always posted on this page,
          and continued use of the site means you accept any changes.
        </p>
      </InfoSection>

      <InfoSection heading="Contact">
        <p>
          Questions about these terms? Reach us through the{' '}
          <Link to="/contact" className="text-accent hover:underline">Contact</Link> page.
        </p>
      </InfoSection>
    </InfoLayout>
  );
}
