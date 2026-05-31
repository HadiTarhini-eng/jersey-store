import { Link } from 'react-router-dom';
import { InfoLayout, InfoSection } from './InfoLayout';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { formatPrice } from '../../utils/formatters';

export function ShippingPolicyPage() {
  const { freeShippingThreshold, currency } = useSiteConfig();
  const freeThreshold = formatPrice(freeShippingThreshold ?? 0, currency);

  return (
    <InfoLayout
      title="Shipping Policy"
      intro="Everything you need to know about how and when your order reaches you."
    >
      <InfoSection heading="Order processing">
        <p>
          Orders are processed within <strong>1–2 business days</strong> (Monday–Friday, excluding holidays).
          Personalised items printed with a custom name or number may take an extra day to prepare.
          You’ll receive a confirmation email when you order and a tracking link as soon as it ships.
        </p>
      </InfoSection>

      <InfoSection heading="Delivery times & costs">
        <ul className="list-disc list-inside space-y-1.5">
          <li><strong>Standard:</strong> 3–7 business days.</li>
          <li><strong>Express:</strong> 1–3 business days (calculated at checkout).</li>
          <li><strong>Free standard shipping</strong> on orders over {freeThreshold}.</li>
        </ul>
        <p>
          Exact rates and available methods are shown at checkout based on your address. Delivery
          estimates start from the day your order ships, not the day it’s placed.
        </p>
      </InfoSection>

      <InfoSection heading="International shipping">
        <p>
          We ship to most countries. International delivery typically takes 7–21 business days depending
          on the destination and local customs. Any import duties or taxes are the responsibility of the
          recipient and are not included in the order total unless stated at checkout.
        </p>
      </InfoSection>

      <InfoSection heading="Tracking your order">
        <p>
          Once your order ships you’ll get an email with a tracking number. Signed-in customers can also
          follow every order from their <Link to="/orders" className="text-accent hover:underline">Orders</Link> page.
        </p>
      </InfoSection>

      <InfoSection heading="Lost or delayed parcels">
        <p>
          If your tracking hasn’t updated for several days or your parcel is delayed beyond the estimate,
          please <Link to="/contact" className="text-accent hover:underline">contact us</Link> with your order
          number and we’ll investigate with the carrier right away.
        </p>
      </InfoSection>
    </InfoLayout>
  );
}
