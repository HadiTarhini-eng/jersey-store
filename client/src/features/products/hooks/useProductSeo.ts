import { useEffect } from 'react';
import type { Product } from '../../../types';

interface ProductSeoInput {
  product:     Product;
  primaryImage?: string;
  price:       number;
  currency:    string;
  inStock:     boolean;
  rating?:     number;
  reviewCount?: number;
}

const JSON_LD_ID = 'product-jsonld';

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Updates document.title, basic OG meta tags, and injects a product JSON-LD
 * blob for crawlers. Effects are reversed (title restored, JSON-LD removed)
 * on unmount.
 */
export function useProductSeo(input: ProductSeoInput | null) {
  useEffect(() => {
    if (!input) return;
    const { product, primaryImage, price, currency, inStock, rating, reviewCount } = input;

    const prevTitle = document.title;
    const description =
      product.shortDescription
      ?? product.fullDescription
      ?? `Shop ${product.title} on the jersey store.`;

    document.title = `${product.title} — Jersey Store`;
    setMeta('description', description);
    setMeta('og:title',       product.title, true);
    setMeta('og:description', description,   true);
    setMeta('og:type',        'product',     true);
    if (primaryImage) setMeta('og:image', primaryImage, true);

    const jsonLd: Record<string, unknown> = {
      '@context':    'https://schema.org',
      '@type':       'Product',
      name:          product.title,
      description,
      sku:           product.id,
      image:         primaryImage ? [primaryImage] : undefined,
      brand:         product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      offers: {
        '@type':         'Offer',
        priceCurrency:   currency,
        price:           price.toFixed(2),
        availability:    inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition:   'https://schema.org/NewCondition',
      },
    };
    if (rating !== undefined && reviewCount !== undefined && reviewCount > 0) {
      jsonLd.aggregateRating = {
        '@type':       'AggregateRating',
        ratingValue:   rating.toFixed(1),
        reviewCount,
      };
    }

    let script = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id   = JSON_LD_ID;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = prevTitle;
      document.getElementById(JSON_LD_ID)?.remove();
    };
  }, [input]);
}
