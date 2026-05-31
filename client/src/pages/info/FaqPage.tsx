import { Link } from 'react-router-dom';
import { InfoLayout } from './InfoLayout';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Are your jerseys authentic?',
    a: 'Yes. Every kit is made from official, player-grade material with embroidered crests and authentic detailing — never cheap replicas. If anything ever falls short, we’ll make it right.',
  },
  {
    q: 'How do I choose the right size?',
    a: 'Check our Size Guide for chest and length measurements in inches, plus tips on how to measure. If you’re between sizes, we recommend sizing up for a relaxed fit.',
  },
  {
    q: 'How long will my order take to arrive?',
    a: 'Orders are processed within 1–2 business days. Standard delivery then takes 3–7 business days; express options are faster. You’ll get a tracking link by email as soon as your order ships.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Yes, we ship to most countries. Delivery times and any customs duties vary by destination and are shown at checkout where applicable.',
  },
  {
    q: 'Can I personalise my jersey with a name and number?',
    a: 'On products that support printing, you can add a custom name and number on the product page before adding to cart. Personalised items are made to order and can’t be returned unless faulty.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards. Your payment details are encrypted and processed securely — we never store your card number.',
  },
  {
    q: 'Can I change or cancel my order?',
    a: 'Reach out as soon as possible via the Contact page. If your order hasn’t entered fulfilment yet, we’ll do our best to update or cancel it.',
  },
  {
    q: 'What is your return policy?',
    a: 'Unworn items in their original condition can be returned within 7 days of delivery. See our Returns page for the full details and step-by-step instructions.',
  },
  {
    q: 'Do I need an account to order?',
    a: 'You can check out as a guest, but creating an account lets you track orders, save favourites, and redeem member coupons.',
  },
];

export function FaqPage() {
  return (
    <InfoLayout
      title="FAQ"
      intro="Answers to the questions we hear most. Still stuck? Our team is one message away on the Contact page."
    >
      <div className="divide-y divide-stroke border-y border-stroke">
        {FAQS.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-primary font-semibold">
              <span>{f.q}</span>
              <svg
                className="w-4 h-4 text-muted shrink-0 transition-transform group-open:rotate-180"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="text-secondary text-sm leading-relaxed mt-3">{f.a}</p>
          </details>
        ))}
      </div>

      <p className="text-sm text-muted">
        Can’t find what you need?{' '}
        <Link to="/contact" className="text-accent hover:underline">Contact our team</Link>.
      </p>
    </InfoLayout>
  );
}
