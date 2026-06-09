// ─── Auth & Users ─────────────────────────────────────────────────────────────
export type {
  Role,
  UserRole,
  User,
  LoginPayload,
  RegisterGymPayload,
  LoginResponse,
  AuthResponse,
  AuthState,
  AuthContextType,
  JWTPayload,
} from "./auth.types";

// ─── Gym & Branch ─────────────────────────────────────────────────────────────
export type {
  SaaSPlanTier,
  SaaSPlan,
  GymSubscription,
  Branch,
  Gym,
  GymStats,
} from "./gym.types";

// ─── Members & Membership ─────────────────────────────────────────────────────
export type {
  MembershipPlan,
  PaymentStatus,
  MemberStatus,
  Gender,
  Membership,
  Due,
  Badge,
  MemberBadge,
  MemberXP,
  LeadStatus,
  Lead,
  Member,
  MemberStats,
} from "./member.types";

// ─── Fitness ──────────────────────────────────────────────────────────────────
export type {
  ExerciseCategory,
  MuscleGroup,
  DifficultyLevel,
  Exercise,
  WorkoutExercise,
  WorkoutCompletion,
  WorkoutPlan,
  MealType,
  DietMeal,
  DietPlan,
  GoalStatus,
  GoalType,
  Goal,
  BodyMeasurement,
  SessionStatus,
  Session,
  ChallengeStatus,
  Challenge,
  CommunityGroup,
} from "./fitness.types";

// ─── Analytics ────────────────────────────────────────────────────────────────
export type {
  RevenueData,
  RevenuePoint,
  AttendanceStats,
  AttendancePoint,
  MembershipPoint,
  QueueStats,
  StatCardData,
  DashboardStats,
  Activity,
  DashboardAnalytics,
} from "./analytics.types";

// ─── Notifications & Campaigns ────────────────────────────────────────────────
export type {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  Notification,
  CampaignStatus,
  Campaign,
} from "./notification.types";

// ─── Common / Shared ──────────────────────────────────────────────────────────
export type {
  LoadingState,
  APIStatus,
  APIResponse,
  PaginatedResponse,
  ApiError,
  SelectOption,
  DateRange,
  SortConfig,
  FilterConfig,
  PaginationParams,
} from "./common.types";

// ─── Legacy files (kept for backwards-compatibility) ─────────────────────────
export type { Attendance } from "./attendance.types";
export type { Payment } from "./payment.types";
