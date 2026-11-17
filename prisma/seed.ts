import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { AdminRoleCode, CategoryType, PrismaClient } from '@prisma/client';
import pg from 'pg';

interface CategorySeedEntry {
  name: string;
  slug: string;
  type: CategoryType;
  groupName: string;
  categoryKey: string;
  description: string;
  sortOrder: number;
}

const PRODUCT_CATEGORIES: CategorySeedEntry[] = [
  {
    name: 'Electronics',
    slug: 'electronics',
    type: CategoryType.PRODUCT,
    groupName: 'Product Categories',
    categoryKey: 'products',
    description: 'Audio gear, smart gadgets, cameras & accessories',
    sortOrder: 1,
  },
  {
    name: 'Mobiles',
    slug: 'mobiles',
    type: CategoryType.PRODUCT,
    groupName: 'Product Categories',
    categoryKey: 'products',
    description: 'PTA-approved smartphones, tablets & chargers',
    sortOrder: 2,
  },
  {
    name: 'Laptops',
    slug: 'laptops',
    type: CategoryType.PRODUCT,
    groupName: 'Product Categories',
    categoryKey: 'products',
    description: 'Business ultrabooks, student & gaming laptops',
    sortOrder: 3,
  },
  {
    name: 'Vehicles',
    slug: 'vehicles',
    type: CategoryType.PRODUCT,
    groupName: 'Product Categories',
    categoryKey: 'products',
    description: 'Cars, motorcycles, rickshaws & spare parts',
    sortOrder: 4,
  },
  {
    name: 'Furniture',
    slug: 'furniture',
    type: CategoryType.PRODUCT,
    groupName: 'Product Categories',
    categoryKey: 'products',
    description: 'Office chairs, beds, dining sets & custom woodwork',
    sortOrder: 5,
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    type: CategoryType.PRODUCT,
    groupName: 'Product Categories',
    categoryKey: 'products',
    description: 'Unstitched fabrics, waistcoats, footwear & watches',
    sortOrder: 6,
  },
  {
    name: 'Home Appliances',
    slug: 'home-appliances',
    type: CategoryType.PRODUCT,
    groupName: 'Product Categories',
    categoryKey: 'products',
    description: 'Inverter ACs, UPS systems, fridges & dispensers',
    sortOrder: 7,
  },
  {
    name: 'Property',
    slug: 'property',
    type: CategoryType.PRODUCT,
    groupName: 'Product Categories',
    categoryKey: 'products',
    description: 'Portions, shops, commercial offices & plots',
    sortOrder: 8,
  },
];

const SERVICE_CATEGORIES: CategorySeedEntry[] = [
  // Home Services
  {
    name: 'Mechanic',
    slug: 'mechanic',
    type: CategoryType.SERVICE,
    groupName: 'Home Services',
    categoryKey: 'mechanic',
    description: 'General mechanical repairs & engine tuning',
    sortOrder: 101,
  },
  {
    name: 'Electrician',
    slug: 'electrician',
    type: CategoryType.SERVICE,
    groupName: 'Home Services',
    categoryKey: 'electrician',
    description: 'House wiring, DB box & UPS installation',
    sortOrder: 102,
  },
  {
    name: 'Plumber',
    slug: 'plumber',
    type: CategoryType.SERVICE,
    groupName: 'Home Services',
    categoryKey: 'plumber',
    description: 'Pipe fitting, geysers & leak repairs',
    sortOrder: 103,
  },
  {
    name: 'Carpenter',
    slug: 'carpenter',
    type: CategoryType.SERVICE,
    groupName: 'Home Services',
    categoryKey: 'carpenter',
    description: 'Doors, wardrobes, kitchens & furniture polish',
    sortOrder: 104,
  },
  {
    name: 'Painter',
    slug: 'painter',
    type: CategoryType.SERVICE,
    groupName: 'Home Services',
    categoryKey: 'home-services',
    description: 'Interior distemper, weather shield & texture',
    sortOrder: 105,
  },
  {
    name: 'Cleaning',
    slug: 'cleaning',
    type: CategoryType.SERVICE,
    groupName: 'Home Services',
    categoryKey: 'home-services',
    description: 'Deep house, sofa & water tank cleaning',
    sortOrder: 106,
  },
  {
    name: 'Construction',
    slug: 'construction',
    type: CategoryType.SERVICE,
    groupName: 'Home Services',
    categoryKey: 'home-services',
    description: 'Masonry, tile fixing & waterproofing',
    sortOrder: 107,
  },

  // Vehicle Services
  {
    name: 'Car Mechanic',
    slug: 'car-mechanic',
    type: CategoryType.SERVICE,
    groupName: 'Vehicle Services',
    categoryKey: 'mechanic',
    description: 'EFI diagnostics, suspension & brake service',
    sortOrder: 201,
  },
  {
    name: 'Bike Mechanic',
    slug: 'bike-mechanic',
    type: CategoryType.SERVICE,
    groupName: 'Vehicle Services',
    categoryKey: 'mechanic',
    description: '70cc-150cc tuning, clutch & engine overhaul',
    sortOrder: 202,
  },
  {
    name: 'Auto Electrician',
    slug: 'auto-electrician',
    type: CategoryType.SERVICE,
    groupName: 'Vehicle Services',
    categoryKey: 'mechanic',
    description: 'Car AC, battery, alternator & ECU scan',
    sortOrder: 203,
  },
  {
    name: 'Denting & Painting',
    slug: 'denting-and-painting',
    type: CategoryType.SERVICE,
    groupName: 'Vehicle Services',
    categoryKey: 'mechanic',
    description: 'Scratch removal, bumper alignment & booth paint',
    sortOrder: 204,
  },
  {
    name: 'Tyre Repair',
    slug: 'tyre-repair',
    type: CategoryType.SERVICE,
    groupName: 'Vehicle Services',
    categoryKey: 'mechanic',
    description: 'Tubeless puncture, wheel balancing & alignment',
    sortOrder: 205,
  },

  // Technical Services
  {
    name: 'AC Technician',
    slug: 'ac-technician',
    type: CategoryType.SERVICE,
    groupName: 'Technical Services',
    categoryKey: 'ac-technician',
    description: 'Split/Inverter AC gas refill, service & install',
    sortOrder: 301,
  },
  {
    name: 'AC Repair',
    slug: 'ac-repair',
    type: CategoryType.SERVICE,
    groupName: 'Technical Services',
    categoryKey: 'ac-technician',
    description: 'Air conditioner repair, compressor checks & seasonal maintenance',
    sortOrder: 302,
  },
  {
    name: 'Refrigerator Repair',
    slug: 'refrigerator-repair',
    type: CategoryType.SERVICE,
    groupName: 'Technical Services',
    categoryKey: 'tech-services',
    description: 'Compressor, thermostat & cooling diagnostics',
    sortOrder: 303,
  },
  {
    name: 'TV Repair',
    slug: 'tv-repair',
    type: CategoryType.SERVICE,
    groupName: 'Technical Services',
    categoryKey: 'tech-services',
    description: 'LED/Smart TV backlight & display board repair',
    sortOrder: 304,
  },
  {
    name: 'Washing Machine Repair',
    slug: 'washing-machine-repair',
    type: CategoryType.SERVICE,
    groupName: 'Technical Services',
    categoryKey: 'tech-services',
    description: 'Automatic & twin-tub motor and PCB care',
    sortOrder: 305,
  },
  {
    name: 'Mobile Repair',
    slug: 'mobile-repair',
    type: CategoryType.SERVICE,
    groupName: 'Technical Services',
    categoryKey: 'tech-services',
    description: 'Screen replacement, battery & charging port',
    sortOrder: 306,
  },
  {
    name: 'Computer Repair',
    slug: 'computer-repair',
    type: CategoryType.SERVICE,
    groupName: 'Technical Services',
    categoryKey: 'tech-services',
    description: 'Laptop SSD upgrade, hinge & thermal paste',
    sortOrder: 307,
  },
  {
    name: 'Solar Technician',
    slug: 'solar-technician',
    type: CategoryType.SERVICE,
    groupName: 'Technical Services',
    categoryKey: 'tech-services',
    description: 'Hybrid inverter setup, net metering & panels',
    sortOrder: 308,
  },

  // Clothing & Personal
  {
    name: 'Tailor',
    slug: 'tailor',
    type: CategoryType.SERVICE,
    groupName: 'Clothing & Personal',
    categoryKey: 'tailor',
    description: 'Shalwar Kameez, sherwani & custom alterations',
    sortOrder: 401,
  },
  {
    name: 'Embroidery',
    slug: 'embroidery',
    type: CategoryType.SERVICE,
    groupName: 'Clothing & Personal',
    categoryKey: 'tailor',
    description: 'Hand & machine embroidery for formal wear',
    sortOrder: 402,
  },
  {
    name: 'Shoe Repair',
    slug: 'shoe-repair',
    type: CategoryType.SERVICE,
    groupName: 'Clothing & Personal',
    categoryKey: 'home-services',
    description: 'Peshawari chappal & leather sole restoration',
    sortOrder: 403,
  },
  {
    name: 'Laundry',
    slug: 'laundry',
    type: CategoryType.SERVICE,
    groupName: 'Clothing & Personal',
    categoryKey: 'home-services',
    description: 'Dry cleaning, steam press & doorstep pickup',
    sortOrder: 404,
  },
  {
    name: 'Barber',
    slug: 'barber',
    type: CategoryType.SERVICE,
    groupName: 'Clothing & Personal',
    categoryKey: 'home-services',
    description: 'Home haircut, beard styling & groom packages',
    sortOrder: 405,
  },
  {
    name: 'Beautician',
    slug: 'beautician',
    type: CategoryType.SERVICE,
    groupName: 'Clothing & Personal',
    categoryKey: 'home-services',
    description: 'Bridal makeup, facials & home salon care',
    sortOrder: 406,
  },

  // Professional & General Services
  {
    name: 'Web Developer',
    slug: 'web-developer',
    type: CategoryType.SERVICE,
    groupName: 'Professional Services',
    categoryKey: 'tech-services',
    description: 'Business websites, e-commerce & POS integration',
    sortOrder: 501,
  },
  {
    name: 'Graphic Designer',
    slug: 'graphic-designer',
    type: CategoryType.SERVICE,
    groupName: 'Professional Services',
    categoryKey: 'tech-services',
    description: 'Logos, shop signage, menus & social branding',
    sortOrder: 502,
  },
  {
    name: 'Photographer',
    slug: 'photographer',
    type: CategoryType.SERVICE,
    groupName: 'Professional Services',
    categoryKey: 'tech-services',
    description: 'Product shoots, weddings & commercial events',
    sortOrder: 503,
  },
  {
    name: 'Video Editor',
    slug: 'video-editor',
    type: CategoryType.SERVICE,
    groupName: 'Professional Services',
    categoryKey: 'tech-services',
    description: 'Reels, promo ads & event highlight films',
    sortOrder: 504,
  },
  {
    name: 'Other Services',
    slug: 'other-services',
    type: CategoryType.SERVICE,
    groupName: 'Professional Services',
    categoryKey: 'home-services',
    description: 'Custom local errands, repairs & specialized neighborhood help',
    sortOrder: 599,
  },
];

const PAKISTAN_LOCATION_SEED = [
  {
    province: 'Khyber Pakhtunkhwa',
    cities: [
      {
        city: 'Peshawar',
        areas: [
          'University Road',
          'Hayatabad Phase 3',
          'Hayatabad Phase 5',
          'Saddar Bazaar',
          'Warsak Road',
          'Gulbahar',
          'Board Bazaar',
          'Tehkal',
          'Cantt',
        ],
      },
      {
        city: 'Mardan',
        areas: ['Sheikh Maltoon Town', 'Bank Road', 'Baghdada', 'Par Hoti'],
      },
      {
        city: 'Abbottabad',
        areas: ['Mansehra Road', 'Jinnahabad', 'Supply Bazaar', 'Mandian'],
      },
    ],
  },
  {
    province: 'Punjab',
    cities: [
      {
        city: 'Lahore',
        areas: ['Gulberg III', 'DHA Phase 5', 'Johar Town', 'Model Town', 'Bahria Town'],
      },
      {
        city: 'Rawalpindi',
        areas: ['Saddar Cantt', 'Bahria Town Phase 7', 'Chaklala Scheme III', 'Satellite Town'],
      },
      {
        city: 'Multan',
        areas: ['Cantt', 'Model Town', 'Gulgasht Colony', 'Shah Rukn-e-Alam'],
      },
    ],
  },
  {
    province: 'Sindh',
    cities: [
      {
        city: 'Karachi',
        areas: ['Clifton Block 4', 'Gulshan-e-Iqbal', 'DHA Phase 6', 'Saddar', 'PECHS'],
      },
    ],
  },
  {
    province: 'Islamabad Capital Territory',
    cities: [
      {
        city: 'Islamabad',
        areas: ['F-7 Markaz', 'G-11 Markaz', 'Blue Area', 'E-11', 'I-8 Markaz'],
      },
    ],
  },
  {
    province: 'Balochistan',
    cities: [
      {
        city: 'Quetta',
        areas: ['Jinnah Road', 'Satellite Town', 'Model Town', 'Cantt'],
      },
    ],
  },
];

const ADMIN_ROLE_DEFINITIONS = [
  {
    code: AdminRoleCode.SUPER_ADMIN,
    name: 'Super Administrator',
    description: 'Full server-verified platform governance, admin role assignment, and system audit authority.',
    permissions: [
      'admin:accounts:read',
      'admin:accounts:write',
      'admin:roles:assign',
      'admin:users:read',
      'admin:users:write',
      'admin:listings:moderate',
      'admin:categories:write',
      'admin:locations:write',
      'admin:reports:resolve',
      'admin:audit:read',
    ],
  },
  {
    code: AdminRoleCode.ADMIN,
    name: 'Platform Administrator',
    description: 'Manage users, seller/provider verifications, listings, reports, and inspect admin audit logs.',
    permissions: [
      'admin:accounts:read',
      'admin:users:read',
      'admin:users:write',
      'admin:listings:moderate',
      'admin:categories:write',
      'admin:locations:write',
      'admin:reports:resolve',
      'admin:audit:read',
    ],
  },
  {
    code: AdminRoleCode.MODERATOR,
    name: 'Marketplace Moderator',
    description: 'Review flagged products, service listings, and community abuse reports.',
    permissions: [
      'admin:listings:moderate',
      'admin:reports:resolve',
      'admin:users:read',
    ],
  },
  {
    code: AdminRoleCode.SUPPORT,
    name: 'Customer & Provider Support',
    description: 'Assist buyers, sellers, and service providers with account verification and dispute reports.',
    permissions: [
      'admin:users:read',
      'admin:users:verify',
      'admin:reports:resolve',
    ],
  },
  {
    code: AdminRoleCode.SUPPORT_ADMIN,
    name: 'Legacy Support Admin',
    description: 'Backwards-compatible support administrator role.',
    permissions: [
      'admin:users:read',
      'admin:reports:resolve',
    ],
  },
  {
    code: AdminRoleCode.CATALOG_ADMIN,
    name: 'Catalog & Location Administrator',
    description: 'Manage marketplace categories and supported Pakistan cities/neighborhoods.',
    permissions: [
      'admin:categories:write',
      'admin:locations:write',
    ],
  },
];

async function main(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL?.trim() || process.env.DIRECT_URL?.trim() || '';

  if (
    !connectionString ||
    connectionString.includes('CHANGE_ME') ||
    (!connectionString.startsWith('postgres://') &&
      !connectionString.startsWith('postgresql://'))
  ) {
    throw new Error(
      'Database connection URL (DATABASE_URL or DIRECT_URL) is not configured for seeding.'
    );
  }

  const pool = new pg.Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const allCategories = [...PRODUCT_CATEGORIES, ...SERVICE_CATEGORIES];
    for (const cat of allCategories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          type: cat.type,
          groupName: cat.groupName,
          categoryKey: cat.categoryKey,
          description: cat.description,
          sortOrder: cat.sortOrder,
          isActive: true,
        },
        create: {
          name: cat.name,
          slug: cat.slug,
          type: cat.type,
          groupName: cat.groupName,
          categoryKey: cat.categoryKey,
          description: cat.description,
          sortOrder: cat.sortOrder,
          isActive: true,
        },
      });
    }

    let locationCount = 0;
    for (const provEntry of PAKISTAN_LOCATION_SEED) {
      for (const cityEntry of provEntry.cities) {
        for (const areaName of cityEntry.areas) {
          locationCount += 1;
          await prisma.supportedLocation.upsert({
            where: {
              province_city_areaName: {
                province: provEntry.province,
                city: cityEntry.city,
                areaName,
              },
            },
            update: {
              isEnabled: true,
              sortOrder: locationCount,
            },
            create: {
              province: provEntry.province,
              city: cityEntry.city,
              areaName,
              isEnabled: true,
              sortOrder: locationCount,
            },
          });
        }
      }
    }

    for (const role of ADMIN_ROLE_DEFINITIONS) {
      await prisma.adminRole.upsert({
        where: { code: role.code },
        update: {
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSystemRole: true,
        },
        create: {
          code: role.code,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSystemRole: true,
        },
      });
    }

    console.log(
      `Seeded ${PRODUCT_CATEGORIES.length} product categories, ${SERVICE_CATEGORIES.length} service categories, ${locationCount} Pakistan neighborhood locations, and ${ADMIN_ROLE_DEFINITIONS.length} server-controlled admin role definitions (no user passwords or admin accounts created).`
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  const raw = err instanceof Error ? err.message : 'Unexpected seed error.';
  const safe = raw
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[redacted-database-url]')
    .replace(/password=[^\s;&]+/gi, 'password=[redacted]');
  console.error('[prisma:seed] Failed:', safe);
  process.exit(1);
});
