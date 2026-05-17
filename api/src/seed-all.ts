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
  specialOffers,
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

const attachAvatarId = id()
const attachProductId = id()
const attachBannerId = id()

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

  console.log('Seeding attachments...')
  await db
    .insert(attachments)
    .values([
      {
        id: attachAvatarId,
        fileName: 'admin-avatar.png',
        fileUrl: 'https://cdn.example.com/avatars/admin.png',
        compressedFileUrl: 'https://cdn.example.com/avatars/admin.webp',
        mimeType: 'image/png',
        fileSize: 24_512,
        uploadedBy: adminId,
      },
      {
        id: attachProductId,
        fileName: 'home-jersey.jpg',
        fileUrl: 'https://cdn.example.com/products/home-jersey.jpg',
        compressedFileUrl: 'https://cdn.example.com/products/home-jersey.webp',
        mimeType: 'image/jpeg',
        fileSize: 184_320,
        uploadedBy: adminId,
      },
      {
        id: attachBannerId,
        fileName: 'summer-sale-banner.jpg',
        fileUrl: 'https://cdn.example.com/banners/summer-sale.jpg',
        compressedFileUrl: 'https://cdn.example.com/banners/summer-sale.webp',
        mimeType: 'image/jpeg',
        fileSize: 312_544,
        uploadedBy: adminId,
      },
    ])
    .onConflictDoNothing()

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
        imageId: null,
      },
      {
        id: catShortsId,
        categoryTypeId: catTypeApparelId,
        parentId: catJerseysId,
        name: 'Shorts',
        slug: 'shorts',
        description: 'Matching shorts',
        imageId: null,
      },
      {
        id: catScarvesId,
        categoryTypeId: catTypeAccessoriesId,
        parentId: null,
        name: 'Scarves',
        slug: 'scarves',
        description: 'Team scarves',
        imageId: null,
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
        status: 'published',
        featured: true,
        searchVector: 'home jersey 2026 football official',
        imageId: attachProductId,
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
        status: 'published',
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
        status: 'published',
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
        imageId: attachProductId,
      },
      {
        id: variantHomeBlueLId,
        productId: productHomeJerseyId,
        sku: 'HJ-2026-BLUE-L',
        priceOverride: '84.99',
        stockQuantity: 10,
        imageId: null,
      },
      {
        id: variantAwayMId,
        productId: productAwayJerseyId,
        sku: 'AJ-2026-M',
        priceOverride: null,
        stockQuantity: 30,
        imageId: null,
      },
      {
        id: variantScarfId,
        productId: productScarfId,
        sku: 'SC-CLASSIC',
        priceOverride: null,
        stockQuantity: 100,
        imageId: null,
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
        bannerAttachmentId: attachBannerId,
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

  console.log('Seeding complete.')
} catch (err) {
  console.error('Seeding failed:', err)
  process.exit(1)
} finally {
  await connection.end()
}
