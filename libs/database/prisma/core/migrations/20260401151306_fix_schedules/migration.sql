-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'EMPLOYEE', 'SYSTEM', 'GUEST', 'OWNER');

-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "BookingEventType" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'EMAIL_SENT', 'CANCELLED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'NOTE_UPDATED', 'DELETED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('ONLINE', 'PHONE', 'WALK_IN', 'STAFF');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('BUY_X_GET_Y');

-- CreateEnum
CREATE TYPE "EmailTemplate" AS ENUM ('WELCOME', 'CREATE_ESTABLISHMENT', 'INVITE_EMPLOYEE', 'QRCODES', 'CREATE_BOOKING', 'CONFIRM_BOOKING', 'CANCEL_BOOKING', 'BOOKING_RECEIVED', 'BOOKING_CANCELLED', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_REACTIVATED', 'SUBSCRIPTION_CANCELED', 'SUBSCRIPTION_PAST_DUE', 'SUBSCRIPTION_TRIAL_STARTED', 'SUBSCRIPTION_TRIAL_ENDED', 'TRIAL_ENDING', 'PLAN_CHANGED', 'INVOICE_PAID', 'INVOICE_FAILED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'UPDATE_BOOKING');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailProvider" AS ENUM ('ZEPTO', 'RESEND', 'SENDGRID', 'SES');

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'RETRY');

-- CreateEnum
CREATE TYPE "EmailLogType" AS ENUM ('SYSTEM', 'TRANSACTIONAL');

-- CreateEnum
CREATE TYPE "EmployeeRoles" AS ENUM ('MANAGER', 'KITCHEN', 'WAITER', 'CHECKOUT');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('ESTABLISHMENT', 'MENU', 'DISCOUNT', 'PROMOTION');

-- CreateEnum
CREATE TYPE "EstablishmentLanguage" AS ENUM ('PT', 'EN', 'ES', 'FR', 'DE', 'IT');

-- CreateEnum
CREATE TYPE "EstablishmentStatus" AS ENUM ('ACTIVE', 'PAYMENT_PENDING', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EstablishmentType" AS ENUM ('RESTAURANT', 'COFFEE', 'HOTEL', 'BAR', 'CATERING', 'CASINO', 'DISCO', 'CLUB', 'ARENA', 'CINEMA', 'LOUNGE', 'RESORT', 'MOTEL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'TIMESTRAL', 'YEARLY');

-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('BOOLEAN', 'QUANTITY');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('CUP', 'DOSE', 'PEOPLE', 'PIECE', 'PORTION', 'SLICE', 'UNIT', 'GLASS', 'MILLILITRE', 'CENTILITRE', 'LITRE', 'GRAM', 'KILOGRAM');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ServicePointType" AS ENUM ('TABLE', 'BOOTH', 'COUNTER', 'ROOM', 'SUNBED', 'GENERAL', 'TERRACE', 'SUITE', 'POOL_SIDE', 'CABANA', 'SEAT', 'SECTOR', 'VIP_BOX', 'STANDING_TABLE', 'LOUNGE_AREA', 'PICKUP_POINT', 'PARKING_SPOT', 'KITCHEN', 'OBSTACLE', 'BEDROOM');

-- CreateEnum
CREATE TYPE "StockUnit" AS ENUM ('UNIT', 'KG', 'GRAM', 'LITRE', 'ML', 'CL', 'PACK', 'BOX', 'BOTTLE', 'CAN', 'BAG', 'PORTION', 'DOSE', 'SHEET', 'METER', 'CM');

-- CreateEnum
CREATE TYPE "StockStorageTemp" AS ENUM ('AMBIENT', 'REFRIGERATED', 'FROZEN', 'CONTROLLED');

-- CreateEnum
CREATE TYPE "StockBatchStatus" AS ENUM ('ACTIVE', 'DEPLETED', 'EXPIRED', 'QUARANTINE', 'RECALLED');

-- CreateEnum
CREATE TYPE "StockEntryType" AS ENUM ('PURCHASE', 'RECEPTION', 'RETURN_FROM_CLIENT', 'INITIAL_STOCK', 'TRANSFER_IN', 'ADJUSTMENT_IN');

-- CreateEnum
CREATE TYPE "StockEntryStatus" AS ENUM ('DRAFT', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED', 'APPROVED');

-- CreateEnum
CREATE TYPE "StockExitType" AS ENUM ('CONSUMPTION', 'SALE', 'WASTE', 'RETURN_TO_SUPPLIER', 'TRANSFER_OUT', 'ADJUSTMENT_OUT', 'SAMPLE');

-- CreateEnum
CREATE TYPE "StockExitStatus" AS ENUM ('DRAFT', 'PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'RECEPTION', 'CONSUMPTION', 'SALE', 'WASTE', 'RETURN_IN', 'RETURN_OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'INVENTORY_CORRECTION', 'INITIAL_STOCK');

-- CreateEnum
CREATE TYPE "StockMovementDir" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "StockAlertType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'OVERSTOCK', 'REORDER_POINT');

-- CreateEnum
CREATE TYPE "StockAlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "StockInventoryStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'USD', 'GBP');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'DRAFT', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AllergenCode" AS ENUM ('CELERY', 'CRUSTACEAN', 'EGG', 'FISH', 'GLUTEN', 'LUPINS', 'MILK', 'MUSTARD', 'NUTS', 'PEANUTS', 'SESAME', 'SHELLFISH', 'SOY', 'SULFITES');

-- CreateEnum
CREATE TYPE "VariantType" AS ENUM ('SIZE', 'FLAVOR', 'PREPARATION', 'COLOR', 'OTHER');

-- CreateEnum
CREATE TYPE "ModifierDisplayMode" AS ENUM ('RADIO', 'CHECKBOX', 'QUANTITY');

-- CreateEnum
CREATE TYPE "SpiceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('VEGAN', 'VEGETARIAN', 'GLUTEN_FREE', 'DAIRY_FREE', 'HALAL', 'KOSHER');

-- CreateEnum
CREATE TYPE "MarketingTag" AS ENUM ('BESTSELLER', 'NEW', 'POPULAR', 'LIMITED');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('DEFAULT', 'RODIZIO');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorType" "ActorType" NOT NULL,
    "action" "LogAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRules" (
    "id" TEXT NOT NULL,
    "minDaysInAdvance" INTEGER NOT NULL DEFAULT 0,
    "maxDaysInAdvance" INTEGER NOT NULL DEFAULT 90,
    "minGuestsPerBooking" INTEGER NOT NULL DEFAULT 1,
    "maxGuestsPerBooking" INTEGER NOT NULL DEFAULT 10,
    "defaultDuration" INTEGER NOT NULL DEFAULT 120,
    "autoConfirm" BOOLEAN NOT NULL DEFAULT true,
    "allowCancellation" BOOLEAN NOT NULL DEFAULT true,
    "cancellationHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "establishmentId" TEXT NOT NULL,

    CONSTRAINT "BookingRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstablishmentAvailability" (
    "id" TEXT NOT NULL,
    "availableDate" DATE NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "establishmentId" TEXT NOT NULL,

    CONSTRAINT "EstablishmentAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityTimeSlot" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "maxBookings" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "availabilityId" TEXT NOT NULL,

    CONSTRAINT "AvailabilityTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingDate" DATE NOT NULL,
    "bookingTime" TEXT NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "specialRequests" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "confirmationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "userId" TEXT,
    "establishmentId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "internalNotes" TEXT,
    "source" "BookingSource" NOT NULL DEFAULT 'ONLINE',

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_logs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "event" "BookingEventType" NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorType" "ActorType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountTarget" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "itemId" TEXT,
    "posCategoryId" TEXT,

    CONSTRAINT "DiscountTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyXGetYRule" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "requiredItemId" TEXT NOT NULL,
    "requiredQuantity" INTEGER NOT NULL,
    "rewardItemId" TEXT NOT NULL,
    "rewardQuantity" INTEGER NOT NULL,
    "applyCheapest" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BuyXGetYRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "userId" TEXT,
    "to" TEXT NOT NULL,
    "template" "EmailTemplate" NOT NULL,
    "type" "EmailLogType" NOT NULL DEFAULT 'TRANSACTIONAL',
    "lang" VARCHAR(5) NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" "EmailProvider" NOT NULL DEFAULT 'ZEPTO',
    "providerMessageId" TEXT,
    "providerStatusCode" INTEGER,
    "providerMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "context" JSONB,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "attachmentsCount" INTEGER NOT NULL DEFAULT 0,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "complainedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "emailLogId" TEXT NOT NULL,
    "event" "EmailEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "authCode" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "EmployeeRoles" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "refreshTokenHash" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "establishmentId" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "EstablishmentType" NOT NULL,
    "status" "EstablishmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "billingName" TEXT NOT NULL,
    "billingTaxId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "facebookUrl" TEXT,
    "googleReviewUrl" TEXT,
    "tripAdvisorUrl" TEXT,
    "primaryLanguage" "EstablishmentLanguage" NOT NULL DEFAULT 'PT',
    "availableLanguages" "EstablishmentLanguage"[] DEFAULT ARRAY['PT']::"EstablishmentLanguage"[],
    "currency" "Currency" NOT NULL DEFAULT 'EUR',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Lisbon',
    "onlyMenu" BOOLEAN NOT NULL DEFAULT false,
    "needSession" BOOLEAN NOT NULL DEFAULT true,
    "logoImageId" TEXT,
    "bannerImageId" TEXT,
    "activeThemeId" TEXT,
    "scheduleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstablishmentBookingSettings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "themeName" TEXT NOT NULL DEFAULT 'default',
    "themeMode" TEXT NOT NULL DEFAULT 'light',
    "establishmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationEmail" TEXT,
    "notificationPhone" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#f97316',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstablishmentBookingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "cloudflareImageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "establishmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstablishmentIntegrations" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eupagoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "eupagoApiKey" TEXT,
    "eupagoCryptoKey" TEXT,
    "biziqEnabled" BOOLEAN NOT NULL DEFAULT false,
    "biziqAccountId" TEXT,
    "biziqApiKey" TEXT,
    "biziqCompanyVat" TEXT,
    "vivaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vivaClientId" TEXT,
    "vivaClientSecret" TEXT,
    "sumupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sumupApiKey" TEXT,
    "sumupMerchantCode" TEXT,
    "vendusEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vendusApiKey" TEXT,

    CONSTRAINT "EstablishmentIntegrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SumupReader" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "name" TEXT,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SumupReader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VivaTerminal" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "alias" TEXT,
    "posId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VivaTerminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "imageId" TEXT,
    "establishmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "basePrice" DECIMAL(10,2),
    "deletedAt" TIMESTAMP(3),
    "posCategoryId" TEXT,
    "quantity" DOUBLE PRECISION,
    "sku" TEXT,
    "unit" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "taxTableId" TEXT NOT NULL,
    "marketingTag" "MarketingTag",
    "spiceLevel" "SpiceLevel",
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "vendusProductId" INTEGER,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemNutritionInfo" (
    "id" TEXT NOT NULL,
    "energyKcal" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "saturatedFat" DOUBLE PRECISION,
    "carbohydrates" DOUBLE PRECISION,
    "sugars" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "salt" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemId" TEXT,

    CONSTRAINT "ItemNutritionInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantNutrionalInfo" (
    "id" TEXT NOT NULL,
    "energyKcal" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "saturatedFat" DOUBLE PRECISION,
    "carbohydrates" DOUBLE PRECISION,
    "sugars" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "salt" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemVariantId" TEXT,

    CONSTRAINT "VariantNutrionalInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "ItemTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantOption" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "type" "VariantType" NOT NULL DEFAULT 'OTHER',

    CONSTRAINT "VariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantOptionTranslation" (
    "id" TEXT NOT NULL,
    "variantOptionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "VariantOptionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVariantGroup" (
    "itemId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "id" TEXT NOT NULL,

    CONSTRAINT "ItemVariantGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVariantGroupTranslation" (
    "id" TEXT NOT NULL,
    "itemVariantGroupId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ItemVariantGroupTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVariant" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "sku" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageId" TEXT,
    "itemVariantGroupId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "variantOptionId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ItemVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemModifierGroup" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "minSelection" INTEGER NOT NULL DEFAULT 0,
    "maxSelection" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "displayMode" "ModifierDisplayMode" NOT NULL DEFAULT 'RADIO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ItemModifierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemModifierGroupTranslation" (
    "id" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ItemModifierGroupTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddonTranslation" (
    "id" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AddonTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergen" (
    "id" TEXT NOT NULL,
    "code" "AllergenCode" NOT NULL,

    CONSTRAINT "Allergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAllergen" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "allergenId" TEXT NOT NULL,

    CONSTRAINT "ItemAllergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVariantAllergen" (
    "id" TEXT NOT NULL,
    "itemVariantId" TEXT NOT NULL,
    "allergenId" TEXT NOT NULL,

    CONSTRAINT "ItemVariantAllergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemModifierOption" (
    "id" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "position" INTEGER NOT NULL DEFAULT 0,
    "defaultQuantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "addonId" TEXT,
    "productId" TEXT,
    "itemVariantId" TEXT,

    CONSTRAINT "ItemModifierOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAttribute" (
    "id" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "ItemAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPage" (
    "id" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "themeId" TEXT,
    "establishmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPageTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "landingPageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPageTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "establishmentId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "maxItemsPerOrder" INTEGER,
    "price" DOUBLE PRECISION,
    "type" "MenuType" NOT NULL DEFAULT 'DEFAULT',

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "observations" TEXT,
    "menuId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "imageId" TEXT,
    "menuId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategoryTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuSubcategory" (
    "id" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuSubcategoryTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subcategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuSubcategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemPosition" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isIncluded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MenuItemPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moloni_tokens" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "refreshExpiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "establishmentId" TEXT,

    CONSTRAINT "moloni_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemVariantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "modifierTotal" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "promotionAmount" DECIMAL(10,2) NOT NULL,
    "finalPrice" DECIMAL(10,2) NOT NULL,
    "promotionId" TEXT,
    "discountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,

    CONSTRAINT "POSCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "pairingKey" TEXT,
    "deviceToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3),
    "establishmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "friendlyName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleDay" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeInterval" (
    "id" TEXT NOT NULL,
    "scheduleDayId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeInterval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockWarehouse" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StockWarehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLocation" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "aisle" TEXT,
    "shelf" TEXT,
    "bin" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'PT',
    "contactPerson" TEXT,
    "paymentTermDays" INTEGER DEFAULT 30,
    "currency" TEXT DEFAULT 'EUR',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCategory" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6366f1',
    "icon" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "categoryId" TEXT,
    "warehouseId" TEXT,
    "locationId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "unit" "StockUnit" NOT NULL DEFAULT 'UNIT',
    "unitWeight" DOUBLE PRECISION,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStockLevel" DOUBLE PRECISION,
    "maxStockLevel" DOUBLE PRECISION,
    "reorderPoint" DOUBLE PRECISION,
    "reorderQty" DOUBLE PRECISION,
    "averageCost" DECIMAL(10,4),
    "lastCost" DECIMAL(10,4),
    "isPerishable" BOOLEAN NOT NULL DEFAULT false,
    "shelfLifeDays" INTEGER,
    "storageTemp" "StockStorageTemp",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTracked" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItemSupplier" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierCode" TEXT,
    "lastPurchasePrice" DECIMAL(10,4),
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItemSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBatch" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "locationId" TEXT,
    "batchNumber" TEXT NOT NULL,
    "lotNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "manufactureDate" TIMESTAMP(3),
    "quantity" DOUBLE PRECISION NOT NULL,
    "remainingQty" DOUBLE PRECISION NOT NULL,
    "costPerUnit" DECIMAL(10,4),
    "status" "StockBatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockEntry" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "supplierId" TEXT,
    "type" "StockEntryType" NOT NULL,
    "status" "StockEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "reference" TEXT,
    "supplierRef" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(10,2),
    "taxAmount" DECIMAL(10,2),
    "discountAmount" DECIMAL(10,2),
    "notes" TEXT,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockEntryItem" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "batchId" TEXT,
    "orderedQty" DOUBLE PRECISION,
    "receivedQty" DOUBLE PRECISION NOT NULL,
    "unitCost" DECIMAL(10,4) NOT NULL,
    "totalCost" DECIMAL(10,4) NOT NULL,
    "taxRate" DECIMAL(5,2),
    "discountRate" DECIMAL(5,2),
    "expiryDate" TIMESTAMP(3),
    "lotNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockEntryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockExit" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "type" "StockExitType" NOT NULL,
    "status" "StockExitStatus" NOT NULL DEFAULT 'DRAFT',
    "reference" TEXT,
    "exitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "totalAmount" DECIMAL(10,2),
    "notes" TEXT,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockExit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockExitItem" (
    "id" TEXT NOT NULL,
    "exitId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DECIMAL(10,4),
    "totalCost" DECIMAL(10,4),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockExitItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "direction" "StockMovementDir" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "quantityBefore" DOUBLE PRECISION NOT NULL,
    "quantityAfter" DOUBLE PRECISION NOT NULL,
    "unitCost" DECIMAL(10,4),
    "entryId" TEXT,
    "exitId" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "type" "StockAlertType" NOT NULL,
    "status" "StockAlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "message" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockInventoryCount" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "StockInventoryStatus" NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockInventoryCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockInventoryCountItem" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "expectedQty" DOUBLE PRECISION NOT NULL,
    "countedQty" DOUBLE PRECISION,
    "difference" DOUBLE PRECISION,
    "unitCost" DECIMAL(10,4),
    "notes" TEXT,
    "countedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockInventoryCountItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "planCycleId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL,
    "cancelAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancellationComment" TEXT,
    "cancellationFeedback" TEXT,
    "cancellationReason" TEXT,
    "endedAt" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanCycle" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "cycle" "BillingCycle" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "priceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FeatureType" NOT NULL,
    "showInPlans" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFeature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "valueBoolean" BOOLEAN,
    "valueQuantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxTable" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "region" TEXT,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "fiscalCode" TEXT NOT NULL,

    CONSTRAINT "TaxTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "establishmentId" TEXT,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "requestId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "establishmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ServicePointType" NOT NULL DEFAULT 'TABLE',
    "maxCapacity" INTEGER NOT NULL DEFAULT 4,
    "minCapacity" INTEGER NOT NULL DEFAULT 1,
    "isReservable" BOOLEAN NOT NULL DEFAULT true,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "height" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shape" TEXT NOT NULL DEFAULT 'rectangle',
    "width" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "z" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ServicePoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_establishmentId_createdAt_idx" ON "audit_logs"("establishmentId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "BookingRules_establishmentId_key" ON "BookingRules"("establishmentId");

-- CreateIndex
CREATE INDEX "BookingRules_establishmentId_idx" ON "BookingRules"("establishmentId");

-- CreateIndex
CREATE INDEX "EstablishmentAvailability_establishmentId_idx" ON "EstablishmentAvailability"("establishmentId");

-- CreateIndex
CREATE INDEX "EstablishmentAvailability_availableDate_idx" ON "EstablishmentAvailability"("availableDate");

-- CreateIndex
CREATE UNIQUE INDEX "EstablishmentAvailability_establishmentId_availableDate_key" ON "EstablishmentAvailability"("establishmentId", "availableDate");

-- CreateIndex
CREATE INDEX "AvailabilityTimeSlot_availabilityId_idx" ON "AvailabilityTimeSlot"("availabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityTimeSlot_availabilityId_slot_key" ON "AvailabilityTimeSlot"("availabilityId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_confirmationCode_key" ON "Booking"("confirmationCode");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_establishmentId_idx" ON "Booking"("establishmentId");

-- CreateIndex
CREATE INDEX "Booking_bookingDate_idx" ON "Booking"("bookingDate");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_confirmationCode_idx" ON "Booking"("confirmationCode");

-- CreateIndex
CREATE INDEX "Booking_customerEmail_idx" ON "Booking"("customerEmail");

-- CreateIndex
CREATE INDEX "booking_logs_bookingId_createdAt_idx" ON "booking_logs"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "booking_logs_bookingId_event_idx" ON "booking_logs"("bookingId", "event");

-- CreateIndex
CREATE INDEX "Discount_establishmentId_isActive_idx" ON "Discount"("establishmentId", "isActive");

-- CreateIndex
CREATE INDEX "Discount_scheduleId_idx" ON "Discount"("scheduleId");

-- CreateIndex
CREATE INDEX "DiscountTarget_discountId_idx" ON "DiscountTarget"("discountId");

-- CreateIndex
CREATE INDEX "Promotion_establishmentId_isActive_idx" ON "Promotion"("establishmentId", "isActive");

-- CreateIndex
CREATE INDEX "Promotion_scheduleId_idx" ON "Promotion"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyXGetYRule_promotionId_key" ON "BuyXGetYRule"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_providerMessageId_key" ON "EmailLog"("providerMessageId");

-- CreateIndex
CREATE INDEX "EmailLog_establishmentId_type_createdAt_status_idx" ON "EmailLog"("establishmentId", "type", "createdAt", "status");

-- CreateIndex
CREATE INDEX "EmailLog_establishmentId_createdAt_idx" ON "EmailLog"("establishmentId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_establishmentId_status_idx" ON "EmailLog"("establishmentId", "status");

-- CreateIndex
CREATE INDEX "EmailLog_establishmentId_template_idx" ON "EmailLog"("establishmentId", "template");

-- CreateIndex
CREATE INDEX "EmailLog_providerMessageId_idx" ON "EmailLog"("providerMessageId");

-- CreateIndex
CREATE INDEX "EmailLog_status_createdAt_idx" ON "EmailLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_template_type_idx" ON "EmailLog"("template", "type");

-- CreateIndex
CREATE INDEX "EmailLog_to_idx" ON "EmailLog"("to");

-- CreateIndex
CREATE INDEX "EmailLog_userId_idx" ON "EmailLog"("userId");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmailEvent_emailLogId_idx" ON "EmailEvent"("emailLogId");

-- CreateIndex
CREATE INDEX "EmailEvent_emailLogId_event_idx" ON "EmailEvent"("emailLogId", "event");

-- CreateIndex
CREATE INDEX "EmailEvent_occurredAt_idx" ON "EmailEvent"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_establishmentId_role_idx" ON "Employee"("establishmentId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Establishment_slug_key" ON "Establishment"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Establishment_stripeCustomerId_key" ON "Establishment"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Establishment_scheduleId_key" ON "Establishment"("scheduleId");

-- CreateIndex
CREATE INDEX "Establishment_name_idx" ON "Establishment"("name");

-- CreateIndex
CREATE INDEX "Establishment_ownerId_idx" ON "Establishment"("ownerId");

-- CreateIndex
CREATE INDEX "Establishment_scheduleId_idx" ON "Establishment"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "EstablishmentBookingSettings_establishmentId_key" ON "EstablishmentBookingSettings"("establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Image_cloudflareImageId_key" ON "Image"("cloudflareImageId");

-- CreateIndex
CREATE INDEX "Image_establishmentId_idx" ON "Image"("establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "EstablishmentIntegrations_establishmentId_key" ON "EstablishmentIntegrations"("establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SumupReader_establishmentId_readerId_key" ON "SumupReader"("establishmentId", "readerId");

-- CreateIndex
CREATE UNIQUE INDEX "VivaTerminal_establishmentId_terminalId_key" ON "VivaTerminal"("establishmentId", "terminalId");

-- CreateIndex
CREATE INDEX "Item_establishmentId_status_idx" ON "Item"("establishmentId", "status");

-- CreateIndex
CREATE INDEX "Item_deletedAt_idx" ON "Item"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Item_establishmentId_sku_key" ON "Item"("establishmentId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "ItemNutritionInfo_itemId_key" ON "ItemNutritionInfo"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantNutrionalInfo_itemVariantId_key" ON "VariantNutrionalInfo"("itemVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemTranslation_itemId_locale_key" ON "ItemTranslation"("itemId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "VariantOption_code_key" ON "VariantOption"("code");

-- CreateIndex
CREATE INDEX "VariantOption_establishmentId_idx" ON "VariantOption"("establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantOptionTranslation_variantOptionId_locale_key" ON "VariantOptionTranslation"("variantOptionId", "locale");

-- CreateIndex
CREATE INDEX "ItemVariantGroup_itemId_idx" ON "ItemVariantGroup"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemVariantGroupTranslation_itemVariantGroupId_locale_key" ON "ItemVariantGroupTranslation"("itemVariantGroupId", "locale");

-- CreateIndex
CREATE INDEX "ItemVariant_itemId_idx" ON "ItemVariant"("itemId");

-- CreateIndex
CREATE INDEX "ItemVariant_deletedAt_idx" ON "ItemVariant"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ItemVariant_itemVariantGroupId_variantOptionId_key" ON "ItemVariant"("itemVariantGroupId", "variantOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemVariant_id_sku_key" ON "ItemVariant"("id", "sku");

-- CreateIndex
CREATE INDEX "ItemModifierGroup_deletedAt_idx" ON "ItemModifierGroup"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ItemModifierGroupTranslation_modifierGroupId_locale_key" ON "ItemModifierGroupTranslation"("modifierGroupId", "locale");

-- CreateIndex
CREATE INDEX "Addon_establishmentId_idx" ON "Addon"("establishmentId");

-- CreateIndex
CREATE INDEX "Addon_isGlobal_idx" ON "Addon"("isGlobal");

-- CreateIndex
CREATE UNIQUE INDEX "AddonTranslation_addonId_locale_key" ON "AddonTranslation"("addonId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Allergen_code_key" ON "Allergen"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ItemAllergen_itemId_allergenId_key" ON "ItemAllergen"("itemId", "allergenId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemVariantAllergen_itemVariantId_allergenId_key" ON "ItemVariantAllergen"("itemVariantId", "allergenId");

-- CreateIndex
CREATE INDEX "ItemModifierOption_modifierGroupId_idx" ON "ItemModifierOption"("modifierGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemAttribute_itemId_type_key" ON "ItemAttribute"("itemId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_establishmentId_key" ON "LandingPage"("establishmentId");

-- CreateIndex
CREATE INDEX "Menu_establishmentId_idx" ON "Menu"("establishmentId");

-- CreateIndex
CREATE INDEX "Menu_establishmentId_position_idx" ON "Menu"("establishmentId", "position");

-- CreateIndex
CREATE INDEX "Menu_scheduleId_idx" ON "Menu"("scheduleId");

-- CreateIndex
CREATE INDEX "MenuTranslation_menuId_idx" ON "MenuTranslation"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuTranslation_menuId_locale_key" ON "MenuTranslation"("menuId", "locale");

-- CreateIndex
CREATE INDEX "MenuCategory_menuId_idx" ON "MenuCategory"("menuId");

-- CreateIndex
CREATE INDEX "MenuCategory_menuId_position_idx" ON "MenuCategory"("menuId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategoryTranslation_categoryId_locale_key" ON "MenuCategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE INDEX "MenuSubcategory_categoryId_idx" ON "MenuSubcategory"("categoryId");

-- CreateIndex
CREATE INDEX "MenuSubcategory_categoryId_position_idx" ON "MenuSubcategory"("categoryId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MenuSubcategoryTranslation_subcategoryId_locale_key" ON "MenuSubcategoryTranslation"("subcategoryId", "locale");

-- CreateIndex
CREATE INDEX "MenuItemPosition_itemId_idx" ON "MenuItemPosition"("itemId");

-- CreateIndex
CREATE INDEX "MenuItemPosition_subcategoryId_idx" ON "MenuItemPosition"("subcategoryId");

-- CreateIndex
CREATE INDEX "MenuItemPosition_subcategoryId_position_idx" ON "MenuItemPosition"("subcategoryId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemPosition_itemId_subcategoryId_key" ON "MenuItemPosition"("itemId", "subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "moloni_tokens_establishmentId_key" ON "moloni_tokens"("establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_pairingKey_key" ON "devices"("pairingKey");

-- CreateIndex
CREATE UNIQUE INDEX "devices_deviceToken_key" ON "devices"("deviceToken");

-- CreateIndex
CREATE UNIQUE INDEX "printers_deviceId_name_key" ON "printers"("deviceId", "name");

-- CreateIndex
CREATE INDEX "ScheduleDay_scheduleId_idx" ON "ScheduleDay"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleDay_scheduleId_dayOfWeek_key" ON "ScheduleDay"("scheduleId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TimeInterval_scheduleDayId_idx" ON "TimeInterval"("scheduleDayId");

-- CreateIndex
CREATE INDEX "StockWarehouse_establishmentId_isActive_idx" ON "StockWarehouse"("establishmentId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StockWarehouse_establishmentId_code_key" ON "StockWarehouse"("establishmentId", "code");

-- CreateIndex
CREATE INDEX "StockLocation_warehouseId_idx" ON "StockLocation"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "StockLocation_warehouseId_code_key" ON "StockLocation"("warehouseId", "code");

-- CreateIndex
CREATE INDEX "Supplier_establishmentId_isActive_idx" ON "Supplier"("establishmentId", "isActive");

-- CreateIndex
CREATE INDEX "Supplier_establishmentId_name_idx" ON "Supplier"("establishmentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_establishmentId_code_key" ON "Supplier"("establishmentId", "code");

-- CreateIndex
CREATE INDEX "StockCategory_establishmentId_idx" ON "StockCategory"("establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StockCategory_establishmentId_name_key" ON "StockCategory"("establishmentId", "name");

-- CreateIndex
CREATE INDEX "StockItem_establishmentId_isActive_idx" ON "StockItem"("establishmentId", "isActive");

-- CreateIndex
CREATE INDEX "StockItem_establishmentId_categoryId_idx" ON "StockItem"("establishmentId", "categoryId");

-- CreateIndex
CREATE INDEX "StockItem_establishmentId_warehouseId_idx" ON "StockItem"("establishmentId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_establishmentId_sku_key" ON "StockItem"("establishmentId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "StockItemSupplier_stockItemId_supplierId_key" ON "StockItemSupplier"("stockItemId", "supplierId");

-- CreateIndex
CREATE INDEX "StockBatch_stockItemId_status_idx" ON "StockBatch"("stockItemId", "status");

-- CreateIndex
CREATE INDEX "StockBatch_expiryDate_idx" ON "StockBatch"("expiryDate");

-- CreateIndex
CREATE INDEX "StockEntry_establishmentId_status_idx" ON "StockEntry"("establishmentId", "status");

-- CreateIndex
CREATE INDEX "StockEntry_establishmentId_entryDate_idx" ON "StockEntry"("establishmentId", "entryDate");

-- CreateIndex
CREATE INDEX "StockEntry_establishmentId_type_idx" ON "StockEntry"("establishmentId", "type");

-- CreateIndex
CREATE INDEX "StockEntryItem_entryId_idx" ON "StockEntryItem"("entryId");

-- CreateIndex
CREATE INDEX "StockEntryItem_stockItemId_idx" ON "StockEntryItem"("stockItemId");

-- CreateIndex
CREATE INDEX "StockExit_establishmentId_status_idx" ON "StockExit"("establishmentId", "status");

-- CreateIndex
CREATE INDEX "StockExit_establishmentId_exitDate_idx" ON "StockExit"("establishmentId", "exitDate");

-- CreateIndex
CREATE INDEX "StockExit_establishmentId_type_idx" ON "StockExit"("establishmentId", "type");

-- CreateIndex
CREATE INDEX "StockExitItem_exitId_idx" ON "StockExitItem"("exitId");

-- CreateIndex
CREATE INDEX "StockExitItem_stockItemId_idx" ON "StockExitItem"("stockItemId");

-- CreateIndex
CREATE INDEX "StockMovement_establishmentId_stockItemId_idx" ON "StockMovement"("establishmentId", "stockItemId");

-- CreateIndex
CREATE INDEX "StockMovement_establishmentId_createdAt_idx" ON "StockMovement"("establishmentId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_establishmentId_type_idx" ON "StockMovement"("establishmentId", "type");

-- CreateIndex
CREATE INDEX "StockAlert_establishmentId_status_idx" ON "StockAlert"("establishmentId", "status");

-- CreateIndex
CREATE INDEX "StockAlert_establishmentId_type_idx" ON "StockAlert"("establishmentId", "type");

-- CreateIndex
CREATE INDEX "StockInventoryCount_establishmentId_status_idx" ON "StockInventoryCount"("establishmentId", "status");

-- CreateIndex
CREATE INDEX "StockInventoryCountItem_inventoryId_idx" ON "StockInventoryCountItem"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StockInventoryCountItem_inventoryId_stockItemId_key" ON "StockInventoryCountItem"("inventoryId", "stockItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_establishmentId_key" ON "Subscription"("establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_establishmentId_idx" ON "Subscription"("establishmentId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_status_idx" ON "Subscription"("stripeCustomerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PlanCycle_priceId_key" ON "PlanCycle"("priceId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanCycle_planId_cycle_key" ON "PlanCycle"("planId", "cycle");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_name_key" ON "Feature"("name");

-- CreateIndex
CREATE INDEX "PlanFeature_featureId_idx" ON "PlanFeature"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFeature_planId_featureId_key" ON "PlanFeature"("planId", "featureId");

-- CreateIndex
CREATE INDEX "TaxTable_countryCode_idx" ON "TaxTable"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "TaxTable_countryCode_region_fiscalCode_key" ON "TaxTable"("countryCode", "region", "fiscalCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_requestId_key" ON "WebhookEvent"("requestId");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_idx" ON "WebhookEvent"("provider");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");

-- CreateIndex
CREATE INDEX "WebhookEvent_expiresAt_idx" ON "WebhookEvent"("expiresAt");

-- CreateIndex
CREATE INDEX "WebhookEvent_requestId_idx" ON "WebhookEvent"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "ServiceZone_establishmentId_idx" ON "ServiceZone"("establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePoint_token_key" ON "ServicePoint"("token");

-- CreateIndex
CREATE INDEX "ServicePoint_zoneId_idx" ON "ServicePoint"("zoneId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRules" ADD CONSTRAINT "BookingRules_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstablishmentAvailability" ADD CONSTRAINT "EstablishmentAvailability_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityTimeSlot" ADD CONSTRAINT "AvailabilityTimeSlot_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "EstablishmentAvailability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "AvailabilityTimeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_logs" ADD CONSTRAINT "booking_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountTarget" ADD CONSTRAINT "DiscountTarget_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountTarget" ADD CONSTRAINT "DiscountTarget_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyXGetYRule" ADD CONSTRAINT "BuyXGetYRule_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyXGetYRule" ADD CONSTRAINT "BuyXGetYRule_requiredItemId_fkey" FOREIGN KEY ("requiredItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyXGetYRule" ADD CONSTRAINT "BuyXGetYRule_rewardItemId_fkey" FOREIGN KEY ("rewardItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_emailLogId_fkey" FOREIGN KEY ("emailLogId") REFERENCES "EmailLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_activeThemeId_fkey" FOREIGN KEY ("activeThemeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_logoImageId_fkey" FOREIGN KEY ("logoImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_bannerImageId_fkey" FOREIGN KEY ("bannerImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstablishmentBookingSettings" ADD CONSTRAINT "EstablishmentBookingSettings_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstablishmentIntegrations" ADD CONSTRAINT "EstablishmentIntegrations_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SumupReader" ADD CONSTRAINT "SumupReader_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VivaTerminal" ADD CONSTRAINT "VivaTerminal_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_posCategoryId_fkey" FOREIGN KEY ("posCategoryId") REFERENCES "POSCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_taxTableId_fkey" FOREIGN KEY ("taxTableId") REFERENCES "TaxTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemNutritionInfo" ADD CONSTRAINT "ItemNutritionInfo_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantNutrionalInfo" ADD CONSTRAINT "VariantNutrionalInfo_itemVariantId_fkey" FOREIGN KEY ("itemVariantId") REFERENCES "ItemVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTranslation" ADD CONSTRAINT "ItemTranslation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantOption" ADD CONSTRAINT "VariantOption_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantOptionTranslation" ADD CONSTRAINT "VariantOptionTranslation_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "VariantOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVariantGroup" ADD CONSTRAINT "ItemVariantGroup_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVariantGroupTranslation" ADD CONSTRAINT "ItemVariantGroupTranslation_itemVariantGroupId_fkey" FOREIGN KEY ("itemVariantGroupId") REFERENCES "ItemVariantGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVariant" ADD CONSTRAINT "ItemVariant_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVariant" ADD CONSTRAINT "ItemVariant_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVariant" ADD CONSTRAINT "ItemVariant_itemVariantGroupId_fkey" FOREIGN KEY ("itemVariantGroupId") REFERENCES "ItemVariantGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVariant" ADD CONSTRAINT "ItemVariant_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "VariantOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModifierGroup" ADD CONSTRAINT "ItemModifierGroup_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModifierGroupTranslation" ADD CONSTRAINT "ItemModifierGroupTranslation_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "ItemModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonTranslation" ADD CONSTRAINT "AddonTranslation_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "Addon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAllergen" ADD CONSTRAINT "ItemAllergen_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES "Allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAllergen" ADD CONSTRAINT "ItemAllergen_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVariantAllergen" ADD CONSTRAINT "ItemVariantAllergen_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES "Allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVariantAllergen" ADD CONSTRAINT "ItemVariantAllergen_itemVariantId_fkey" FOREIGN KEY ("itemVariantId") REFERENCES "ItemVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModifierOption" ADD CONSTRAINT "ItemModifierOption_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "Addon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModifierOption" ADD CONSTRAINT "ItemModifierOption_itemVariantId_fkey" FOREIGN KEY ("itemVariantId") REFERENCES "ItemVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModifierOption" ADD CONSTRAINT "ItemModifierOption_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "ItemModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModifierOption" ADD CONSTRAINT "ItemModifierOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAttribute" ADD CONSTRAINT "ItemAttribute_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPageTranslation" ADD CONSTRAINT "LandingPageTranslation_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuTranslation" ADD CONSTRAINT "MenuTranslation_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategoryTranslation" ADD CONSTRAINT "MenuCategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuSubcategory" ADD CONSTRAINT "MenuSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuSubcategoryTranslation" ADD CONSTRAINT "MenuSubcategoryTranslation_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "MenuSubcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemPosition" ADD CONSTRAINT "MenuItemPosition_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemPosition" ADD CONSTRAINT "MenuItemPosition_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "MenuSubcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printers" ADD CONSTRAINT "printers_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDay" ADD CONSTRAINT "ScheduleDay_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeInterval" ADD CONSTRAINT "TimeInterval_scheduleDayId_fkey" FOREIGN KEY ("scheduleDayId") REFERENCES "ScheduleDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockWarehouse" ADD CONSTRAINT "StockWarehouse_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLocation" ADD CONSTRAINT "StockLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "StockWarehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCategory" ADD CONSTRAINT "StockCategory_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCategory" ADD CONSTRAINT "StockCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StockCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "StockCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "StockWarehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StockLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItemSupplier" ADD CONSTRAINT "StockItemSupplier_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItemSupplier" ADD CONSTRAINT "StockItemSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StockLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntryItem" ADD CONSTRAINT "StockEntryItem_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "StockEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntryItem" ADD CONSTRAINT "StockEntryItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntryItem" ADD CONSTRAINT "StockEntryItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockExit" ADD CONSTRAINT "StockExit_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockExitItem" ADD CONSTRAINT "StockExitItem_exitId_fkey" FOREIGN KEY ("exitId") REFERENCES "StockExit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockExitItem" ADD CONSTRAINT "StockExitItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockExitItem" ADD CONSTRAINT "StockExitItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "StockEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_exitId_fkey" FOREIGN KEY ("exitId") REFERENCES "StockExit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockInventoryCount" ADD CONSTRAINT "StockInventoryCount_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockInventoryCountItem" ADD CONSTRAINT "StockInventoryCountItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "StockInventoryCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockInventoryCountItem" ADD CONSTRAINT "StockInventoryCountItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planCycleId_fkey" FOREIGN KEY ("planCycleId") REFERENCES "PlanCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCycle" ADD CONSTRAINT "PlanCycle_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceZone" ADD CONSTRAINT "ServiceZone_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePoint" ADD CONSTRAINT "ServicePoint_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ServiceZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
