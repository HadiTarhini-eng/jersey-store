import crypto from 'crypto'
import { db, connection } from './infrastructure/database/db.js'
import { HashPassword } from './utils/hash.js'
import {
  attachments,
  cartItems,
  carts,
  categories,
  categoryTypes,
  offerProducts,
  orderItems,
  orders,
  productAssignedAttributes,
  productAttributeOptions,
  productAttributes,
  productSpecifications,
  productVariants,
  products,
  reviews,
  shippingMethods,
  siteConfig,
  specialOffers,
  uiContent,
  users,
  variantAttributeValues,
} from './infrastructure/database/schema.js'

const id = () => crypto.randomUUID()

const day = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d
}

const adminId = id()
const userAId = id()
const userBId = id()

const attachProductId = id()

const catTypeApparelId = id()
const catTypeAccessoriesId = id()

const catJerseysId = id()
const catShortsId = id()
const catScarvesId = id()

const productHomeJerseyId = id()
const productAwayJerseyId = id()
const productScarfId = id()

const attrSizeId = id()
const attrColorId = id()
const attrMaterialId = id()

const assignedSizeOnHomeJerseyId = id()
const assignedColorOnHomeJerseyId = id()
const assignedSizeOnAwayJerseyId = id()

const optSizeSId = id()
const optSizeMId = id()
const optSizeLId = id()
const optColorRedId = id()
const optColorBlueId = id()
const optAwaySizeMId = id()
const optAwaySizeLId = id()

const variantHomeRedMId = id()
const variantHomeBlueLId = id()
const variantAwayMId = id()
const variantScarfId = id()

const cartAId = id()
const cartItemA1Id = id()
const cartItemA2Id = id()

const orderAId = id()
const orderItemA1Id = id()
const orderItemA2Id = id()

const offerSummerId = id()

try {
  console.log('Seeding users...')
  await db
    .insert(users)
    .values([
      {
        id: adminId,
        firstName: 'Admin',
        lastName: 'Root',
        email: 'admin@jersey.test',
        passwordHash: HashPassword('P@ssw0rd'),
        phone: '+213500000000',
        role: 'Admin',
      },
      {
        id: userAId,
        firstName: 'Alice',
        lastName: 'Martin',
        email: 'alice@jersey.test',
        passwordHash: HashPassword('alice123'),
        phone: '+213500000001',
        role: 'User',
      },
      {
        id: userBId,
        firstName: 'Bob',
        lastName: 'Khan',
        email: 'bob@jersey.test',
        passwordHash: HashPassword('bob12345'),
        phone: '+213500000002',
        role: 'User',
      },
    ])
    .onConflictDoNothing({ target: users.email })

  // Product gallery attachments are seeded AFTER products below (FK depends on
  // product id existing). Inline images (avatars, banners, etc.) are now plain
  // URL columns and stored on the entity row directly.

  console.log('Seeding category types...')
  await db
    .insert(categoryTypes)
    .values([
      {
        id: catTypeApparelId,
        name: 'Apparel',
        slug: 'apparel',
        description: 'Wearable clothing items',
      },
      {
        id: catTypeAccessoriesId,
        name: 'Accessories',
        slug: 'accessories',
        description: 'Supporter accessories and merchandise',
      },
    ])
    .onConflictDoNothing({ target: categoryTypes.slug })

  console.log('Seeding categories...')
  await db
    .insert(categories)
    .values([
      {
        id: catJerseysId,
        categoryTypeId: catTypeApparelId,
        parentId: null,
        name: 'Jerseys',
        slug: 'jerseys',
        description: 'Team jerseys for all clubs',
        imageUrl: null,
      },
      {
        id: catShortsId,
        categoryTypeId: catTypeApparelId,
        parentId: catJerseysId,
        name: 'Shorts',
        slug: 'shorts',
        description: 'Matching shorts',
        imageUrl: null,
      },
      {
        id: catScarvesId,
        categoryTypeId: catTypeAccessoriesId,
        parentId: null,
        name: 'Scarves',
        slug: 'scarves',
        description: 'Team scarves',
        imageUrl: null,
      },
    ])
    .onConflictDoNothing({ target: categories.slug })

  console.log('Seeding products...')
  await db
    .insert(products)
    .values([
      {
        id: productHomeJerseyId,
        categoryId: catJerseysId,
        title: 'Home Jersey 2026',
        slug: 'home-jersey-2026',
        shortDescription: 'Official home jersey for the 2026 season',
        fullDescription: 'Breathable polyester, slim fit, official team crest embroidered.',
        tagsJson: ['football', 'home', '2026', 'official'],
        brand: 'JerseyCo',
        basePrice: '79.99',
        status: 'active',
        featured: true,
        searchVector: 'home jersey 2026 football official',
        createdBy: adminId,
      },
      {
        id: productAwayJerseyId,
        categoryId: catJerseysId,
        title: 'Away Jersey 2026',
        slug: 'away-jersey-2026',
        shortDescription: 'Official away jersey for the 2026 season',
        fullDescription: 'Lightweight away kit, sublimated print, dry-fit fabric.',
        tagsJson: ['football', 'away', '2026'],
        brand: 'JerseyCo',
        basePrice: '74.99',
        status: 'active',
        featured: false,
        searchVector: 'away jersey 2026 football',
        createdBy: adminId,
      },
      {
        id: productScarfId,
        categoryId: catScarvesId,
        title: 'Supporter Scarf',
        slug: 'supporter-scarf',
        shortDescription: 'Classic knitted supporter scarf',
        fullDescription: 'Double-knit acrylic, team colors, fringed ends.',
        tagsJson: ['scarf', 'accessory'],
        brand: 'JerseyCo',
        basePrice: '19.99',
        status: 'active',
        featured: false,
        searchVector: 'scarf supporter',
        createdBy: adminId,
      },
    ])
    .onConflictDoNothing({ target: products.slug })

  console.log('Seeding product attributes...')
  await db
    .insert(productAttributes)
    .values([
      {
        id: attrSizeId,
        name: 'Size',
        slug: 'size',
        type: 'select',
        isVariantable: true,
      },
      {
        id: attrColorId,
        name: 'Color',
        slug: 'color',
        type: 'select',
        isVariantable: true,
      },
      {
        id: attrMaterialId,
        name: 'Material',
        slug: 'material',
        type: 'text',
        isVariantable: false,
      },
    ])
    .onConflictDoNothing({ target: productAttributes.slug })

  console.log('Seeding product assigned attributes...')
  await db
    .insert(productAssignedAttributes)
    .values([
      {
        id: assignedSizeOnHomeJerseyId,
        productId: productHomeJerseyId,
        attributeId: attrSizeId,
        isRequired: true,
        isFilterable: true,
        sortOrder: 1,
      },
      {
        id: assignedColorOnHomeJerseyId,
        productId: productHomeJerseyId,
        attributeId: attrColorId,
        isRequired: true,
        isFilterable: true,
        sortOrder: 2,
      },
      {
        id: assignedSizeOnAwayJerseyId,
        productId: productAwayJerseyId,
        attributeId: attrSizeId,
        isRequired: true,
        isFilterable: true,
        sortOrder: 1,
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding product attribute options...')
  await db
    .insert(productAttributeOptions)
    .values([
      {
        id: optSizeSId,
        productAssignedAttributeId: assignedSizeOnHomeJerseyId,
        value: 'S',
        metaData: { measurement: 'small' },
        sortOrder: 1,
      },
      {
        id: optSizeMId,
        productAssignedAttributeId: assignedSizeOnHomeJerseyId,
        value: 'M',
        metaData: { measurement: 'medium' },
        sortOrder: 2,
      },
      {
        id: optSizeLId,
        productAssignedAttributeId: assignedSizeOnHomeJerseyId,
        value: 'L',
        metaData: { measurement: 'large' },
        sortOrder: 3,
      },
      {
        id: optColorRedId,
        productAssignedAttributeId: assignedColorOnHomeJerseyId,
        value: 'Red',
        metaData: { hex: '#cc0000' },
        sortOrder: 1,
      },
      {
        id: optColorBlueId,
        productAssignedAttributeId: assignedColorOnHomeJerseyId,
        value: 'Blue',
        metaData: { hex: '#003399' },
        sortOrder: 2,
      },
      {
        id: optAwaySizeMId,
        productAssignedAttributeId: assignedSizeOnAwayJerseyId,
        value: 'M',
        metaData: { measurement: 'medium' },
        sortOrder: 1,
      },
      {
        id: optAwaySizeLId,
        productAssignedAttributeId: assignedSizeOnAwayJerseyId,
        value: 'L',
        metaData: { measurement: 'large' },
        sortOrder: 2,
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding product specifications...')
  await db
    .insert(productSpecifications)
    .values([
      {
        productId: productHomeJerseyId,
        attributeId: attrMaterialId,
        value: '100% polyester',
      },
      {
        productId: productAwayJerseyId,
        attributeId: attrMaterialId,
        value: '92% polyester, 8% elastane',
      },
      {
        productId: productScarfId,
        attributeId: attrMaterialId,
        value: '100% acrylic',
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding product variants...')
  await db
    .insert(productVariants)
    .values([
      {
        id: variantHomeRedMId,
        productId: productHomeJerseyId,
        sku: 'HJ-2026-RED-M',
        priceOverride: null,
        stockQuantity: 25,
        imageUrl: 'https://cdn.example.com/products/home-jersey.webp',
      },
      {
        id: variantHomeBlueLId,
        productId: productHomeJerseyId,
        sku: 'HJ-2026-BLUE-L',
        priceOverride: '84.99',
        stockQuantity: 10,
        imageUrl: null,
      },
      {
        id: variantAwayMId,
        productId: productAwayJerseyId,
        sku: 'AJ-2026-M',
        priceOverride: null,
        stockQuantity: 30,
        imageUrl: null,
      },
      {
        id: variantScarfId,
        productId: productScarfId,
        sku: 'SC-CLASSIC',
        priceOverride: null,
        stockQuantity: 100,
        imageUrl: null,
      },
    ])
    .onConflictDoNothing({ target: productVariants.sku })

  console.log('Seeding variant attribute values...')
  await db
    .insert(variantAttributeValues)
    .values([
      {
        variantId: variantHomeRedMId,
        attributeId: attrSizeId,
        attributeOptionId: optSizeMId,
      },
      {
        variantId: variantHomeRedMId,
        attributeId: attrColorId,
        attributeOptionId: optColorRedId,
      },
      {
        variantId: variantHomeBlueLId,
        attributeId: attrSizeId,
        attributeOptionId: optSizeLId,
      },
      {
        variantId: variantHomeBlueLId,
        attributeId: attrColorId,
        attributeOptionId: optColorBlueId,
      },
      {
        variantId: variantAwayMId,
        attributeId: attrSizeId,
        attributeOptionId: optAwaySizeMId,
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding carts...')
  await db
    .insert(carts)
    .values([
      {
        id: cartAId,
        userId: userAId,
        status: 'active',
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding cart items...')
  await db
    .insert(cartItems)
    .values([
      {
        id: cartItemA1Id,
        cartId: cartAId,
        productVariantId: variantHomeRedMId,
        quantity: 1,
        priceAtTime: '79.99',
      },
      {
        id: cartItemA2Id,
        cartId: cartAId,
        productVariantId: variantScarfId,
        quantity: 2,
        priceAtTime: '19.99',
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding orders...')
  await db
    .insert(orders)
    .values([
      {
        id: orderAId,
        userId: userBId,
        orderNumber: 'ORD-2026-0001',
        status: 'paid',
        paymentStatus: 'captured',
        subtotal: '154.97',
        discountAmount: '10.00',
        shippingAmount: '5.00',
        totalAmount: '149.97',
        shippingAddress: {
          line1: '12 Rue Didouche Mourad',
          city: 'Algiers',
          country: 'DZ',
          postalCode: '16000',
        },
        billingAddress: {
          line1: '12 Rue Didouche Mourad',
          city: 'Algiers',
          country: 'DZ',
          postalCode: '16000',
        },
        placedAt: day(-3),
      },
    ])
    .onConflictDoNothing({ target: orders.orderNumber })

  console.log('Seeding order items...')
  await db
    .insert(orderItems)
    .values([
      {
        id: orderItemA1Id,
        orderId: orderAId,
        productVariantId: variantHomeBlueLId,
        productTitleSnapshot: 'Home Jersey 2026',
        variantSnapshotJson: { sku: 'HJ-2026-BLUE-L', size: 'L', color: 'Blue' },
        quantity: 1,
        unitPrice: '84.99',
        totalPrice: '84.99',
      },
      {
        id: orderItemA2Id,
        orderId: orderAId,
        productVariantId: variantAwayMId,
        productTitleSnapshot: 'Away Jersey 2026',
        variantSnapshotJson: { sku: 'AJ-2026-M', size: 'M' },
        quantity: 1,
        unitPrice: '74.99',
        totalPrice: '74.99',
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding reviews...')
  await db
    .insert(reviews)
    .values([
      {
        userId: userAId,
        productId: productHomeJerseyId,
        rating: 5,
        title: 'Perfect fit',
        comment: 'Fabric feels premium and sizing is accurate.',
        isVerifiedPurchase: false,
      },
      {
        userId: userBId,
        productId: productHomeJerseyId,
        rating: 4,
        title: 'Looks great',
        comment: 'Color is slightly darker than the photos but still nice.',
        isVerifiedPurchase: true,
      },
      {
        userId: userBId,
        productId: productAwayJerseyId,
        rating: 5,
        title: 'Excellent away kit',
        comment: 'Lightweight and breathable for summer matches.',
        isVerifiedPurchase: true,
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding special offers...')
  await db
    .insert(specialOffers)
    .values([
      {
        id: offerSummerId,
        title: 'Summer Sale 2026',
        description: '20% off selected jerseys for a limited time.',
        discountType: 'percentage',
        discountValue: '20.00',
        startDate: day(-1),
        endDate: day(14),
        bannerUrl: 'https://cdn.example.com/banners/summer-sale.webp',
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding offer products...')
  await db
    .insert(offerProducts)
    .values([
      { offerId: offerSummerId, productId: productHomeJerseyId },
      { offerId: offerSummerId, productId: productAwayJerseyId },
    ])
    .onConflictDoNothing()

  console.log('Seeding site config...')
  await db
    .insert(siteConfig)
    .values([
      {
        slug: 'default',
        name: 'Jerseys4Ever',
        tagline: 'Wear What You Live',
        description: 'Premium authentic jerseys and sportswear from the world\'s greatest clubs and teams.',
        email: 'support@jerseys4ever.com',
        phone: '+1 (800) 555-0199',
        currency: 'USD',
        freeShippingThreshold: '100',
        socialLinks: {
          instagram: 'https://instagram.com/jerseys4ever',
          twitter: 'https://twitter.com/jerseys4ever',
          facebook: 'https://facebook.com/jerseys4ever',
          youtube: 'https://youtube.com/jerseys4ever',
        },
      },
    ])
    .onConflictDoNothing({ target: siteConfig.slug })

  console.log('Seeding shipping methods...')
  await db
    .insert(shippingMethods)
    .values([
      { name: 'Standard',  description: '4-7 business days', baseRate: '5.00',  freeShippingThreshold: '100', estimatedDaysMin: 4, estimatedDaysMax: 7, sortOrder: 0 },
      { name: 'Express',   description: '2-3 business days', baseRate: '15.00', freeShippingThreshold: null,  estimatedDaysMin: 2, estimatedDaysMax: 3, sortOrder: 1 },
      { name: 'Overnight', description: 'Next business day', baseRate: '30.00', freeShippingThreshold: null,  estimatedDaysMin: 1, estimatedDaysMax: 1, sortOrder: 2 },
    ])
    .onConflictDoNothing()

  console.log('Seeding ui-content: sports...')
  await db
    .insert(uiContent)
    .values([
      { slot: 'sport', sortOrder: 0, payload: { name: 'Football',          slug: 'football',          icon: '⚽', color: '#007aff', featured: true } },
      { slot: 'sport', sortOrder: 1, payload: { name: 'Basketball',        slug: 'basketball',        icon: '🏀', color: '#ff9f0a', featured: true } },
      { slot: 'sport', sortOrder: 2, payload: { name: 'American Football', slug: 'american-football', icon: '🏈', color: '#34c759', featured: true } },
      { slot: 'sport', sortOrder: 3, payload: { name: 'Baseball',          slug: 'baseball',          icon: '⚾', color: '#ff2d55', featured: false } },
      { slot: 'sport', sortOrder: 4, payload: { name: 'Formula 1',         slug: 'formula1',          icon: '🏎', color: '#af52de', featured: true } },
    ])
    .onConflictDoNothing()

  console.log('Seeding ui-content: teams...')
  await db
    .insert(uiContent)
    .values([
      { slot: 'team', sortOrder: 0, payload: { name: 'Real Madrid',         slug: 'real-madrid',       sport: 'football',          country: 'Spain',   color: '#ffffff', colorSecondary: '#ffd700', abbreviation: 'RMA' } },
      { slot: 'team', sortOrder: 1, payload: { name: 'FC Barcelona',        slug: 'fc-barcelona',      sport: 'football',          country: 'Spain',   color: '#a50044', colorSecondary: '#004d98', abbreviation: 'FCB' } },
      { slot: 'team', sortOrder: 2, payload: { name: 'Manchester City',     slug: 'manchester-city',   sport: 'football',          country: 'England', color: '#6cabdd', colorSecondary: '#1c2c5b', abbreviation: 'MCI' } },
      { slot: 'team', sortOrder: 3, payload: { name: 'Manchester United',   slug: 'manchester-united', sport: 'football',          country: 'England', color: '#da020e', colorSecondary: '#fbe122', abbreviation: 'MUN' } },
      { slot: 'team', sortOrder: 4, payload: { name: 'Paris Saint-Germain', slug: 'psg',               sport: 'football',          country: 'France',  color: '#004170', colorSecondary: '#da291c', abbreviation: 'PSG' } },
      { slot: 'team', sortOrder: 5, payload: { name: 'LA Lakers',           slug: 'la-lakers',         sport: 'basketball',        country: 'USA',     color: '#552583', colorSecondary: '#fdb927', abbreviation: 'LAL' } },
      { slot: 'team', sortOrder: 6, payload: { name: 'Chicago Bulls',       slug: 'chicago-bulls',     sport: 'basketball',        country: 'USA',     color: '#ce1141', colorSecondary: '#000000', abbreviation: 'CHI' } },
      { slot: 'team', sortOrder: 7, payload: { name: 'New England Patriots',slug: 'patriots',          sport: 'american-football', country: 'USA',     color: '#002244', colorSecondary: '#c60c30', abbreviation: 'NE'  } },
      { slot: 'team', sortOrder: 8, payload: { name: 'Scuderia Ferrari',    slug: 'ferrari',           sport: 'formula1',          country: 'Italy',   color: '#dc0000', colorSecondary: '#fff200', abbreviation: 'SF'  } },
    ])
    .onConflictDoNothing()

  console.log('Seeding ui-content: kit-categories...')
  await db
    .insert(uiContent)
    .values([
      { slot: 'kit-category', sortOrder: 0, payload: { name: 'Jerseys',  slug: 'jerseys',  description: 'Authentic match & replica jerseys', color: '#007aff', colorDark: '#0055cc' } },
      { slot: 'kit-category', sortOrder: 1, payload: { name: 'Shorts',   slug: 'shorts',   description: 'Performance match shorts',          color: '#ff4d00', colorDark: '#cc3d00' } },
      { slot: 'kit-category', sortOrder: 2, payload: { name: 'T-Shirts', slug: 'tshirts',  description: 'Casual & training tees',             color: '#34c759', colorDark: '#28a046' } },
      { slot: 'kit-category', sortOrder: 3, payload: { name: 'Hoodies',  slug: 'hoodies',  description: 'Premium team hoodies & sweatshirts', color: '#ff9f0a', colorDark: '#cc7d00' } },
      { slot: 'kit-category', sortOrder: 4, payload: { name: 'Jackets',  slug: 'jackets',  description: 'Training & team track jackets',      color: '#af52de', colorDark: '#8a3fb2' } },
      { slot: 'kit-category', sortOrder: 5, payload: { name: 'Shoes',    slug: 'shoes',    description: 'Official team footwear',             color: '#ff2d55', colorDark: '#cc2244' } },
    ])
    .onConflictDoNothing()

  console.log('Seeding ui-content: hero slides...')
  await db
    .insert(uiContent)
    .values([
      { slot: 'hero-slide', sortOrder: 0, payload: { headline: 'Wear\nThe Game.',           subheadline: 'Match-day kit, engineered to live every minute of the ninety.', ctaLabel: 'Shop New Season', ctaHref: '/shop?badge=New',     badge: 'Match Day', accent: '#007aff', align: 'left',   overlay: 'left',   image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1600&q=80' } },
      { slot: 'hero-slide', sortOrder: 1, payload: { headline: 'Built For\nGreatness.',     subheadline: 'Trophy-grade craftsmanship. Worn by champions, kept forever.',    ctaLabel: 'Shop Limited',    ctaHref: '/shop?badge=Limited', badge: 'Heritage',  accent: '#ffd700', align: 'center', overlay: 'bottom', image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1600&q=80' } },
      { slot: 'hero-slide', sortOrder: 2, payload: { headline: 'Every Jersey\nTells A Story.', subheadline: 'Behind every crest, a moment. Behind every number, a name.', ctaLabel: 'Discover Classics', ctaHref: '/shop',             badge: 'Iconic',    accent: '#ff9f0a', align: 'right',  overlay: 'right',  image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80' } },
    ])
    .onConflictDoNothing()

  console.log('Seeding ui-content: offer banners...')
  await db
    .insert(uiContent)
    .values([
      { slot: 'offer-banner', sortOrder: 0, payload: { label: 'Summer Sale',     headline: 'Up To 40% Off',         subheadline: 'On selected football & basketball jerseys', ctaLabel: 'Shop Sale',    ctaHref: '/shop?badge=Sale',    color: '#ff4d00', image: 'https://loremflickr.com/1200/400/soccer?lock=601' } },
      { slot: 'offer-banner', sortOrder: 1, payload: { label: 'New Arrivals',    headline: '2024/25 Season Kits',   subheadline: 'Fresh from the training ground to your wardrobe', ctaLabel: 'Explore New', ctaHref: '/shop?badge=New',    color: '#007aff', image: 'https://loremflickr.com/1200/400/basketball?lock=602' } },
      { slot: 'offer-banner', sortOrder: 2, payload: { label: 'Limited Edition', headline: 'PSG × Jordan Collab',   subheadline: 'Collector\'s piece — only a few left',         ctaLabel: 'Get Yours',   ctaHref: '/shop?badge=Limited',color: '#af52de', image: 'https://loremflickr.com/1200/400/sport?lock=603' } },
    ])
    .onConflictDoNothing()

  console.log('Seeding product gallery attachments...')
  await db
    .insert(attachments)
    .values([
      {
        id: attachProductId,
        productId: productHomeJerseyId,
        fileName: 'home-jersey.jpg',
        fileUrl: 'https://cdn.example.com/products/home-jersey.jpg',
        compressedFileUrl: 'https://cdn.example.com/products/home-jersey.webp',
        mimeType: 'image/jpeg',
        fileSize: 184_320,
        sortOrder: 0,
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding complete.')
} catch (err) {
  console.error('Seeding failed:', err)
  process.exit(1)
} finally {
  await connection.end()
}
