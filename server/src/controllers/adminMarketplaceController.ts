import type { CategoryType, ModerationStatus, Prisma, ProductBadge, ProductStatus, ServiceStatus } from '@prisma/client';
import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { getPrismaClient } from '../config/prisma.ts';
import { extractRequestAuditMeta, recordAdminAuditLog } from '../services/auditLogService.ts';
import type { AuthenticatedRequest } from '../types/api.ts';
import { AppError, sendSuccess } from '../utils/apiResponse.ts';

function requireDb() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'PostgreSQL database is not connected.');
  }
  return prisma;
}

function slugifyText(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `item-${Date.now()}`
  );
}

export const updateProductStatusSchema = z.object({
  action: z
    .enum(['APPROVE', 'FEATURE', 'UNFEATURE', 'SUSPEND', 'REJECT', 'REMOVE'])
    .optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'SOLD', 'REMOVED']).optional(),
  moderationStatus: z.enum(['APPROVED', 'UNDER_REVIEW', 'FLAGGED', 'REMOVED']).optional(),
  reason: z.string().trim().max(300).optional(),
});

export const updateServiceStatusSchema = z.object({
  action: z
    .enum(['VERIFY', 'UNVERIFY', 'FEATURE', 'UNFEATURE', 'SUSPEND', 'ACTIVATE', 'REMOVE'])
    .optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'REMOVED']).optional(),
  moderationStatus: z.enum(['APPROVED', 'UNDER_REVIEW', 'FLAGGED', 'REMOVED']).optional(),
  providerVerified: z.boolean().optional(),
  reason: z.string().trim().max(300).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required.').max(80),
  type: z.enum(['PRODUCT', 'SERVICE']),
  groupName: z.string().trim().min(2, 'Group name is required.').max(80),
  slug: z.string().trim().max(90).optional(),
  description: z.string().trim().max(240).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().trim().min(2).max(80).optional(),
  groupName: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(240).optional(),
  reason: z.string().trim().max(240).optional(),
});

export const createLocationSchema = z.object({
  province: z.string().trim().min(2, 'Province is required.').max(80),
  city: z.string().trim().min(2, 'City is required.').max(80),
  areaName: z.string().trim().min(2, 'Area / neighborhood is required.').max(120),
  isEnabled: z.boolean().optional().default(true),
});

export const updateLocationSchema = z.object({
  isEnabled: z.boolean().optional(),
  province: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  areaName: z.string().trim().min(2).max(120).optional(),
  reason: z.string().trim().max(240).optional(),
});

export async function listAdminProductsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const statusFilter =
      typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : 'ALL';

    const where: Prisma.ProductWhereInput = {};
    if (statusFilter !== 'ALL' && ['ACTIVE', 'PAUSED', 'SOLD', 'REMOVED'].includes(statusFilter)) {
      where.status = statusFilter as ProductStatus;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { area: { contains: search, mode: 'insensitive' } },
        { owner: { fullName: { contains: search, mode: 'insensitive' } } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 150,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            sellerVerified: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: { url: true },
        },
      },
    });

    sendSuccess(res, 200, 'Marketplace products retrieved.', {
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        condition: p.condition,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        currency: p.currency,
        badge: p.badge,
        isFeatured: p.badge === 'HOT',
        stock: p.stock,
        province: p.province,
        city: p.city,
        area: p.area,
        status: p.status,
        moderationStatus: p.moderationStatus,
        primaryImageUrl: p.images[0]?.url || null,
        owner: p.owner,
        category: p.category,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminProductStatusHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const productId = String(req.params.id);
    const body = req.body as z.infer<typeof updateProductStatusSchema>;

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        owner: { select: { id: true, fullName: true, email: true, phone: true, sellerVerified: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
      },
    });

    if (!existing) {
      throw new AppError(404, 'Product listing not found.');
    }

    let nextStatus: ProductStatus = existing.status;
    let nextModeration: ModerationStatus = existing.moderationStatus;
    let nextBadge: ProductBadge | null = existing.badge;
    let auditAction = 'PRODUCT_STATUS_UPDATED';

    if (body.action === 'APPROVE') {
      nextStatus = 'ACTIVE';
      nextModeration = 'APPROVED';
      auditAction = 'PRODUCT_APPROVED';
    } else if (body.action === 'FEATURE') {
      nextStatus = 'ACTIVE';
      nextModeration = 'APPROVED';
      nextBadge = 'HOT';
      auditAction = 'PRODUCT_FEATURED';
    } else if (body.action === 'UNFEATURE') {
      nextBadge = null;
      auditAction = 'PRODUCT_UNFEATURED';
    } else if (body.action === 'SUSPEND' || body.action === 'REJECT') {
      nextStatus = 'PAUSED';
      nextModeration = 'FLAGGED';
      auditAction = body.action === 'REJECT' ? 'PRODUCT_REJECTED' : 'PRODUCT_SUSPENDED';
    } else if (body.action === 'REMOVE') {
      nextStatus = 'REMOVED';
      nextModeration = 'REMOVED';
      auditAction = 'PRODUCT_REMOVED';
    } else {
      if (body.status) nextStatus = body.status as ProductStatus;
      if (body.moderationStatus) nextModeration = body.moderationStatus as ModerationStatus;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextProd = await tx.product.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          moderationStatus: nextModeration,
          badge: nextBadge,
        },
        include: {
          owner: { select: { id: true, fullName: true, email: true, phone: true, sellerVerified: true } },
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
        },
      });

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: auditAction,
        targetType: 'Product',
        targetId: existing.id,
        reason: body.reason || `Updated listing "${existing.title}" (${auditAction}).`,
        previousState: {
          status: existing.status,
          moderationStatus: existing.moderationStatus,
          badge: existing.badge,
        },
        newState: {
          status: nextProd.status,
          moderationStatus: nextProd.moderationStatus,
          badge: nextProd.badge,
        },
        meta,
      });

      return nextProd;
    });

    sendSuccess(res, 200, 'Product listing updated successfully.', {
      product: {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        condition: updated.condition,
        price: Number(updated.price),
        originalPrice: updated.originalPrice ? Number(updated.originalPrice) : null,
        currency: updated.currency,
        badge: updated.badge,
        isFeatured: updated.badge === 'HOT',
        stock: updated.stock,
        province: updated.province,
        city: updated.city,
        area: updated.area,
        status: updated.status,
        moderationStatus: updated.moderationStatus,
        primaryImageUrl: updated.images[0]?.url || null,
        owner: updated.owner,
        category: updated.category,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminServicesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const statusFilter =
      typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : 'ALL';

    const where: Prisma.ServiceWhereInput = {};
    if (statusFilter !== 'ALL' && ['ACTIVE', 'PAUSED', 'REMOVED'].includes(statusFilter)) {
      where.status = statusFilter as ServiceStatus;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { serviceGroup: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { primaryArea: { contains: search, mode: 'insensitive' } },
        { provider: { fullName: { contains: search, mode: 'insensitive' } } },
        { provider: { email: { contains: search, mode: 'insensitive' } } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 150,
      include: {
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            providerVerified: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const serviceIds = services.map((s) => s.id);
    const featureLogs =
      serviceIds.length > 0
        ? await prisma.adminAuditLog.findMany({
            where: {
              targetType: 'Service',
              targetId: { in: serviceIds },
              action: { in: ['SERVICE_FEATURED', 'SERVICE_UNFEATURED'] },
            },
            orderBy: { createdAt: 'desc' },
            select: { targetId: true, action: true },
          })
        : [];

    const featuredStateById = new Map<string, boolean>();
    for (const log of featureLogs) {
      if (!featuredStateById.has(log.targetId)) {
        featuredStateById.set(log.targetId, log.action === 'SERVICE_FEATURED');
      }
    }

    sendSuccess(res, 200, 'Marketplace services retrieved.', {
      services: services.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        serviceGroup: s.serviceGroup,
        startingPrice: Number(s.startingPrice),
        currency: s.currency,
        availability: s.availability,
        workingHours: s.workingHours,
        contactPhone: s.contactPhone,
        province: s.province,
        city: s.city,
        primaryArea: s.primaryArea,
        status: s.status,
        moderationStatus: s.moderationStatus,
        isFeatured: featuredStateById.get(s.id) ?? false,
        provider: s.provider,
        category: s.category,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminServiceStatusHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const serviceId = String(req.params.id);
    const body = req.body as z.infer<typeof updateServiceStatusSchema>;

    const existing = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            providerVerified: true,
          },
        },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!existing) {
      throw new AppError(404, 'Service listing not found.');
    }

    let nextStatus: ServiceStatus = existing.status;
    let nextModeration: ModerationStatus = existing.moderationStatus;
    let nextProviderVerified: boolean | undefined;
    let auditAction = 'SERVICE_STATUS_UPDATED';
    let isFeaturedUpdate: boolean | undefined;

    if (body.action === 'VERIFY') {
      nextStatus = 'ACTIVE';
      nextModeration = 'APPROVED';
      nextProviderVerified = true;
      auditAction = 'SERVICE_VERIFIED';
    } else if (body.action === 'UNVERIFY') {
      nextProviderVerified = false;
      auditAction = 'SERVICE_UNVERIFIED';
    } else if (body.action === 'FEATURE') {
      nextStatus = 'ACTIVE';
      nextModeration = 'APPROVED';
      isFeaturedUpdate = true;
      auditAction = 'SERVICE_FEATURED';
    } else if (body.action === 'UNFEATURE') {
      isFeaturedUpdate = false;
      auditAction = 'SERVICE_UNFEATURED';
    } else if (body.action === 'SUSPEND') {
      nextStatus = 'PAUSED';
      nextModeration = 'FLAGGED';
      auditAction = 'SERVICE_SUSPENDED';
    } else if (body.action === 'ACTIVATE') {
      nextStatus = 'ACTIVE';
      nextModeration = 'APPROVED';
      auditAction = 'SERVICE_ACTIVATED';
    } else if (body.action === 'REMOVE') {
      nextStatus = 'REMOVED';
      nextModeration = 'REMOVED';
      auditAction = 'SERVICE_REMOVED';
    } else {
      if (body.status) nextStatus = body.status as ServiceStatus;
      if (body.moderationStatus) nextModeration = body.moderationStatus as ModerationStatus;
      if (typeof body.providerVerified === 'boolean') nextProviderVerified = body.providerVerified;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (typeof nextProviderVerified === 'boolean') {
        await tx.user.update({
          where: { id: existing.providerId },
          data: { providerVerified: nextProviderVerified },
        });
      }

      const nextSvc = await tx.service.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          moderationStatus: nextModeration,
          ...(isFeaturedUpdate ? { availability: 'AVAILABLE_TODAY' } : {}),
        },
        include: {
          provider: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              providerVerified: true,
            },
          },
          category: { select: { id: true, name: true, slug: true } },
        },
      });

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: auditAction,
        targetType: 'Service',
        targetId: existing.id,
        reason: body.reason || `Updated service "${existing.title}" (${auditAction}).`,
        previousState: {
          status: existing.status,
          moderationStatus: existing.moderationStatus,
          providerVerified: existing.provider.providerVerified,
        },
        newState: {
          status: nextSvc.status,
          moderationStatus: nextSvc.moderationStatus,
          providerVerified: nextSvc.provider.providerVerified,
          ...(typeof isFeaturedUpdate === 'boolean' ? { isFeatured: isFeaturedUpdate } : {}),
        },
        meta,
      });

      return nextSvc;
    });

    let resolvedFeatured = isFeaturedUpdate;
    if (typeof resolvedFeatured !== 'boolean') {
      const lastFeatureLog = await prisma.adminAuditLog.findFirst({
        where: {
          targetType: 'Service',
          targetId: updated.id,
          action: { in: ['SERVICE_FEATURED', 'SERVICE_UNFEATURED'] },
        },
        orderBy: { createdAt: 'desc' },
        select: { action: true },
      });
      resolvedFeatured = lastFeatureLog?.action === 'SERVICE_FEATURED';
    }

    sendSuccess(res, 200, 'Service listing updated successfully.', {
      service: {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        serviceGroup: updated.serviceGroup,
        startingPrice: Number(updated.startingPrice),
        currency: updated.currency,
        availability: updated.availability,
        workingHours: updated.workingHours,
        contactPhone: updated.contactPhone,
        province: updated.province,
        city: updated.city,
        primaryArea: updated.primaryArea,
        status: updated.status,
        moderationStatus: updated.moderationStatus,
        isFeatured: resolvedFeatured,
        provider: updated.provider,
        category: updated.category,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminCategoriesHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const categories = await prisma.category.findMany({
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            products: true,
            services: true,
          },
        },
      },
    });

    sendSuccess(res, 200, 'Marketplace categories retrieved.', { categories });
  } catch (err) {
    next(err);
  }
}

export async function createAdminCategoryHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const body = req.body as z.infer<typeof createCategorySchema>;

    const baseSlug = slugifyText(body.slug || body.name);
    const existingByName = await prisma.category.findUnique({
      where: {
        type_name: {
          type: body.type as CategoryType,
          name: body.name.trim(),
        },
      },
    });
    if (existingByName) {
      throw new AppError(409, `Category "${body.name}" already exists under ${body.type}.`);
    }

    const existingSlug = await prisma.category.findUnique({ where: { slug: baseSlug } });
    const finalSlug = existingSlug ? `${baseSlug}-${body.type.toLowerCase()}` : baseSlug;
    const duplicateFinalSlug = await prisma.category.findUnique({ where: { slug: finalSlug } });
    if (duplicateFinalSlug) {
      throw new AppError(409, `Slug "${finalSlug}" is already in use.`);
    }

    const maxOrder = await prisma.category.aggregate({
      where: { type: body.type as CategoryType },
      _max: { sortOrder: true },
    });

    const created = await prisma.$transaction(async (tx) => {
      const cat = await tx.category.create({
        data: {
          name: body.name.trim(),
          slug: finalSlug,
          type: body.type as CategoryType,
          groupName: body.groupName.trim(),
          categoryKey: body.type === 'PRODUCT' ? 'products' : 'home-services',
          description: body.description?.trim() || null,
          sortOrder: (maxOrder._max.sortOrder ?? 100) + 1,
          isActive: body.isActive ?? true,
        },
        include: {
          _count: { select: { products: true, services: true } },
        },
      });

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: 'CATEGORY_CREATED',
        targetType: 'Category',
        targetId: cat.id,
        reason: `Created ${cat.type} category "${cat.name}".`,
        newState: { name: cat.name, slug: cat.slug, type: cat.type, isActive: cat.isActive },
        meta,
      });

      return cat;
    });

    sendSuccess(res, 201, 'Category created successfully.', { category: created });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminCategoryHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const categoryId = String(req.params.id);
    const body = req.body as z.infer<typeof updateCategorySchema>;

    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      throw new AppError(404, 'Category not found.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cat = await tx.category.update({
        where: { id: existing.id },
        data: {
          ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
          ...(body.name ? { name: body.name.trim() } : {}),
          ...(body.groupName ? { groupName: body.groupName.trim() } : {}),
          ...(body.description !== undefined ? { description: body.description.trim() || null } : {}),
        },
        include: {
          _count: { select: { products: true, services: true } },
        },
      });

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: 'CATEGORY_UPDATED',
        targetType: 'Category',
        targetId: cat.id,
        reason:
          body.reason ||
          `Category "${cat.name}" ${cat.isActive ? 'activated' : 'deactivated'}.`,
        previousState: { name: existing.name, isActive: existing.isActive },
        newState: { name: cat.name, isActive: cat.isActive },
        meta,
      });

      return cat;
    });

    sendSuccess(res, 200, 'Category updated successfully.', { category: updated });
  } catch (err) {
    next(err);
  }
}

export async function listAdminLocationsHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const locations = await prisma.supportedLocation.findMany({
      orderBy: [{ province: 'asc' }, { city: 'asc' }, { sortOrder: 'asc' }, { areaName: 'asc' }],
    });

    sendSuccess(res, 200, 'Supported locations retrieved.', { locations });
  } catch (err) {
    next(err);
  }
}

export async function createAdminLocationHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const body = req.body as z.infer<typeof createLocationSchema>;

    const province = body.province.trim();
    const city = body.city.trim();
    const areaName = body.areaName.trim();

    const existing = await prisma.supportedLocation.findUnique({
      where: {
        province_city_areaName: { province, city, areaName },
      },
    });

    if (existing) {
      throw new AppError(409, `Location "${areaName}, ${city} (${province})" already exists.`);
    }

    const maxOrder = await prisma.supportedLocation.aggregate({
      _max: { sortOrder: true },
    });

    const created = await prisma.$transaction(async (tx) => {
      const loc = await tx.supportedLocation.create({
        data: {
          province,
          city,
          areaName,
          isEnabled: body.isEnabled ?? true,
          sortOrder: (maxOrder._max.sortOrder ?? 50) + 1,
        },
      });

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: 'LOCATION_CREATED',
        targetType: 'SupportedLocation',
        targetId: loc.id,
        reason: `Added supported location "${loc.areaName}, ${loc.city}".`,
        newState: { province: loc.province, city: loc.city, areaName: loc.areaName, isEnabled: loc.isEnabled },
        meta,
      });

      return loc;
    });

    sendSuccess(res, 201, 'Supported location added successfully.', { location: created });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminLocationHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = requireDb();
    const actor = req.adminAuth!;
    const meta = extractRequestAuditMeta(req);
    const locationId = String(req.params.id);
    const body = req.body as z.infer<typeof updateLocationSchema>;

    const existing = await prisma.supportedLocation.findUnique({ where: { id: locationId } });
    if (!existing) {
      throw new AppError(404, 'Supported location not found.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const loc = await tx.supportedLocation.update({
        where: { id: existing.id },
        data: {
          ...(typeof body.isEnabled === 'boolean' ? { isEnabled: body.isEnabled } : {}),
          ...(body.province ? { province: body.province.trim() } : {}),
          ...(body.city ? { city: body.city.trim() } : {}),
          ...(body.areaName ? { areaName: body.areaName.trim() } : {}),
        },
      });

      await recordAdminAuditLog(tx, {
        actorUserId: actor.userId,
        actorRoleCode: actor.activeRole,
        action: 'LOCATION_UPDATED',
        targetType: 'SupportedLocation',
        targetId: loc.id,
        reason:
          body.reason ||
          `Location "${loc.areaName}, ${loc.city}" ${loc.isEnabled ? 'enabled' : 'disabled'}.`,
        previousState: { isEnabled: existing.isEnabled },
        newState: { isEnabled: loc.isEnabled },
        meta,
      });

      return loc;
    });

    sendSuccess(res, 200, 'Supported location updated successfully.', { location: updated });
  } catch (err) {
    next(err);
  }
}
