import crypto from 'crypto'
import { inArray } from 'drizzle-orm'
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

// Local asset paths — populated by scripts/download-seed-images.ps1 into
// client/public/seed-images/, served at the site root by Vite/the SPA host.
const IMG = (file: string) => `/seed-images/${file}`

const id = () => crypto.randomUUID()
const day = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d
}

// ─── User ids ────────────────────────────────────────────────────────────────
const adminId = id()
const aliceId = id()
const bobId   = id()
const carlosId = id()
const dinaId  = id()

// ─── Category-type / category ids ────────────────────────────────────────────
const catTypeApparelId = id()
const catTypeAccessoriesId = id() // reserved for future expansion, kept so the
                                  // admin UI still has both types to manage.

const catJerseysId      = id()
const catShortsId       = id()
const catHoodiesId      = id()
const catTrainingKitsId = id()

// ─── Attribute ids ───────────────────────────────────────────────────────────
const attrSizeId     = id()
const attrColorId    = id()
const attrMaterialId = id()

// ─── Special offer ids ───────────────────────────────────────────────────────
const offerWorldCupId    = id()
const offerFirstOrderId  = id()
const offerFreeShipId    = id()

// ─────────────────────────────────────────────────────────────────────────────
// Product catalog
//
// Every jersey-style product is anchored to a real team and uses that team's
// crest as its primary gallery image, guaranteeing that the visual on screen
// always reflects the product title. Prices are intentionally compressed into
// the $15–$30 demo band per requirements.
// ─────────────────────────────────────────────────────────────────────────────

type SeedProduct = {
  slug:        string
  title:       string
  category:    'jerseys' | 'shorts' | 'hoodies' | 'training-kits'
  team?:       string                          // slug of related team — drives crest image
  sport:       'football' | 'basketball' | 'gym'
  brand:       string
  basePrice:   string                          // numeric column → use string
  featured:    boolean
  shortDesc:   string
  fullDesc:    string
  tags:        string[]
  galleryImg:  string                          // primary attachment URL
  secondaryImg?: string                        // optional second attachment
  material:    string
  sizes:       string[]                        // S/M/L style sizes for variants
  colors?:     { name: string; hex: string }[] // omit if product isn't color-varied
  rating:      number                          // surfaces via review seeds below
  /** When true, the storefront exposes custom name/number inputs on the detail page. */
  printable?:  boolean
  /** MSRP — when set, the storefront shows it struck-through next to basePrice. */
  compareAtPrice?: string
}

const CATALOG: SeedProduct[] = [
  // ── Football jerseys ──────────────────────────────────────────────────────
  {
    slug: 'real-madrid-home-jersey-2025-26',
    title: 'Real Madrid Home Jersey 2025/26',
    category: 'jerseys', team: 'real-madrid', sport: 'football',
    brand: 'adidas', basePrice: '29.99', featured: true,
    shortDesc: 'Iconic all-white Los Blancos home kit for the 2025/26 season.',
    fullDesc: 'Crafted from breathable AEROREADY fabric, the Real Madrid home jersey carries the embroidered crest, club gold trim, and a slim athletic cut built for ninety minutes of run.',
    tags: ['football', 'la-liga', 'real-madrid', 'home', '2025-26'],
    galleryImg: IMG('team-real-madrid.png'),
    material: '100% recycled polyester',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'White', hex: '#ffffff' }],
    rating: 4.8,
    printable: true,
    compareAtPrice: '39.99',
  },
  {
    slug: 'fc-barcelona-home-jersey-2025-26',
    title: 'FC Barcelona Home Jersey 2025/26',
    category: 'jerseys', team: 'fc-barcelona', sport: 'football',
    brand: 'Nike', basePrice: '29.99', featured: true,
    shortDesc: 'Blaugrana stripes return — Camp Nou ready.',
    fullDesc: 'Dri-FIT ADV engineered mesh keeps you cool while the classic blaugrana stripes and FCB crest deliver pure Catalan heritage.',
    tags: ['football', 'la-liga', 'barcelona', 'home', '2025-26'],
    galleryImg: IMG('team-barcelona.png'),
    material: '92% polyester, 8% elastane',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Blaugrana', hex: '#a50044' }],
    rating: 4.7,
    printable: true,
  },
  {
    slug: 'manchester-city-home-jersey-2025-26',
    title: 'Manchester City Home Jersey 2025/26',
    category: 'jerseys', team: 'manchester-city', sport: 'football',
    brand: 'Puma', basePrice: '27.99', featured: true,
    shortDesc: 'Sky-blue Etihad home kit, ready for the treble chase.',
    fullDesc: 'Premium dryCELL technology paired with the City crest in metallic gold finish — built for the modern game.',
    tags: ['football', 'premier-league', 'manchester-city', 'home'],
    galleryImg: IMG('team-man-city.png'),
    material: '100% polyester (dryCELL)',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Sky Blue', hex: '#6cabdd' }],
    rating: 4.6,
  },
  {
    slug: 'manchester-united-home-jersey-2025-26',
    title: 'Manchester United Home Jersey 2025/26',
    category: 'jerseys', team: 'manchester-united', sport: 'football',
    brand: 'adidas', basePrice: '25.99', featured: false,
    shortDesc: 'Old Trafford red — the most-worn shirt in football.',
    fullDesc: 'Classic Manchester United red with embroidered devil crest. Lightweight AEROREADY mesh keeps it match-day ready.',
    tags: ['football', 'premier-league', 'manchester-united', 'home'],
    galleryImg: IMG('team-man-united.png'),
    material: '100% recycled polyester',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'United Red', hex: '#da020e' }],
    rating: 4.5,
  },
  {
    slug: 'liverpool-home-jersey-2025-26',
    title: 'Liverpool Home Jersey 2025/26',
    category: 'jerseys', team: 'liverpool', sport: 'football',
    brand: 'Nike', basePrice: '27.99', featured: true,
    shortDesc: 'Anfield red, You\'ll Never Walk Alone.',
    fullDesc: 'Authentic Reds home kit with classic liver bird crest. Dri-FIT engineered for the Kop and the away end.',
    tags: ['football', 'premier-league', 'liverpool', 'home'],
    galleryImg: IMG('team-liverpool.png'),
    material: '100% recycled polyester',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Reds Red', hex: '#c8102e' }],
    rating: 4.8,
  },
  {
    slug: 'psg-home-jersey-2025-26',
    title: 'Paris Saint-Germain Home Jersey 2025/26',
    category: 'jerseys', team: 'psg', sport: 'football',
    brand: 'Nike', basePrice: '26.99', featured: true,
    shortDesc: 'Parisian elegance — Ligue 1 champions home kit.',
    fullDesc: 'Tonal Hechter stripe, embroidered PSG crest and Dri-FIT ADV finish — a kit as bold as the city itself.',
    tags: ['football', 'ligue-1', 'psg', 'paris', 'home'],
    galleryImg: IMG('team-psg.png'),
    material: '88% polyester, 12% elastane',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'PSG Navy', hex: '#004170' }],
    rating: 4.7,
  },
  {
    slug: 'bayern-munich-home-jersey-2025-26',
    title: 'Bayern Munich Home Jersey 2025/26',
    category: 'jerseys', team: 'bayern-munich', sport: 'football',
    brand: 'adidas', basePrice: '26.99', featured: false,
    shortDesc: 'Mia san mia — Bavarian red home kit.',
    fullDesc: 'Deep FCB red with rhombus pattern shoulders and embroidered crest. AEROREADY moisture management throughout.',
    tags: ['football', 'bundesliga', 'bayern-munich', 'home'],
    galleryImg: IMG('team-bayern.png'),
    material: '100% recycled polyester',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'FCB Red', hex: '#dc052d' }],
    rating: 4.6,
  },
  {
    slug: 'juventus-home-jersey-2025-26',
    title: 'Juventus Home Jersey 2025/26',
    category: 'jerseys', team: 'juventus', sport: 'football',
    brand: 'adidas', basePrice: '25.99', featured: false,
    shortDesc: 'La Vecchia Signora returns — the iconic bianconeri stripes.',
    fullDesc: 'Black-and-white stripes with a refined crest treatment. Slim athletic cut, AEROREADY breathable mesh.',
    tags: ['football', 'serie-a', 'juventus', 'turin', 'home'],
    galleryImg: IMG('team-juventus.png'),
    material: '100% recycled polyester',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Bianconero', hex: '#000000' }],
    rating: 4.5,
  },

  // ── Basketball jerseys ────────────────────────────────────────────────────
  {
    slug: 'la-lakers-home-jersey-2025',
    title: 'Los Angeles Lakers Home Jersey',
    category: 'jerseys', team: 'la-lakers', sport: 'basketball',
    brand: 'Nike', basePrice: '29.99', featured: true,
    shortDesc: 'Showtime gold — official Lakers home jersey.',
    fullDesc: 'Authentic NBA cut with bold Lakers tip-off colors. Lightweight, breathable mesh built for the hardwood.',
    tags: ['basketball', 'nba', 'lakers', 'los-angeles'],
    galleryImg: IMG('team-lakers.png'),
    material: '100% polyester mesh',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Lakers Gold', hex: '#fdb927' }],
    rating: 4.8,
  },
  {
    slug: 'chicago-bulls-classic-jersey',
    title: 'Chicago Bulls Classic Home Jersey',
    category: 'jerseys', team: 'chicago-bulls', sport: 'basketball',
    brand: 'Nike', basePrice: '28.99', featured: true,
    shortDesc: 'The most iconic red in basketball history.',
    fullDesc: 'Tribute to the dynasty era — Bulls red with black piping and the unmistakable Chicago wordmark.',
    tags: ['basketball', 'nba', 'bulls', 'chicago', 'classic'],
    galleryImg: IMG('team-bulls.png'),
    material: '100% polyester mesh',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Bulls Red', hex: '#ce1141' }],
    rating: 4.9,
  },
  {
    slug: 'golden-state-warriors-jersey',
    title: 'Golden State Warriors Home Jersey',
    category: 'jerseys', team: 'golden-state-warriors', sport: 'basketball',
    brand: 'Nike', basePrice: '27.99', featured: false,
    shortDesc: 'Bay Area royal blue and California gold.',
    fullDesc: 'Dub Nation\'s home jersey with the iconic Bay Bridge silhouette stitched front and center.',
    tags: ['basketball', 'nba', 'warriors', 'golden-state'],
    galleryImg: IMG('team-warriors.png'),
    material: '100% polyester mesh',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Royal Blue', hex: '#1d428a' }],
    rating: 4.7,
  },
  {
    slug: 'boston-celtics-home-jersey',
    title: 'Boston Celtics Home Jersey',
    category: 'jerseys', team: 'boston-celtics', sport: 'basketball',
    brand: 'Nike', basePrice: '27.99', featured: false,
    shortDesc: 'TD Garden green — eighteen banners and counting.',
    fullDesc: 'Classic Celtics white home jersey with the kelly-green Lucky the Leprechaun mark. Authentic NBA cut.',
    tags: ['basketball', 'nba', 'celtics', 'boston'],
    galleryImg: IMG('team-celtics.png'),
    material: '100% polyester mesh',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Celtics Green', hex: '#007a33' }],
    rating: 4.7,
  },

  // ── Hoodies ───────────────────────────────────────────────────────────────
  {
    slug: 'real-madrid-performance-hoodie',
    title: 'Real Madrid Performance Hoodie',
    category: 'hoodies', team: 'real-madrid', sport: 'football',
    brand: 'adidas', basePrice: '24.99', featured: true,
    shortDesc: 'Travel-day hoodie, training-day comfort.',
    fullDesc: 'Soft-brushed fleece interior with bonded zipper details. Embroidered Real Madrid crest at chest, two-tone hood lining.',
    tags: ['hoodie', 'football', 'real-madrid', 'training'],
    galleryImg: IMG('team-real-madrid.png'),
    secondaryImg: IMG('cat-hoodies.jpg'),
    material: '80% cotton, 20% recycled polyester',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Royal Navy', hex: '#1a2a6c' }],
    rating: 4.6,
  },
  {
    slug: 'lakers-showtime-hoodie',
    title: 'Lakers Showtime Hoodie',
    category: 'hoodies', team: 'la-lakers', sport: 'basketball',
    brand: 'Nike', basePrice: '23.99', featured: false,
    shortDesc: 'Pre-game tunnel fit, Showtime energy.',
    fullDesc: 'Heavyweight fleece with Lakers purple-and-gold colorblock. Embroidered logo, ribbed cuffs and hem.',
    tags: ['hoodie', 'basketball', 'lakers', 'nba'],
    galleryImg: IMG('team-lakers.png'),
    secondaryImg: IMG('cat-hoodies.jpg'),
    material: '70% cotton, 30% polyester',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Lakers Purple', hex: '#552583' }],
    rating: 4.5,
  },

  // ── Shorts ────────────────────────────────────────────────────────────────
  {
    slug: 'psg-training-shorts',
    title: 'PSG Training Shorts',
    category: 'shorts', team: 'psg', sport: 'football',
    brand: 'Nike', basePrice: '17.99', featured: false,
    shortDesc: 'Lightweight training shorts for the long sessions.',
    fullDesc: 'Quick-drying Dri-FIT shell with elastic waistband, side pockets, and embroidered PSG crest at the left thigh.',
    tags: ['shorts', 'football', 'psg', 'training'],
    galleryImg: IMG('team-psg.png'),
    secondaryImg: IMG('cat-shorts.jpg'),
    material: '100% polyester (Dri-FIT)',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'PSG Navy', hex: '#004170' }],
    rating: 4.4,
  },
  {
    slug: 'bulls-practice-shorts',
    title: 'Chicago Bulls Practice Shorts',
    category: 'shorts', team: 'chicago-bulls', sport: 'basketball',
    brand: 'Nike', basePrice: '16.99', featured: false,
    shortDesc: 'Court-ready practice shorts with a tribute to the dynasty.',
    fullDesc: 'Mesh side panels, ten-inch inseam, and Bulls logo print at the hip. Built for shoot-arounds and full-court runs alike.',
    tags: ['shorts', 'basketball', 'bulls', 'practice'],
    galleryImg: IMG('team-bulls.png'),
    secondaryImg: IMG('cat-shorts.jpg'),
    material: '100% polyester mesh',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Bulls Red', hex: '#ce1141' }],
    rating: 4.3,
  },

  // ── Training kits ─────────────────────────────────────────────────────────
  {
    slug: 'football-pro-training-kit',
    title: 'Football Pro Training Kit',
    category: 'training-kits', sport: 'football',
    brand: 'adidas', basePrice: '24.99', featured: true,
    shortDesc: 'Full kit: shirt, shorts, and socks ready for the pitch.',
    fullDesc: 'A three-piece training set with breathable mesh inserts, secure-fit elastic, and a clean modern silhouette. Designed for the daily grind, not just match-day.',
    tags: ['training', 'football', 'set', 'kit'],
    galleryImg: IMG('cat-training.jpg'),
    secondaryImg: IMG('sport-football.jpg'),
    material: '100% recycled polyester',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Black', hex: '#0a0a0a' },
      { name: 'Royal Blue', hex: '#1d428a' },
    ],
    rating: 4.5,
  },
  {
    slug: 'gym-performance-kit',
    title: 'Gym Performance Training Kit',
    category: 'training-kits', sport: 'gym',
    brand: 'Nike', basePrice: '19.99', featured: false,
    shortDesc: 'Tee + shorts for serious gym days.',
    fullDesc: 'Sweat-wicking Dri-FIT tee with a relaxed-fit short. Reflective trim, gusseted gusset for full range of motion.',
    tags: ['training', 'gym', 'fitness', 'set'],
    galleryImg: IMG('sport-gym.jpg'),
    secondaryImg: IMG('cat-training.jpg'),
    material: '88% polyester, 12% elastane',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Charcoal', hex: '#3a3a3a' },
      { name: 'Volt', hex: '#cdfa1e' },
    ],
    rating: 4.4,
  },
]

// Build a slug → id map up front so every downstream insert can reference
// products without juggling separate constants.
const productIds = new Map<string, string>(CATALOG.map((p) => [p.slug, id()]))
const categoryIdBySlug = {
  jerseys:         catJerseysId,
  shorts:          catShortsId,
  hoodies:         catHoodiesId,
  'training-kits': catTrainingKitsId,
} as const

try {
  console.log('Seeding users...')
  await db
    .insert(users)
    .values([
      { id: adminId,  firstName: 'Admin',  lastName: 'Root',    email: 'admin@jersey.test',  passwordHash: HashPassword('P@ssw0rd'), phone: '+1 (800) 555-0100', role: 'Admin' },
      { id: aliceId,  firstName: 'Alice',  lastName: 'Martin',  email: 'alice@jersey.test',  passwordHash: HashPassword('alice123'), phone: '+1 (555) 010-0001', role: 'User' },
      { id: bobId,    firstName: 'Bob',    lastName: 'Khan',    email: 'bob@jersey.test',    passwordHash: HashPassword('bob12345'), phone: '+1 (555) 010-0002', role: 'User' },
      { id: carlosId, firstName: 'Carlos', lastName: 'Mendes',  email: 'carlos@jersey.test', passwordHash: HashPassword('carlos1!'), phone: '+1 (555) 010-0003', role: 'User' },
      { id: dinaId,   firstName: 'Dina',   lastName: 'Okafor',  email: 'dina@jersey.test',   passwordHash: HashPassword('dina4567'), phone: '+1 (555) 010-0004', role: 'User' },
    ])
    .onConflictDoNothing({ target: users.email })

  console.log('Seeding category types...')
  await db
    .insert(categoryTypes)
    .values([
      { id: catTypeApparelId,     name: 'Apparel',     slug: 'apparel',     description: 'Wearable clothing items' },
      { id: catTypeAccessoriesId, name: 'Accessories', slug: 'accessories', description: 'Supporter accessories and merchandise' },
    ])
    .onConflictDoNothing({ target: categoryTypes.slug })

  console.log('Seeding categories...')
  await db
    .insert(categories)
    .values([
      { id: catJerseysId,      categoryTypeId: catTypeApparelId, parentId: null, name: 'Jerseys',       slug: 'jerseys',       description: 'Authentic match & replica jerseys', imageUrl: IMG('cat-jerseys.jpg')  },
      { id: catShortsId,       categoryTypeId: catTypeApparelId, parentId: null, name: 'Shorts',        slug: 'shorts',        description: 'Performance match & training shorts', imageUrl: IMG('cat-shorts.jpg')   },
      { id: catHoodiesId,      categoryTypeId: catTypeApparelId, parentId: null, name: 'Hoodies',       slug: 'hoodies',       description: 'Premium team hoodies & sweatshirts', imageUrl: IMG('cat-hoodies.jpg')  },
      { id: catTrainingKitsId, categoryTypeId: catTypeApparelId, parentId: null, name: 'Training Kits', slug: 'training-kits', description: 'Complete sets for the daily grind',  imageUrl: IMG('cat-training.jpg') },
    ])
    .onConflictDoNothing({ target: categories.slug })

  console.log('Seeding product attributes...')
  await db
    .insert(productAttributes)
    .values([
      { id: attrSizeId,     name: 'Size',     slug: 'size',     type: 'select', isVariantable: true  },
      { id: attrColorId,    name: 'Color',    slug: 'color',    type: 'select', isVariantable: true  },
      { id: attrMaterialId, name: 'Material', slug: 'material', type: 'text',   isVariantable: false },
    ])
    .onConflictDoNothing({ target: productAttributes.slug })

  // ─── Products ─────────────────────────────────────────────────────────────
  console.log(`Seeding ${CATALOG.length} products...`)
  await db
    .insert(products)
    .values(
      CATALOG.map((p) => ({
        id:               productIds.get(p.slug)!,
        categoryId:       categoryIdBySlug[p.category],
        title:            p.title,
        slug:             p.slug,
        shortDescription: p.shortDesc,
        fullDescription:  p.fullDesc,
        // Encode sport/team as `key:slug` meta tags (the same wire format the
        // admin product form uses) so the storefront filters, breadcrumbs and
        // admin list all resolve them. Plain descriptive tags follow.
        tagsJson:         [
          `sport:${p.sport}`,
          ...(p.team ? [`team:${p.team}`] : []),
          ...p.tags,
        ],
        brand:            p.brand,
        basePrice:        p.basePrice,
        compareAtPrice:   p.compareAtPrice ?? null,
        printable:        p.printable ?? false,
        status:           'active' as const,
        featured:         p.featured,
        searchVector:     [p.title, p.brand, p.team ?? '', p.sport, ...p.tags].join(' ').toLowerCase(),
        createdBy:        adminId,
      })),
    )
    .onConflictDoNothing({ target: products.slug })

  // ─── Gallery attachments — one or two per product ─────────────────────────
  console.log('Seeding product gallery attachments...')
  const attachmentRows = CATALOG.flatMap((p) => {
    const pid = productIds.get(p.slug)!
    const primary = {
      id: id(),
      productId: pid,
      fileName: p.galleryImg.split('/').pop()!,
      fileUrl: p.galleryImg,
      compressedFileUrl: p.galleryImg,
      mimeType: p.galleryImg.endsWith('.png') ? 'image/png' : 'image/jpeg',
      fileSize: 160_000,
      sortOrder: 0,
    }
    if (!p.secondaryImg) return [primary]
    return [
      primary,
      {
        id: id(),
        productId: pid,
        fileName: p.secondaryImg.split('/').pop()!,
        fileUrl: p.secondaryImg,
        compressedFileUrl: p.secondaryImg,
        mimeType: 'image/jpeg',
        fileSize: 220_000,
        sortOrder: 1,
      },
    ]
  })
  await db.insert(attachments).values(attachmentRows).onConflictDoNothing()

  // ─── Specifications (material) ────────────────────────────────────────────
  console.log('Seeding product specifications...')
  await db
    .insert(productSpecifications)
    .values(
      CATALOG.map((p) => ({
        productId:   productIds.get(p.slug)!,
        attributeId: attrMaterialId,
        value:       p.material,
      })),
    )
    .onConflictDoNothing()

  // ─── Variants — Size × Color matrix per product ───────────────────────────
  // For every product we (a) register Size and (optionally) Color as assigned
  // attributes, (b) insert the per-product option rows, and (c) materialize
  // one variant per cell of the (size × color) matrix.
  console.log('Seeding product assigned attributes, options, variants...')

  type VariantSeed = {
    variantId:   string
    productSlug: string
    sku:         string
    sizeOptId:   string
    colorOptId?: string
    stock:       number
    priceOver?:  string | null
    imageUrl?:   string | null
  }

  const assignedRows: typeof productAssignedAttributes.$inferInsert[]   = []
  const optionRows:   typeof productAttributeOptions.$inferInsert[]     = []
  const variantRows:  typeof productVariants.$inferInsert[]             = []
  const vavRows:      typeof variantAttributeValues.$inferInsert[]      = []

  const allVariants: VariantSeed[] = []

  CATALOG.forEach((p) => {
    const pid = productIds.get(p.slug)!
    const sizeAssignedId  = id()
    const colorAssignedId = p.colors ? id() : null

    assignedRows.push({
      id:           sizeAssignedId,
      productId:    pid,
      attributeId:  attrSizeId,
      isRequired:   true,
      isFilterable: true,
      sortOrder:    1,
    })
    if (colorAssignedId) {
      assignedRows.push({
        id:           colorAssignedId,
        productId:    pid,
        attributeId:  attrColorId,
        isRequired:   true,
        isFilterable: true,
        sortOrder:    2,
      })
    }

    // One option row per size, scoped to *this* assigned attribute.
    const sizeOptIds = new Map<string, string>()
    p.sizes.forEach((s, i) => {
      const oid = id()
      sizeOptIds.set(s, oid)
      optionRows.push({
        id:                         oid,
        productAssignedAttributeId: sizeAssignedId,
        value:                      s,
        metaData:                   { sortIndex: i },
        sortOrder:                  i + 1,
      })
    })

    const colorOptIds = new Map<string, string>()
    if (colorAssignedId && p.colors) {
      p.colors.forEach((c, i) => {
        const oid = id()
        colorOptIds.set(c.name, oid)
        optionRows.push({
          id:                         oid,
          productAssignedAttributeId: colorAssignedId,
          value:                      c.name,
          metaData:                   { hex: c.hex },
          sortOrder:                  i + 1,
        })
      })
    }

    // Build the variant grid. If no colors, just one row per size.
    const colorCells = p.colors && p.colors.length
      ? p.colors
      : [{ name: '__none__', hex: '' }]

    p.sizes.forEach((size) => {
      colorCells.forEach((color) => {
        const variantId = id()
        const skuParts  = [p.slug.split('-').slice(0, 3).join('-').toUpperCase(), size]
        if (color.name !== '__none__') skuParts.push(color.name.replace(/\s+/g, '').toUpperCase().slice(0, 6))

        // Deterministic-ish stock spread: S/XL lower, M/L higher.
        const baseStock = size === 'S' || size === 'XL' ? 8 : 20
        const stock     = Math.max(0, baseStock + ((variantId.charCodeAt(0) % 7) - 3))

        const variantRow = {
          id:            variantId,
          productId:     pid,
          sku:           skuParts.join('-'),
          priceOverride: null as string | null,
          stockQuantity: stock,
          imageUrl:      p.galleryImg,
        }
        variantRows.push(variantRow)

        vavRows.push({
          variantId,
          attributeId:       attrSizeId,
          attributeOptionId: sizeOptIds.get(size)!,
        })
        if (color.name !== '__none__' && colorAssignedId) {
          vavRows.push({
            variantId,
            attributeId:       attrColorId,
            attributeOptionId: colorOptIds.get(color.name)!,
          })
        }

        allVariants.push({
          variantId,
          productSlug: p.slug,
          sku:         variantRow.sku,
          sizeOptId:   sizeOptIds.get(size)!,
          colorOptId:  color.name === '__none__' ? undefined : colorOptIds.get(color.name)!,
          stock,
        })
      })
    })
  })

  await db.insert(productAssignedAttributes).values(assignedRows).onConflictDoNothing()
  await db.insert(productAttributeOptions).values(optionRows).onConflictDoNothing()
  await db.insert(productVariants).values(variantRows).onConflictDoNothing({ target: productVariants.sku })
  await db.insert(variantAttributeValues).values(vavRows).onConflictDoNothing()

  // ─── Carts ────────────────────────────────────────────────────────────────
  console.log('Seeding carts...')
  const cartAliceId = id()
  await db
    .insert(carts)
    .values([{ id: cartAliceId, userId: aliceId, status: 'active' }])
    .onConflictDoNothing()

  // Pick a couple of Alice's variants — first M-size variants we can find.
  const findMVariant = (slug: string) =>
    allVariants.find((v) => v.productSlug === slug && v.sku.includes('-M'))!

  const aliceVariant1 = findMVariant('real-madrid-home-jersey-2025-26')
  const aliceVariant2 = findMVariant('psg-training-shorts')

  console.log('Seeding cart items...')
  await db
    .insert(cartItems)
    .values([
      { cartId: cartAliceId, productVariantId: aliceVariant1.variantId, quantity: 1, priceAtTime: '29.99' },
      { cartId: cartAliceId, productVariantId: aliceVariant2.variantId, quantity: 2, priceAtTime: '17.99' },
    ])
    .onConflictDoNothing()

  // ─── Orders ───────────────────────────────────────────────────────────────
  console.log('Seeding orders...')
  const order1Id = id()
  const order2Id = id()
  const order3Id = id()
  // Alice gets demo history so the customer Profile/Orders page has something
  // to show after the legacy customer-orders.json was removed.
  const order4Id = id()
  const order5Id = id()

  const bobOrderV1 = findMVariant('la-lakers-home-jersey-2025')
  const bobOrderV2 = findMVariant('lakers-showtime-hoodie')
  const carlosOrderV1 = findMVariant('liverpool-home-jersey-2025-26')
  const dinaOrderV1   = findMVariant('chicago-bulls-classic-jersey')
  const dinaOrderV2   = findMVariant('bulls-practice-shorts')
  const dinaOrderV3   = findMVariant('gym-performance-kit')
  const aliceOrderV1  = findMVariant('real-madrid-home-jersey-2025-26')
  const aliceOrderV2  = findMVariant('psg-home-jersey-2025-26')
  const aliceOrderV3  = findMVariant('fc-barcelona-home-jersey-2025-26')

  await db
    .insert(orders)
    .values([
      {
        id: order1Id, userId: bobId,
        orderNumber: 'ORD-2026-0001',
        status: 'paid', paymentStatus: 'captured',
        subtotal: '53.98', discountAmount: '0', shippingAmount: '0', totalAmount: '53.98',
        shippingAddress: { line1: '742 Evergreen Terrace', city: 'Springfield', state: 'IL', country: 'US', postalCode: '62704' },
        billingAddress:  { line1: '742 Evergreen Terrace', city: 'Springfield', state: 'IL', country: 'US', postalCode: '62704' },
        placedAt: day(-12),
      },
      {
        id: order2Id, userId: carlosId,
        orderNumber: 'ORD-2026-0002',
        status: 'shipped', paymentStatus: 'captured',
        subtotal: '27.99', discountAmount: '0', shippingAmount: '5.00', totalAmount: '32.99',
        shippingAddress: { line1: '221B Baker Street', city: 'London', country: 'GB', postalCode: 'NW1 6XE' },
        billingAddress:  { line1: '221B Baker Street', city: 'London', country: 'GB', postalCode: 'NW1 6XE' },
        placedAt: day(-5),
      },
      {
        id: order3Id, userId: dinaId,
        orderNumber: 'ORD-2026-0003',
        status: 'paid', paymentStatus: 'captured',
        subtotal: '65.97', discountAmount: '5.00', shippingAmount: '0', totalAmount: '60.97',
        shippingAddress: { line1: '1 Microsoft Way', city: 'Redmond', state: 'WA', country: 'US', postalCode: '98052' },
        billingAddress:  { line1: '1 Microsoft Way', city: 'Redmond', state: 'WA', country: 'US', postalCode: '98052' },
        placedAt: day(-2),
      },
      // ── Alice demo history (3 orders spanning shipped / delivered / cancelled)
      {
        id: order4Id, userId: aliceId,
        orderNumber: 'ORD-2026-0004',
        status: 'shipped', paymentStatus: 'captured',
        subtotal: '29.99', discountAmount: '0', shippingAmount: '5.00', totalAmount: '34.99',
        shippingAddress: { fullName: 'Alice Customer', line1: '1842 Mission St', city: 'San Francisco', state: 'CA', country: 'US', postalCode: '94103' },
        billingAddress:  { fullName: 'Alice Customer', line1: '1842 Mission St', city: 'San Francisco', state: 'CA', country: 'US', postalCode: '94103' },
        placedAt: day(-7),
      },
      {
        id: order5Id, userId: aliceId,
        orderNumber: 'ORD-2026-0005',
        status: 'delivered', paymentStatus: 'captured',
        subtotal: '57.98', discountAmount: '0', shippingAmount: '0', totalAmount: '57.98',
        shippingAddress: { fullName: 'Alice Customer', line1: '1842 Mission St', city: 'San Francisco', state: 'CA', country: 'US', postalCode: '94103' },
        billingAddress:  { fullName: 'Alice Customer', line1: '1842 Mission St', city: 'San Francisco', state: 'CA', country: 'US', postalCode: '94103' },
        placedAt: day(-25),
      },
    ])
    .onConflictDoNothing({ target: orders.orderNumber })

  console.log('Seeding order items...')
  await db
    .insert(orderItems)
    .values([
      { orderId: order1Id, productVariantId: bobOrderV1.variantId,    productTitleSnapshot: 'Los Angeles Lakers Home Jersey', variantSnapshotJson: { sku: bobOrderV1.sku, size: 'M' },              quantity: 1, unitPrice: '29.99', totalPrice: '29.99' },
      { orderId: order1Id, productVariantId: bobOrderV2.variantId,    productTitleSnapshot: 'Lakers Showtime Hoodie',         variantSnapshotJson: { sku: bobOrderV2.sku, size: 'M' },              quantity: 1, unitPrice: '23.99', totalPrice: '23.99' },
      { orderId: order2Id, productVariantId: carlosOrderV1.variantId, productTitleSnapshot: 'Liverpool Home Jersey 2025/26',  variantSnapshotJson: { sku: carlosOrderV1.sku, size: 'M' },           quantity: 1, unitPrice: '27.99', totalPrice: '27.99' },
      { orderId: order3Id, productVariantId: dinaOrderV1.variantId,   productTitleSnapshot: 'Chicago Bulls Classic Home Jersey', variantSnapshotJson: { sku: dinaOrderV1.sku, size: 'M' },         quantity: 1, unitPrice: '28.99', totalPrice: '28.99' },
      { orderId: order3Id, productVariantId: dinaOrderV2.variantId,   productTitleSnapshot: 'Chicago Bulls Practice Shorts',  variantSnapshotJson: { sku: dinaOrderV2.sku, size: 'M' },             quantity: 1, unitPrice: '16.99', totalPrice: '16.99' },
      { orderId: order3Id, productVariantId: dinaOrderV3.variantId,   productTitleSnapshot: 'Gym Performance Training Kit',   variantSnapshotJson: { sku: dinaOrderV3.sku, size: 'M', color: 'Charcoal' }, quantity: 1, unitPrice: '19.99', totalPrice: '19.99' },
      // ── Alice demo history items ──
      { orderId: order4Id, productVariantId: aliceOrderV1.variantId,  productTitleSnapshot: 'Real Madrid Home Jersey 2025/26', variantSnapshotJson: { sku: aliceOrderV1.sku, size: 'M' }, quantity: 1, unitPrice: '29.99', totalPrice: '29.99' },
      { orderId: order5Id, productVariantId: aliceOrderV2.variantId,  productTitleSnapshot: 'PSG Home Jersey 2025/26',         variantSnapshotJson: { sku: aliceOrderV2.sku, size: 'L' }, quantity: 1, unitPrice: '28.99', totalPrice: '28.99' },
      { orderId: order5Id, productVariantId: aliceOrderV3.variantId,  productTitleSnapshot: 'FC Barcelona Home Jersey 2025/26', variantSnapshotJson: { sku: aliceOrderV3.sku, size: 'S' }, quantity: 1, unitPrice: '28.99', totalPrice: '28.99' },
    ])
    .onConflictDoNothing()

  // ─── Reviews — a few per most-popular products ────────────────────────────
  console.log('Seeding reviews...')
  const reviewData: Array<{ productSlug: string; userId: string; rating: number; title: string; comment: string; verified: boolean }> = [
    { productSlug: 'real-madrid-home-jersey-2025-26', userId: aliceId,  rating: 5, title: 'Fits perfectly',         comment: 'Quality is exceptional, the embroidered crest looks identical to the matchday kit.', verified: false },
    { productSlug: 'real-madrid-home-jersey-2025-26', userId: bobId,    rating: 5, title: 'Hala Madrid!',           comment: 'Wore it to the Bernabéu — got plenty of compliments.', verified: true },
    { productSlug: 'fc-barcelona-home-jersey-2025-26',userId: carlosId, rating: 4, title: 'Great fabric',           comment: 'Sizing runs slightly small, order one size up if you prefer a relaxed fit.', verified: true },
    { productSlug: 'liverpool-home-jersey-2025-26',   userId: dinaId,   rating: 5, title: 'YNWA forever',           comment: 'Color is rich, fabric is breathable, and the crest detail is on point.', verified: true },
    { productSlug: 'psg-home-jersey-2025-26',         userId: aliceId,  rating: 5, title: 'Stunning kit',           comment: 'The Hechter stripe is even cleaner in person. Five stars.', verified: false },
    { productSlug: 'la-lakers-home-jersey-2025',      userId: bobId,    rating: 5, title: 'Showtime feel',           comment: 'Lightweight, mesh is high quality, classic Lakers gold.', verified: true },
    { productSlug: 'chicago-bulls-classic-jersey',    userId: dinaId,   rating: 5, title: 'Iconic, simple',          comment: 'This is THE Bulls jersey. Nothing else needs to be said.', verified: true },
    { productSlug: 'real-madrid-performance-hoodie',  userId: carlosId, rating: 4, title: 'Cozy + premium',          comment: 'Heavyweight feel, the embroidered crest is the standout detail.', verified: false },
    { productSlug: 'psg-training-shorts',             userId: aliceId,  rating: 4, title: 'Solid daily shorts',      comment: 'Pockets are deep, fabric breathes well, and the crest tag is a nice touch.', verified: false },
    { productSlug: 'football-pro-training-kit',       userId: dinaId,   rating: 5, title: 'Worth the price',         comment: 'Everything matches, fits true to size, and the bag it ships in is reusable.', verified: false },
  ]
  await db
    .insert(reviews)
    .values(
      reviewData.map((r) => ({
        userId:             r.userId,
        productId:          productIds.get(r.productSlug)!,
        rating:             r.rating,
        title:              r.title,
        comment:            r.comment,
        isVerifiedPurchase: r.verified,
      })),
    )
    .onConflictDoNothing()

  // ─── Special offers ───────────────────────────────────────────────────────
  console.log('Seeding special offers...')
  await db
    .insert(specialOffers)
    .values([
      {
        id: offerWorldCupId,
        title: 'World Cup 2026 — 20% Off',
        description: '20% off every World Cup 2026 themed jersey & kit.',
        discountType: 'percentage', discountValue: '20.00',
        startDate: day(-2), endDate: day(45),
        bannerUrl: IMG('hero-wc2026.png'),
      },
      {
        id: offerFirstOrderId,
        title: 'Welcome — 10% Off First Order',
        description: 'New customer? Take 10% off your very first checkout.',
        discountType: 'percentage', discountValue: '10.00',
        startDate: day(-30), endDate: day(120),
        bannerUrl: IMG('offer-first-order.jpg'),
      },
      {
        id: offerFreeShipId,
        title: 'Free Delivery Over $75',
        description: 'Spend $75 or more — shipping is on us.',
        discountType: 'fixed', discountValue: '0.00',
        startDate: day(-60), endDate: day(180),
        bannerUrl: IMG('offer-free-delivery.jpg'),
      },
    ])
    .onConflictDoNothing()

  // Link the World Cup offer to a couple of flagship football jerseys so the
  // discount actually applies to something on the product page.
  console.log('Seeding offer ⇄ product links...')
  await db
    .insert(offerProducts)
    .values([
      { offerId: offerWorldCupId, productId: productIds.get('real-madrid-home-jersey-2025-26')! },
      { offerId: offerWorldCupId, productId: productIds.get('fc-barcelona-home-jersey-2025-26')! },
      { offerId: offerWorldCupId, productId: productIds.get('liverpool-home-jersey-2025-26')! },
      { offerId: offerWorldCupId, productId: productIds.get('psg-home-jersey-2025-26')! },
      { offerId: offerWorldCupId, productId: productIds.get('bayern-munich-home-jersey-2025-26')! },
    ])
    .onConflictDoNothing()

  // ─── Site config ──────────────────────────────────────────────────────────
  console.log('Seeding site config...')
  await db
    .insert(siteConfig)
    .values([
      {
        slug: 'default',
        name: 'Jerseys_4Ever',
        tagline: 'Wear What You Live',
        description: 'Premium authentic jerseys and sportswear from the world\'s greatest clubs and teams.',
        email: 'support@jerseys4ever.com',
        phone: '+1 (800) 555-0199',
        currency: 'USD',
        freeShippingThreshold: '75',
        shippingFee: '9.99',
        socialLinks: {
          instagram: 'https://instagram.com/jerseys_4ever',
          twitter:   'https://twitter.com/jerseys_4ever',
          facebook:  'https://facebook.com/jerseys_4ever',
          youtube:   'https://youtube.com/jerseys_4ever',
          whatsapp:  'https://wa.me/18005550199',
        },
        // Empty map ⇒ every social visible by default; admins flip a key to
        // `false` to hide that social everywhere it renders.
        socialLinksVisible: {},
        heroDesignYourOwnLabel: 'Design Your Own',
        heroDesignYourOwnHref:  '/custom',
        filterMinPrice:         '0',
        filterMaxPrice:         '300',
        sortOptions: [
          { value: 'newest',     label: 'Newest' },
          { value: 'popular',    label: 'Most Popular' },
          { value: 'price-asc',  label: 'Price: Low to High' },
          { value: 'price-desc', label: 'Price: High to Low' },
        ],
        cartEmptyMessage:  'Your cart is empty',
        cartEmptyCtaLabel: 'Start Shopping',
        cartEmptyCtaHref:  '/shop',
      },
    ])
    .onConflictDoNothing({ target: siteConfig.slug })

  // ─── Shipping methods ─────────────────────────────────────────────────────
  console.log('Seeding shipping methods...')
  await db
    .insert(shippingMethods)
    .values([
      { name: 'Standard',  description: '4-7 business days',  baseRate: '5.00',  freeShippingThreshold: '75',  estimatedDaysMin: 4, estimatedDaysMax: 7, sortOrder: 0 },
      { name: 'Express',   description: '2-3 business days',  baseRate: '12.00', freeShippingThreshold: null,  estimatedDaysMin: 2, estimatedDaysMax: 3, sortOrder: 1 },
      { name: 'Overnight', description: 'Next business day',  baseRate: '24.00', freeShippingThreshold: null,  estimatedDaysMin: 1, estimatedDaysMax: 1, sortOrder: 2 },
    ])
    .onConflictDoNothing()

  // ─── UI content: hero, strip, banners, sports, teams, kit categories ──────
  //
  // None of these slots has a unique constraint on (slot, payload) and every
  // insert generates a fresh UUID, so naive reseeding duplicates every row.
  // We wipe all rows in the slots we own before reinserting to make this
  // section fully idempotent. Caveat: any admin-added rows in these slots
  // will be removed on reseed — reconcile production data before re-running.
  console.log('Seeding ui-content: wiping seeded slots...')
  await db.delete(uiContent).where(inArray(uiContent.slot, [
    'hero-slide',
    'offer-strip',
    'offer-banner',
    'sport',
    'team',
    'kit-category',
    'nav-link',
    'footer-column',
    'featured-section',
    'coupon',
  ]))

  console.log('Seeding ui-content: hero slides (3 — incl. World Cup 2026)...')
  await db
    .insert(uiContent)
    .values([
      {
        slot: 'hero-slide', sortOrder: 0,
        payload: {
          headline:    'World Cup\n2026.',
          subheadline: 'The biggest stage is coming. Wear the kit before kick-off.',
          ctaLabel:    'Shop World Cup',
          ctaHref:     '/shop?badge=World+Cup',
          badge:       'World Cup 2026',
          accent:      '#007aff',
          align:       'center',
          overlay:     'bottom',
          image:       IMG('hero-wc2026.png'),
        },
      },
      {
        slot: 'hero-slide', sortOrder: 1,
        payload: {
          headline:    'Built For\nGreatness.',
          subheadline: 'Trophy-grade craftsmanship. Worn by champions, kept forever.',
          ctaLabel:    'Shop Jerseys',
          ctaHref:     '/shop?categoryId=jerseys',
          badge:       'Heritage',
          accent:      '#ffd700',
          align:       'left',
          overlay:     'left',
          image:       IMG('hero-stadium.jpg'),
        },
      },
      {
        slot: 'hero-slide', sortOrder: 2,
        payload: {
          headline:    'Every Legend\nStarts Here.',
          subheadline: 'From the playground to the parquet — gear up for greatness.',
          ctaLabel:    'Shop Basketball',
          ctaHref:     '/shop?sport=basketball',
          badge:       'Hardwood',
          accent:      '#ff4d00',
          align:       'right',
          overlay:     'right',
          image:       IMG('hero-court.jpg'),
        },
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding ui-content: offer-strip (quality marquee)...')
  await db
    .insert(uiContent)
    .values([
      { slot: 'offer-strip', sortOrder: 0, payload: { text: '⚡ Fast Delivery — 2–4 Day Worldwide Shipping' } },
      { slot: 'offer-strip', sortOrder: 1, payload: { text: '🏆 Best Quality in the Market — Authentic Materials' } },
      { slot: 'offer-strip', sortOrder: 2, payload: { text: '🔥 Insane Offers — Up to 20% Off World Cup 2026 Kits' } },
      { slot: 'offer-strip', sortOrder: 3, payload: { text: '💯 Match-Grade Construction — Worn by the Pros' } },
      { slot: 'offer-strip', sortOrder: 4, payload: { text: '🛡 Licensed Originals — Zero Counterfeit Guarantee' } },
      { slot: 'offer-strip', sortOrder: 5, payload: { text: '↩️ 30-Day No-Questions Returns' } },
      { slot: 'offer-strip', sortOrder: 6, payload: { text: '⭐ Trusted by 100,000+ Fans Worldwide' } },
    ])
    .onConflictDoNothing()

  console.log('Seeding ui-content: offer banners (3)...')
  await db
    .insert(uiContent)
    .values([
      {
        slot: 'offer-banner', sortOrder: 0,
        payload: {
          label:       'World Cup 2026',
          headline:    '20% Off All World Cup Items',
          subheadline: 'Every kit, every nation — limited window before kick-off.',
          ctaLabel:    'Shop World Cup',
          ctaHref:     '/shop?badge=World+Cup',
          color:       '#007aff',
          image:       IMG('offer-worldcup.jpg'),
        },
      },
      {
        slot: 'offer-banner', sortOrder: 1,
        payload: {
          label:       'Welcome Offer',
          headline:    '10% Off Your First Order',
          subheadline: 'New here? Treat your wardrobe — discount auto-applies at checkout.',
          ctaLabel:    'Shop Now',
          ctaHref:     '/shop',
          color:       '#ff4d00',
          image:       IMG('offer-first-order.jpg'),
        },
      },
      {
        slot: 'offer-banner', sortOrder: 2,
        payload: {
          label:       'Free Delivery',
          headline:    'Free Shipping Over $75',
          subheadline: 'Spend $75 and we ship it free — anywhere we operate.',
          ctaLabel:    'Start Shopping',
          ctaHref:     '/shop',
          color:       '#34c759',
          image:       IMG('offer-free-delivery.jpg'),
        },
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding ui-content: sports (Football, Basketball, Gym)...')
  await db
    .insert(uiContent)
    .values([
      { slot: 'sport', sortOrder: 0, payload: { name: 'Football',   slug: 'football',   icon: '⚽', color: '#007aff', featured: true, image: IMG('sport-football.jpg')   } },
      { slot: 'sport', sortOrder: 1, payload: { name: 'Basketball', slug: 'basketball', icon: '🏀', color: '#ff9f0a', featured: true, image: IMG('sport-basketball.jpg') } },
      { slot: 'sport', sortOrder: 2, payload: { name: 'Gym',        slug: 'gym',        icon: '💪', color: '#34c759', featured: true, image: IMG('sport-gym.jpg')        } },
    ])
    .onConflictDoNothing()

  console.log('Seeding ui-content: teams (12, real badges)...')
  await db
    .insert(uiContent)
    .values([
      { slot: 'team', sortOrder:  0, payload: { name: 'Real Madrid',           slug: 'real-madrid',           sport: 'football',   country: 'Spain',   color: '#febe10', colorSecondary: '#00529f', abbreviation: 'RMA', logo: IMG('team-real-madrid.png') } },
      { slot: 'team', sortOrder:  1, payload: { name: 'FC Barcelona',          slug: 'fc-barcelona',          sport: 'football',   country: 'Spain',   color: '#a50044', colorSecondary: '#004d98', abbreviation: 'FCB', logo: IMG('team-barcelona.png')   } },
      { slot: 'team', sortOrder:  2, payload: { name: 'Manchester City',       slug: 'manchester-city',       sport: 'football',   country: 'England', color: '#6cabdd', colorSecondary: '#1c2c5b', abbreviation: 'MCI', logo: IMG('team-man-city.png')    } },
      { slot: 'team', sortOrder:  3, payload: { name: 'Manchester United',     slug: 'manchester-united',     sport: 'football',   country: 'England', color: '#da020e', colorSecondary: '#fbe122', abbreviation: 'MUN', logo: IMG('team-man-united.png')  } },
      { slot: 'team', sortOrder:  4, payload: { name: 'Liverpool',             slug: 'liverpool',             sport: 'football',   country: 'England', color: '#c8102e', colorSecondary: '#00b2a9', abbreviation: 'LIV', logo: IMG('team-liverpool.png')   } },
      { slot: 'team', sortOrder:  5, payload: { name: 'Paris Saint-Germain',   slug: 'psg',                   sport: 'football',   country: 'France',  color: '#004170', colorSecondary: '#da291c', abbreviation: 'PSG', logo: IMG('team-psg.png')         } },
      { slot: 'team', sortOrder:  6, payload: { name: 'Bayern Munich',         slug: 'bayern-munich',         sport: 'football',   country: 'Germany', color: '#dc052d', colorSecondary: '#0066b2', abbreviation: 'FCB', logo: IMG('team-bayern.png')      } },
      { slot: 'team', sortOrder:  7, payload: { name: 'Juventus',              slug: 'juventus',              sport: 'football',   country: 'Italy',   color: '#000000', colorSecondary: '#ffffff', abbreviation: 'JUV', logo: IMG('team-juventus.png')    } },
      { slot: 'team', sortOrder:  8, payload: { name: 'LA Lakers',             slug: 'la-lakers',             sport: 'basketball', country: 'USA',     color: '#552583', colorSecondary: '#fdb927', abbreviation: 'LAL', logo: IMG('team-lakers.png')      } },
      { slot: 'team', sortOrder:  9, payload: { name: 'Chicago Bulls',         slug: 'chicago-bulls',         sport: 'basketball', country: 'USA',     color: '#ce1141', colorSecondary: '#000000', abbreviation: 'CHI', logo: IMG('team-bulls.png')       } },
      { slot: 'team', sortOrder: 10, payload: { name: 'Golden State Warriors', slug: 'golden-state-warriors', sport: 'basketball', country: 'USA',     color: '#1d428a', colorSecondary: '#ffc72c', abbreviation: 'GSW', logo: IMG('team-warriors.png')    } },
      { slot: 'team', sortOrder: 11, payload: { name: 'Boston Celtics',        slug: 'boston-celtics',        sport: 'basketball', country: 'USA',     color: '#007a33', colorSecondary: '#ba9653', abbreviation: 'BOS', logo: IMG('team-celtics.png')     } },
    ])
    .onConflictDoNothing()

  console.log('Seeding ui-content: kit categories (mirrors catalog categories)...')
  await db
    .insert(uiContent)
    .values([
      { slot: 'kit-category', sortOrder: 0, payload: { name: 'Jerseys',       slug: 'jerseys',       description: 'Authentic match & replica jerseys',    color: '#007aff', colorDark: '#0055cc', image: IMG('cat-jerseys.jpg')  } },
      { slot: 'kit-category', sortOrder: 1, payload: { name: 'Shorts',        slug: 'shorts',        description: 'Performance match & training shorts',  color: '#ff4d00', colorDark: '#cc3d00', image: IMG('cat-shorts.jpg')   } },
      { slot: 'kit-category', sortOrder: 2, payload: { name: 'Hoodies',       slug: 'hoodies',       description: 'Premium team hoodies & sweatshirts',   color: '#ff9f0a', colorDark: '#cc7d00', image: IMG('cat-hoodies.jpg')  } },
      { slot: 'kit-category', sortOrder: 3, payload: { name: 'Training Kits', slug: 'training-kits', description: 'Complete sets for the daily grind',    color: '#34c759', colorDark: '#1a6b30', image: IMG('cat-training.jpg') } },
    ])
    .onConflictDoNothing()

  // ─── Storefront navigation (header) ───────────────────────────────────────
  // Each row is one top-level nav link; nested dropdown items go under
  // `payload.children`. Order from left-to-right is driven by `sortOrder`.
  console.log('Seeding ui-content: nav links (header)...')
  await db
    .insert(uiContent)
    .values([
      {
        slot: 'nav-link', sortOrder: 0,
        payload: {
          label: 'Shop',
          href:  '/shop',
          children: [
            { label: 'All Items',  href: '/shop' },
            { label: 'Football',   href: '/shop?sport=football' },
            { label: 'Basketball', href: '/shop?sport=basketball' },
            { label: 'Gym',        href: '/shop?sport=gym' },
          ],
        },
      },
      { slot: 'nav-link', sortOrder: 1, payload: { label: 'New Arrivals', href: '/shop?badge=New' } },
      { slot: 'nav-link', sortOrder: 2, payload: { label: 'Sale',         href: '/shop?badge=Sale' } },
    ])
    .onConflictDoNothing()

  // ─── Storefront footer columns ────────────────────────────────────────────
  console.log('Seeding ui-content: footer columns...')
  await db
    .insert(uiContent)
    .values([
      {
        slot: 'footer-column', sortOrder: 0,
        payload: {
          title: 'Shop',
          links: [
            { label: 'All Items',    href: '/shop' },
            { label: 'Football',     href: '/shop?sport=football' },
            { label: 'Basketball',   href: '/shop?sport=basketball' },
            { label: 'Gym',          href: '/shop?sport=gym' },
            { label: 'New Arrivals', href: '/shop?badge=New' },
            { label: 'Sale',         href: '/shop?badge=Sale' },
          ],
        },
      },
      {
        slot: 'footer-column', sortOrder: 1,
        payload: {
          title: 'Account',
          links: [
            { label: 'Login',    href: '/login' },
            { label: 'Register', href: '/register' },
            { label: 'Profile',  href: '/profile' },
          ],
        },
      },
      {
        slot: 'footer-column', sortOrder: 2,
        payload: {
          title: 'Support',
          links: [
            { label: 'FAQ',             href: '/faq' },
            { label: 'Shipping Policy', href: '/shipping-policy' },
            { label: 'Returns',         href: '/returns' },
            { label: 'Size Guide',      href: '/size-guide' },
            { label: 'Contact Us',      href: '/contact' },
          ],
        },
      },
      {
        slot: 'footer-column', sortOrder: 3,
        payload: {
          title: 'Company',
          links: [
            { label: 'About Us',         href: '/about' },
            { label: 'Company',          href: '/company' },
            { label: 'Privacy Policy',   href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
          ],
        },
      },
    ])
    .onConflictDoNothing()

  // ─── HomePage featured sections ───────────────────────────────────────────
  // Each row drives one ProductSlider row on the homepage. Optional
  // `sportFilter` / `teamFilter` / `categoryFilter` narrow the product set;
  // `limit` caps the row length.
  console.log('Seeding ui-content: featured sections...')
  await db
    .insert(uiContent)
    .values([
      {
        slot: 'featured-section', sortOrder: 0,
        payload: { title: 'New Arrivals', subtitle: "Fresh drops from the world's top clubs", limit: 8 },
      },
    ])

  // Sample coupons — admin can edit/extend through the storefront admin UI.
  // The storefront and the server-side /coupons/validate endpoint both pull
  // from the same ui_content rows, so these are immediately usable at checkout.
  console.log('Seeding ui-content: sample coupons (WELCOME10, FANS5)...')
  await db
    .insert(uiContent)
    .values([
      {
        slot: 'coupon', sortOrder: 0,
        payload: { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, description: '10% off your first order' },
      },
      {
        slot: 'coupon', sortOrder: 1,
        payload: { code: 'FANS5',     discountType: 'fixed',      discountValue: 5,  description: '$5 off — fan-club perk' },
      },
    ])

  console.log(`Seeding complete — ${CATALOG.length} products, ${allVariants.length} variants.`)
} catch (err) {
  console.error('Seeding failed:', err)
  process.exit(1)
} finally {
  await connection.end()
}
