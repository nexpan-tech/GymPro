-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AnnouncementAudience" AS ENUM ('ALL', 'MEMBERS', 'TRAINERS', 'STAFF', 'BRANCH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."AnnouncementPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."AnnouncementStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."AttendanceSource" AS ENUM ('QR', 'MANUAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('CHECKED_IN', 'CHECKED_OUT');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'CHECK_IN');

-- CreateEnum
CREATE TYPE "public"."BadgeType" AS ENUM ('ATTENDANCE', 'STREAK', 'GOAL', 'PROGRESS', 'SPECIAL');

-- CreateEnum
CREATE TYPE "public"."CampaignType" AS ENUM ('PROMOTIONAL', 'REFERRAL', 'REACTIVATION', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "public"."ChallengeStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ChallengeType" AS ENUM ('ATTENDANCE', 'WORKOUT', 'WEIGHT_LOSS', 'CONSISTENCY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."CommChannel" AS ENUM ('IN_APP', 'PUSH', 'EMAIL', 'SMS', 'WHATSAPP', 'SOCKET');

-- CreateEnum
CREATE TYPE "public"."CommunityGroupType" AS ENUM ('FITNESS', 'WEIGHT_LOSS', 'BODYBUILDING', 'YOGA', 'CROSSFIT', 'RUNNING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."DeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "public"."DueStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "public"."ExerciseCategory" AS ENUM ('STRENGTH', 'CARDIO', 'FLEXIBILITY', 'MOBILITY', 'WARMUP', 'STRETCHING');

-- CreateEnum
CREATE TYPE "public"."FeedbackRating" AS ENUM ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE');

-- CreateEnum
CREATE TYPE "public"."GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."GymSubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."LeadActivityType" AS ENUM ('NOTE', 'CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'STATUS_CHANGE', 'FOLLOW_UP', 'TRIAL_STARTED', 'CONVERSION');

-- CreateEnum
CREATE TYPE "public"."LeadSource" AS ENUM ('WALK_IN', 'WEBSITE', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'REFERRAL', 'CALL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'TRIAL_BOOKED', 'TRIAL_COMPLETED', 'NEGOTIATION', 'CONVERTED', 'LOST', 'INTERESTED', 'TRIAL');

-- CreateEnum
CREATE TYPE "public"."MarketplaceItemStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "public"."MarketplaceItemType" AS ENUM ('TRAINER', 'DIET_PLAN', 'WORKOUT_TEMPLATE');

-- CreateEnum
CREATE TYPE "public"."MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT');

-- CreateEnum
CREATE TYPE "public"."MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."MembershipPlan" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'FROZEN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'PROGRESS_COMMENT', 'FEEDBACK');

-- CreateEnum
CREATE TYPE "public"."MissionType" AS ENUM ('CHECK_IN', 'COMPLETE_WORKOUT', 'LOG_PROGRESS', 'FOLLOW_DIET', 'SEND_FEEDBACK');

-- CreateEnum
CREATE TYPE "public"."MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'GLUTES', 'CORE', 'FULL_BODY');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('MEMBERSHIP_RENEWAL', 'PAYMENT_REMINDER', 'ATTENDANCE_REMINDER', 'DIET_PLAN_UPDATED', 'WORKOUT_PLAN_UPDATED', 'GENERAL');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PAID', 'PENDING', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."PointEvent" AS ENUM ('ATTENDANCE_CHECKIN', 'WORKOUT_COMPLETED', 'DIET_COMPLETED', 'PROGRESS_UPDATED', 'CHALLENGE_JOINED', 'CHALLENGE_COMPLETED', 'REFERRAL_CONVERTED', 'MEMBERSHIP_RENEWED', 'REWARD_REDEEMED', 'MISSION_COMPLETED', 'STREAK_MILESTONE');

-- CreateEnum
CREATE TYPE "public"."RedemptionStatus" AS ENUM ('PENDING', 'APPROVED', 'FULFILLED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('PENDING', 'CONVERTED', 'REWARDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."RewardType" AS ENUM ('XP', 'BADGE', 'DISCOUNT', 'GIFT');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'TRAINER', 'MEMBER', 'REGIONAL_MANAGER', 'BRANCH_MANAGER');

-- CreateEnum
CREATE TYPE "public"."SaaSInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'FAILED', 'CANCELLED', 'PENDING', 'SENT', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."SaaSPlanInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."StreakType" AS ENUM ('ATTENDANCE', 'WORKOUT', 'DIET');

-- CreateEnum
CREATE TYPE "public"."TrialStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONVERTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."WebhookEvent" AS ENUM ('MEMBER_CREATED', 'PAYMENT_RECEIVED', 'SUBSCRIPTION_UPDATED', 'LEAD_CREATED', 'MARKETPLACE_PURCHASED');

-- CreateEnum
CREATE TYPE "public"."WorkoutAssignmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'EXPIRED', 'SKIPPED');

-- CreateTable
CREATE TABLE "public"."Announcement" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audience" "public"."AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "branchId" TEXT,
    "memberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" "public"."AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "public"."AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "channels" "public"."CommChannel"[] DEFAULT ARRAY[]::"public"."CommChannel"[],
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnnouncementReceipt" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "AnnouncementReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiKey" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "status" "public"."ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" TEXT,
    "checkOutAt" TIMESTAMP(3),
    "source" "public"."AttendanceSource" NOT NULL DEFAULT 'QR',
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "gymId" TEXT,
    "userId" TEXT,
    "action" "public"."AuditAction" NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT,
    "metadata" JSONB,
    "method" TEXT DEFAULT 'UNKNOWN',
    "path" TEXT DEFAULT 'UNKNOWN',

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."BadgeType" NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BodyMeasurement" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "chest" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "hips" DOUBLE PRECISION,
    "arms" DOUBLE PRECISION,
    "thighs" DOUBLE PRECISION,
    "bodyFatPercentage" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "height" DOUBLE PRECISION,
    "muscleMass" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Branch" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Campaign" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "public"."CampaignType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Challenge" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."ChallengeType" NOT NULL,
    "status" "public"."ChallengeStatus" NOT NULL DEFAULT 'UPCOMING',
    "targetValue" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChallengeParticipant" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommunityGroup" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."CommunityGroupType" NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommunityGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyMission" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."MissionType" NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryLog" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "channel" "public"."CommChannel" NOT NULL,
    "status" "public"."DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "userId" TEXT,
    "memberId" TEXT,
    "recipientAddr" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "provider" TEXT,
    "title" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeviceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gymId" TEXT,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT,
    "deviceName" TEXT,
    "pushToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DietCompletion" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "dietPlanId" TEXT NOT NULL,
    "dietMealId" TEXT,
    "dayOfWeek" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DietMeal" (
    "id" TEXT NOT NULL,
    "dietPlanId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "mealType" "public"."MealType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "calories" INTEGER,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fats" DOUBLE PRECISION,
    "time" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DietPlan" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "goal" TEXT,
    "notes" TEXT,
    "monday" TEXT,
    "tuesday" TEXT,
    "wednesday" TEXT,
    "thursday" TEXT,
    "friday" TEXT,
    "saturday" TEXT,
    "sunday" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Due" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "membershipId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL,
    "status" "public"."DueStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Due_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Exercise" (
    "id" TEXT NOT NULL,
    "gymId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."ExerciseCategory" NOT NULL,
    "muscleGroup" "public"."MuscleGroup" NOT NULL,
    "difficulty" "public"."DifficultyLevel" NOT NULL,
    "equipment" TEXT,
    "instructions" TEXT,
    "videoUrl" TEXT,
    "imageUrl" TEXT,
    "caloriesBurned" INTEGER,
    "durationMinutes" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "defaultEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "environment" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rolloutPercentage" INTEGER,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureFlagAssignment" (
    "id" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureFlagAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Goal" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "unit" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3),
    "status" "public"."GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metric" TEXT,
    "startValue" DOUBLE PRECISION,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Gym" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gstNumber" TEXT,
    "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "stateCode" TEXT,
    "pricePerActiveMember" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Gym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GymMembershipPlan" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymMembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GymSubscription" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "public"."GymSubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Integration" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "public"."IntegrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "membershipId" TEXT,
    "paymentId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerName" TEXT NOT NULL,
    "customerGST" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" "public"."LeadSource" NOT NULL,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "fitnessGoal" TEXT,
    "notes" TEXT,
    "trialDate" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadActivity" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "public"."LeadActivityType" NOT NULL DEFAULT 'NOTE',
    "note" TEXT,
    "fromStatus" "public"."LeadStatus",
    "toStatus" "public"."LeadStatus",
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketplaceItem" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "public"."MarketplaceItemType" NOT NULL,
    "status" "public"."MarketplaceItemStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "tags" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Member" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "fitnessGoal" TEXT,
    "trainerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "healthNotes" TEXT,
    "injuryNotes" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medicalConditions" TEXT,
    "status" "public"."MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "retentionScore" INTEGER,
    "riskLevel" "public"."RiskLevel",
    "riskScore" INTEGER,
    "scoredAt" TIMESTAMP(3),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MemberBadge" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MemberStreak" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "public"."StreakType" NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "longest" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MemberXP" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberXP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Membership" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "plan" "public"."MembershipPlan",
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "extensionDays" INTEGER NOT NULL DEFAULT 0,
    "freezeEndDate" TIMESTAMP(3),
    "freezeStartDate" TIMESTAMP(3),
    "planId" TEXT,
    "renewedFromId" TEXT,
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MissionCompletion" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gateway" TEXT,
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "membershipId" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlatformBillingSettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'Nexpan Tech',
    "companyLogo" TEXT,
    "companyAddress" TEXT,
    "companyEmail" TEXT,
    "companyPhone" TEXT,
    "companyWebsite" TEXT,
    "gstNumber" TEXT,
    "defaultGstPercent" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "panNumber" TEXT,
    "cinNumber" TEXT,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "bankName" TEXT,
    "ifscCode" TEXT,
    "upiId" TEXT,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'SAAS',
    "invoiceFooter" TEXT DEFAULT 'Thank you for your business. For support contact support@nexpan.in',
    "paymentTerms" TEXT,
    "dueDays" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformBillingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PointTransaction" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "event" "public"."PointEvent" NOT NULL,
    "points" INTEGER NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "eventKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Referral" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "inviteeName" TEXT,
    "inviteePhone" TEXT,
    "inviteeEmail" TEXT,
    "referredLeadId" TEXT,
    "status" "public"."ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RegionalManagerBranch" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegionalManagerBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reward" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."RewardType" NOT NULL,
    "xpCost" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pointsCost" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RewardRedemption" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "status" "public"."RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaaSInvoice" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "gstAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "public"."SaaSInvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activeMemberCount" INTEGER,
    "billingMonth" TEXT,
    "emailStatus" TEXT,
    "gstPercent" DOUBLE PRECISION,
    "pricePerMember" DOUBLE PRECISION,
    "sentAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "sellerSnapshot" JSONB,

    CONSTRAINT "SaaSInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaaSPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "interval" "public"."SaaSPlanInterval" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "maxBranches" INTEGER,
    "maxMembers" INTEGER,
    "maxStaff" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaaSPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "deviceName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrainerFeedback" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "rating" "public"."FeedbackRating" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrainerMessage" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "memberId" TEXT,
    "senderId" TEXT NOT NULL,
    "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "TrainerMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrialMembership" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "leadId" TEXT,
    "memberId" TEXT,
    "planId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."TrialStatus" NOT NULL DEFAULT 'ACTIVE',
    "convertedAt" TIMESTAMP(3),
    "convertedMembershipId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "gymId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" "public"."WebhookEvent"[],
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhiteLabelSetting" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "appName" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "customDomain" TEXT,
    "isDomainVerified" BOOLEAN NOT NULL DEFAULT false,
    "mobileAppName" TEXT,
    "playStoreUrl" TEXT,
    "appStoreUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailFooterText" TEXT,
    "emailFromName" TEXT,
    "emailLogoUrl" TEXT,
    "supportEmail" TEXT,

    CONSTRAINT "WhiteLabelSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutAssignment" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "workoutPlanId" TEXT NOT NULL,
    "trainerId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "dayNumber" INTEGER,
    "status" "public"."WorkoutAssignmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutCompletion" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "workoutPlanId" TEXT NOT NULL,
    "workoutExerciseId" TEXT,
    "dayNumber" INTEGER,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutExercise" (
    "id" TEXT NOT NULL,
    "workoutPlanId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "restSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutPlan" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "difficulty" "public"."DifficultyLevel" NOT NULL,
    "durationWeeks" INTEGER,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_gymId_idx" ON "public"."Announcement"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Announcement_status_idx" ON "public"."Announcement"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementReceipt_announcementId_userId_key" ON "public"."AnnouncementReceipt"("announcementId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "AnnouncementReceipt_userId_idx" ON "public"."AnnouncementReceipt"("userId" ASC);

-- CreateIndex
CREATE INDEX "ApiKey_gymId_idx" ON "public"."ApiKey"("gymId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "public"."ApiKey"("keyHash" ASC);

-- CreateIndex
CREATE INDEX "ApiKey_status_idx" ON "public"."ApiKey"("status" ASC);

-- CreateIndex
CREATE INDEX "Attendance_gymId_date_idx" ON "public"."Attendance"("gymId" ASC, "date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_gymId_memberId_date_key" ON "public"."Attendance"("gymId" ASC, "memberId" ASC, "date" ASC);

-- CreateIndex
CREATE INDEX "Attendance_gymId_status_idx" ON "public"."Attendance"("gymId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_gymId_idx" ON "public"."AuditLog"("gymId" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId" ASC);

-- CreateIndex
CREATE INDEX "BodyMeasurement_gymId_idx" ON "public"."BodyMeasurement"("gymId" ASC);

-- CreateIndex
CREATE INDEX "BodyMeasurement_memberId_idx" ON "public"."BodyMeasurement"("memberId" ASC);

-- CreateIndex
CREATE INDEX "BodyMeasurement_recordedAt_idx" ON "public"."BodyMeasurement"("recordedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "public"."Branch"("code" ASC);

-- CreateIndex
CREATE INDEX "Challenge_gymId_idx" ON "public"."Challenge"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Challenge_status_idx" ON "public"."Challenge"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeParticipant_challengeId_memberId_key" ON "public"."ChallengeParticipant"("challengeId" ASC, "memberId" ASC);

-- CreateIndex
CREATE INDEX "ChallengeParticipant_memberId_idx" ON "public"."ChallengeParticipant"("memberId" ASC);

-- CreateIndex
CREATE INDEX "CommunityGroup_gymId_idx" ON "public"."CommunityGroup"("gymId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityGroupMember_groupId_memberId_key" ON "public"."CommunityGroupMember"("groupId" ASC, "memberId" ASC);

-- CreateIndex
CREATE INDEX "DeliveryLog_channel_idx" ON "public"."DeliveryLog"("channel" ASC);

-- CreateIndex
CREATE INDEX "DeliveryLog_gymId_idx" ON "public"."DeliveryLog"("gymId" ASC);

-- CreateIndex
CREATE INDEX "DeliveryLog_refType_refId_idx" ON "public"."DeliveryLog"("refType" ASC, "refId" ASC);

-- CreateIndex
CREATE INDEX "DeliveryLog_status_idx" ON "public"."DeliveryLog"("status" ASC);

-- CreateIndex
CREATE INDEX "DeviceSession_deviceId_idx" ON "public"."DeviceSession"("deviceId" ASC);

-- CreateIndex
CREATE INDEX "DeviceSession_gymId_idx" ON "public"."DeviceSession"("gymId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_userId_deviceId_key" ON "public"."DeviceSession"("userId" ASC, "deviceId" ASC);

-- CreateIndex
CREATE INDEX "DeviceSession_userId_idx" ON "public"."DeviceSession"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "public"."DeviceToken"("token" ASC);

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "public"."DeviceToken"("userId" ASC);

-- CreateIndex
CREATE INDEX "DietCompletion_dietPlanId_idx" ON "public"."DietCompletion"("dietPlanId" ASC);

-- CreateIndex
CREATE INDEX "DietCompletion_gymId_idx" ON "public"."DietCompletion"("gymId" ASC);

-- CreateIndex
CREATE INDEX "DietCompletion_memberId_idx" ON "public"."DietCompletion"("memberId" ASC);

-- CreateIndex
CREATE INDEX "DietMeal_dayOfWeek_idx" ON "public"."DietMeal"("dayOfWeek" ASC);

-- CreateIndex
CREATE INDEX "DietMeal_dietPlanId_idx" ON "public"."DietMeal"("dietPlanId" ASC);

-- CreateIndex
CREATE INDEX "DietMeal_mealType_idx" ON "public"."DietMeal"("mealType" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DietPlan_memberId_key" ON "public"."DietPlan"("memberId" ASC);

-- CreateIndex
CREATE INDEX "Due_dueDate_idx" ON "public"."Due"("dueDate" ASC);

-- CreateIndex
CREATE INDEX "Due_gymId_idx" ON "public"."Due"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Due_memberId_idx" ON "public"."Due"("memberId" ASC);

-- CreateIndex
CREATE INDEX "Due_membershipId_idx" ON "public"."Due"("membershipId" ASC);

-- CreateIndex
CREATE INDEX "Due_status_idx" ON "public"."Due"("status" ASC);

-- CreateIndex
CREATE INDEX "Exercise_category_idx" ON "public"."Exercise"("category" ASC);

-- CreateIndex
CREATE INDEX "Exercise_difficulty_idx" ON "public"."Exercise"("difficulty" ASC);

-- CreateIndex
CREATE INDEX "Exercise_muscleGroup_idx" ON "public"."Exercise"("muscleGroup" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "public"."FeatureFlag"("key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlagAssignment_flagKey_gymId_key" ON "public"."FeatureFlagAssignment"("flagKey" ASC, "gymId" ASC);

-- CreateIndex
CREATE INDEX "FeatureFlagAssignment_gymId_idx" ON "public"."FeatureFlagAssignment"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Goal_gymId_idx" ON "public"."Goal"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Goal_memberId_idx" ON "public"."Goal"("memberId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Gym_email_key" ON "public"."Gym"("email" ASC);

-- CreateIndex
CREATE INDEX "GymMembershipPlan_gymId_idx" ON "public"."GymMembershipPlan"("gymId" ASC);

-- CreateIndex
CREATE INDEX "GymSubscription_gymId_idx" ON "public"."GymSubscription"("gymId" ASC);

-- CreateIndex
CREATE INDEX "GymSubscription_planId_idx" ON "public"."GymSubscription"("planId" ASC);

-- CreateIndex
CREATE INDEX "GymSubscription_status_idx" ON "public"."GymSubscription"("status" ASC);

-- CreateIndex
CREATE INDEX "Integration_gymId_idx" ON "public"."Integration"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Invoice_gymId_idx" ON "public"."Invoice"("gymId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "public"."Invoice"("invoiceNumber" ASC);

-- CreateIndex
CREATE INDEX "Invoice_memberId_idx" ON "public"."Invoice"("memberId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_paymentId_key" ON "public"."Invoice"("paymentId" ASC);

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice"("status" ASC);

-- CreateIndex
CREATE INDEX "Lead_gymId_idx" ON "public"."Lead"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "public"."Lead"("status" ASC);

-- CreateIndex
CREATE INDEX "LeadActivity_gymId_idx" ON "public"."LeadActivity"("gymId" ASC);

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "public"."LeadActivity"("leadId" ASC);

-- CreateIndex
CREATE INDEX "MarketplaceItem_gymId_idx" ON "public"."MarketplaceItem"("gymId" ASC);

-- CreateIndex
CREATE INDEX "MarketplaceItem_status_idx" ON "public"."MarketplaceItem"("status" ASC);

-- CreateIndex
CREATE INDEX "MarketplaceItem_type_idx" ON "public"."MarketplaceItem"("type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "public"."Member"("userId" ASC);

-- CreateIndex
CREATE INDEX "MemberBadge_gymId_idx" ON "public"."MemberBadge"("gymId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MemberBadge_memberId_badgeId_key" ON "public"."MemberBadge"("memberId" ASC, "badgeId" ASC);

-- CreateIndex
CREATE INDEX "MemberBadge_memberId_idx" ON "public"."MemberBadge"("memberId" ASC);

-- CreateIndex
CREATE INDEX "MemberStreak_gymId_idx" ON "public"."MemberStreak"("gymId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MemberStreak_memberId_type_key" ON "public"."MemberStreak"("memberId" ASC, "type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MemberXP_memberId_key" ON "public"."MemberXP"("memberId" ASC);

-- CreateIndex
CREATE INDEX "Membership_gymId_idx" ON "public"."Membership"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Membership_memberId_idx" ON "public"."Membership"("memberId" ASC);

-- CreateIndex
CREATE INDEX "MissionCompletion_memberId_idx" ON "public"."MissionCompletion"("memberId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MissionCompletion_missionId_memberId_completedAt_key" ON "public"."MissionCompletion"("missionId" ASC, "memberId" ASC, "completedAt" ASC);

-- CreateIndex
CREATE INDEX "Notification_gymId_idx" ON "public"."Notification"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Notification_memberId_idx" ON "public"."Notification"("memberId" ASC);

-- CreateIndex
CREATE INDEX "Payment_gymId_idx" ON "public"."Payment"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Payment_memberId_idx" ON "public"."Payment"("memberId" ASC);

-- CreateIndex
CREATE INDEX "Payment_membershipId_idx" ON "public"."Payment"("membershipId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PointTransaction_gymId_eventKey_key" ON "public"."PointTransaction"("gymId" ASC, "eventKey" ASC);

-- CreateIndex
CREATE INDEX "PointTransaction_gymId_idx" ON "public"."PointTransaction"("gymId" ASC);

-- CreateIndex
CREATE INDEX "PointTransaction_memberId_idx" ON "public"."PointTransaction"("memberId" ASC);

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "public"."Referral"("code" ASC);

-- CreateIndex
CREATE INDEX "Referral_gymId_idx" ON "public"."Referral"("gymId" ASC);

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "public"."Referral"("referrerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RegionalManagerBranch_managerId_branchId_key" ON "public"."RegionalManagerBranch"("managerId" ASC, "branchId" ASC);

-- CreateIndex
CREATE INDEX "RewardRedemption_gymId_idx" ON "public"."RewardRedemption"("gymId" ASC);

-- CreateIndex
CREATE INDEX "RewardRedemption_memberId_idx" ON "public"."RewardRedemption"("memberId" ASC);

-- CreateIndex
CREATE INDEX "SaaSInvoice_billingMonth_idx" ON "public"."SaaSInvoice"("billingMonth" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SaaSInvoice_gymId_billingMonth_key" ON "public"."SaaSInvoice"("gymId" ASC, "billingMonth" ASC);

-- CreateIndex
CREATE INDEX "SaaSInvoice_gymId_idx" ON "public"."SaaSInvoice"("gymId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SaaSInvoice_invoiceNumber_key" ON "public"."SaaSInvoice"("invoiceNumber" ASC);

-- CreateIndex
CREATE INDEX "SaaSInvoice_status_idx" ON "public"."SaaSInvoice"("status" ASC);

-- CreateIndex
CREATE INDEX "SaaSInvoice_subscriptionId_idx" ON "public"."SaaSInvoice"("subscriptionId" ASC);

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "public"."Session"("expiresAt" ASC);

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId" ASC);

-- CreateIndex
CREATE INDEX "TrainerFeedback_gymId_idx" ON "public"."TrainerFeedback"("gymId" ASC);

-- CreateIndex
CREATE INDEX "TrainerFeedback_memberId_idx" ON "public"."TrainerFeedback"("memberId" ASC);

-- CreateIndex
CREATE INDEX "TrainerFeedback_trainerId_idx" ON "public"."TrainerFeedback"("trainerId" ASC);

-- CreateIndex
CREATE INDEX "TrainerMessage_gymId_idx" ON "public"."TrainerMessage"("gymId" ASC);

-- CreateIndex
CREATE INDEX "TrainerMessage_memberId_idx" ON "public"."TrainerMessage"("memberId" ASC);

-- CreateIndex
CREATE INDEX "TrainerMessage_senderId_idx" ON "public"."TrainerMessage"("senderId" ASC);

-- CreateIndex
CREATE INDEX "TrainerMessage_trainerId_idx" ON "public"."TrainerMessage"("trainerId" ASC);

-- CreateIndex
CREATE INDEX "TrialMembership_gymId_idx" ON "public"."TrialMembership"("gymId" ASC);

-- CreateIndex
CREATE INDEX "TrialMembership_status_idx" ON "public"."TrialMembership"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE INDEX "WebhookEndpoint_gymId_idx" ON "public"."WebhookEndpoint"("gymId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelSetting_customDomain_key" ON "public"."WhiteLabelSetting"("customDomain" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelSetting_gymId_key" ON "public"."WhiteLabelSetting"("gymId" ASC);

-- CreateIndex
CREATE INDEX "WorkoutAssignment_gymId_idx" ON "public"."WorkoutAssignment"("gymId" ASC);

-- CreateIndex
CREATE INDEX "WorkoutAssignment_memberId_scheduledDate_idx" ON "public"."WorkoutAssignment"("memberId" ASC, "scheduledDate" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutAssignment_memberId_scheduledDate_workoutPlanId_key" ON "public"."WorkoutAssignment"("memberId" ASC, "scheduledDate" ASC, "workoutPlanId" ASC);

-- CreateIndex
CREATE INDEX "WorkoutAssignment_scheduledDate_idx" ON "public"."WorkoutAssignment"("scheduledDate" ASC);

-- CreateIndex
CREATE INDEX "WorkoutAssignment_status_idx" ON "public"."WorkoutAssignment"("status" ASC);

-- CreateIndex
CREATE INDEX "WorkoutCompletion_gymId_idx" ON "public"."WorkoutCompletion"("gymId" ASC);

-- CreateIndex
CREATE INDEX "WorkoutCompletion_memberId_idx" ON "public"."WorkoutCompletion"("memberId" ASC);

-- CreateIndex
CREATE INDEX "WorkoutCompletion_workoutPlanId_idx" ON "public"."WorkoutCompletion"("workoutPlanId" ASC);

-- CreateIndex
CREATE INDEX "WorkoutExercise_exerciseId_idx" ON "public"."WorkoutExercise"("exerciseId" ASC);

-- CreateIndex
CREATE INDEX "WorkoutExercise_workoutPlanId_idx" ON "public"."WorkoutExercise"("workoutPlanId" ASC);

-- CreateIndex
CREATE INDEX "WorkoutPlan_gymId_idx" ON "public"."WorkoutPlan"("gymId" ASC);

-- CreateIndex
CREATE INDEX "WorkoutPlan_memberId_idx" ON "public"."WorkoutPlan"("memberId" ASC);

-- CreateIndex
CREATE INDEX "WorkoutPlan_trainerId_idx" ON "public"."WorkoutPlan"("trainerId" ASC);

-- AddForeignKey
ALTER TABLE "public"."Announcement" ADD CONSTRAINT "Announcement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Announcement" ADD CONSTRAINT "Announcement_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnnouncementReceipt" ADD CONSTRAINT "AnnouncementReceipt_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "public"."Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnnouncementReceipt" ADD CONSTRAINT "AnnouncementReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiKey" ADD CONSTRAINT "ApiKey_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Campaign" ADD CONSTRAINT "Campaign_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Challenge" ADD CONSTRAINT "Challenge_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityGroup" ADD CONSTRAINT "CommunityGroup_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityGroupMember" ADD CONSTRAINT "CommunityGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityGroupMember" ADD CONSTRAINT "CommunityGroupMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyMission" ADD CONSTRAINT "DailyMission_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryLog" ADD CONSTRAINT "DeliveryLog_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceSession" ADD CONSTRAINT "DeviceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietCompletion" ADD CONSTRAINT "DietCompletion_dietMealId_fkey" FOREIGN KEY ("dietMealId") REFERENCES "public"."DietMeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietCompletion" ADD CONSTRAINT "DietCompletion_dietPlanId_fkey" FOREIGN KEY ("dietPlanId") REFERENCES "public"."DietPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietCompletion" ADD CONSTRAINT "DietCompletion_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietCompletion" ADD CONSTRAINT "DietCompletion_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietMeal" ADD CONSTRAINT "DietMeal_dietPlanId_fkey" FOREIGN KEY ("dietPlanId") REFERENCES "public"."DietPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietPlan" ADD CONSTRAINT "DietPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DietPlan" ADD CONSTRAINT "DietPlan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Due" ADD CONSTRAINT "Due_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Due" ADD CONSTRAINT "Due_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Due" ADD CONSTRAINT "Due_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Exercise" ADD CONSTRAINT "Exercise_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeatureFlagAssignment" ADD CONSTRAINT "FeatureFlagAssignment_flagKey_fkey" FOREIGN KEY ("flagKey") REFERENCES "public"."FeatureFlag"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeatureFlagAssignment" ADD CONSTRAINT "FeatureFlagAssignment_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMembershipPlan" ADD CONSTRAINT "GymMembershipPlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymMembershipPlan" ADD CONSTRAINT "GymMembershipPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymSubscription" ADD CONSTRAINT "GymSubscription_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymSubscription" ADD CONSTRAINT "GymSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."SaaSPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Integration" ADD CONSTRAINT "Integration_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketplaceItem" ADD CONSTRAINT "MarketplaceItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketplaceItem" ADD CONSTRAINT "MarketplaceItem_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberBadge" ADD CONSTRAINT "MemberBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberBadge" ADD CONSTRAINT "MemberBadge_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberBadge" ADD CONSTRAINT "MemberBadge_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberStreak" ADD CONSTRAINT "MemberStreak_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberStreak" ADD CONSTRAINT "MemberStreak_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberXP" ADD CONSTRAINT "MemberXP_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MemberXP" ADD CONSTRAINT "MemberXP_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."GymMembershipPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_renewedFromId_fkey" FOREIGN KEY ("renewedFromId") REFERENCES "public"."Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MissionCompletion" ADD CONSTRAINT "MissionCompletion_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MissionCompletion" ADD CONSTRAINT "MissionCompletion_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."DailyMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PointTransaction" ADD CONSTRAINT "PointTransaction_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PointTransaction" ADD CONSTRAINT "PointTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegionalManagerBranch" ADD CONSTRAINT "RegionalManagerBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegionalManagerBranch" ADD CONSTRAINT "RegionalManagerBranch_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegionalManagerBranch" ADD CONSTRAINT "RegionalManagerBranch_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reward" ADD CONSTRAINT "Reward_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardRedemption" ADD CONSTRAINT "RewardRedemption_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardRedemption" ADD CONSTRAINT "RewardRedemption_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardRedemption" ADD CONSTRAINT "RewardRedemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "public"."Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaaSInvoice" ADD CONSTRAINT "SaaSInvoice_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaaSInvoice" ADD CONSTRAINT "SaaSInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."GymSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainerFeedback" ADD CONSTRAINT "TrainerFeedback_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainerFeedback" ADD CONSTRAINT "TrainerFeedback_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainerFeedback" ADD CONSTRAINT "TrainerFeedback_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainerMessage" ADD CONSTRAINT "TrainerMessage_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainerMessage" ADD CONSTRAINT "TrainerMessage_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainerMessage" ADD CONSTRAINT "TrainerMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainerMessage" ADD CONSTRAINT "TrainerMessage_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrialMembership" ADD CONSTRAINT "TrialMembership_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrialMembership" ADD CONSTRAINT "TrialMembership_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrialMembership" ADD CONSTRAINT "TrialMembership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhiteLabelSetting" ADD CONSTRAINT "WhiteLabelSetting_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutAssignment" ADD CONSTRAINT "WorkoutAssignment_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutAssignment" ADD CONSTRAINT "WorkoutAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutAssignment" ADD CONSTRAINT "WorkoutAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutAssignment" ADD CONSTRAINT "WorkoutAssignment_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "public"."WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutCompletion" ADD CONSTRAINT "WorkoutCompletion_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutCompletion" ADD CONSTRAINT "WorkoutCompletion_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutCompletion" ADD CONSTRAINT "WorkoutCompletion_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "public"."WorkoutExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutCompletion" ADD CONSTRAINT "WorkoutCompletion_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "public"."WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "public"."Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "public"."WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "public"."Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

