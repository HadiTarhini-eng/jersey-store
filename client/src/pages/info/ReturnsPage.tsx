import { Link } from 'react-router-dom';
import { InfoLayout, InfoSection } from './InfoLayout';

export function ReturnsPage() {
  return (
    <InfoLayout
      title="Returns & Exchanges"
      intro="Not the right fit? We keep returns simple — here’s how it works."
    >
      <InfoSection heading="Our 7-day promise">
        <p>
          You can return eligible items within <strong>7 days of delivery</strong> for a refund or exchange.
          Items must be <strong>unworn, unwashed, and in their original condition</strong> with all tags
          attached and in the original packaging.
        </p>
      </InfoSection>

      <InfoSection heading="What can’t be returned">
        <ul className="list-disc list-inside space-y-1.5">
          <li>Personalised items (custom name or number) — these are made to order.</li>
          <li>Items marked final sale.</li>
          <li>Anything worn, washed, damaged, or missing tags.</li>
        </ul>
        <p>This doesn’t affect your rights if an item arrives faulty or incorrect.</p>
      </InfoSection>

      <InfoSection heading="How to start a return">
        <ol className="list-decimal list-inside space-y-1.5">
          <li><Link to="/contact" className="text-accent hover:underline">Contact us</Link> with your order number and the item(s) you’d like to return.</li>
          <li>We’ll reply with return instructions and the address.</li>
          <li>Pack the item securely in its original packaging and ship it back.</li>
          <li>Once received and inspected, we’ll process your refund or exchange.</li>
        </ol>
      </InfoSection>

      <InfoSection heading="Refunds">
        <p>
          Approved refunds are issued to your original payment method within 5–10 business days of us
          receiving the return. Original shipping charges are non-refundable unless the item was faulty
          or we made an error. Return shipping is the customer’s responsibility except in those cases.
        </p>
      </InfoSection>

      <InfoSection heading="Exchanges">
        <p>
          Need a different size? Start a return and place a new order for the size you want so you get it
          as fast as possible — we’ll refund the returned item once it arrives back with us.
        </p>
      </InfoSection>
    </InfoLayout>
  );
}
