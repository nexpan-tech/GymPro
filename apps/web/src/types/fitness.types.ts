// ─── Exercise Enums ───────────────────────────────────────────────────────────

export type ExerciseCategory =
  | "STRENGTH"
  | "CARDIO"
  | "FLEXIBILITY"
  | "BALANCE"
  | "SPORTS"
  | "HIIT"
  | "YOGA"
  | "PILATES"
  | "FUNCTIONAL"
  | "REHABILITATION";

export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "SHOULDERS"
  | "BICEPS"
  | "TRICEPS"
  | "FOREARMS"
  | "CORE"
  | "GLUTES"
  | "QUADRICEPS"
  | "HAMSTRINGS"
  | "CALVES"
  | "FULL_BODY"
  | "UPPER_BODY"
  | "LOWER_BODY";

export type DifficultyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

// ─── Exercise ─────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  description?: string | null;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment?: string | null;
  difficulty: DifficultyLevel;
  videoUrl?: string | null;
  imageUrl?: string | null;
  instructions?: string | null;
  gymId?: string | null;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Workout Plan ─────────────────────────────────────────────────────────────

export interface WorkoutExercise {
  id: string;
  workoutPlanId: string;
  exerciseId: string;
  exercise?: Exercise;
  dayOfWeek?: number | null;
  sets?: number | null;
  reps?: number | null;
  durationSeconds?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
  order: number;
}

export interface WorkoutCompletion {
  id: string;
  workoutPlanId: string;
  memberId: string;
  completedAt: string;
  durationMinutes?: number | null;
  xpEarned?: number;
  notes?: string | null;
}

export interface WorkoutPlan {
  id: string;
  gymId: string;
  memberId?: string | null;
  trainerId?: string | null;
  name: string;
  description?: string | null;
  difficulty: DifficultyLevel;
  daysPerWeek?: number | null;
  durationWeeks?: number | null;
  isTemplate: boolean;
  isActive: boolean;
  exercises?: WorkoutExercise[];
  completions?: WorkoutCompletion[];
  createdAt: string;
  updatedAt: string;
}

// ─── Diet / Meal Plan ─────────────────────────────────────────────────────────

export type MealType =
  | "BREAKFAST"
  | "MORNING_SNACK"
  | "LUNCH"
  | "AFTERNOON_SNACK"
  | "DINNER"
  | "PRE_WORKOUT"
  | "POST_WORKOUT";

export interface DietMeal {
  id: string;
  dietPlanId: string;
  name: string;
  mealType: MealType;
  dayOfWeek?: number | null;
  time?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  fiber?: number | null;
  ingredients?: string[] | null;
  recipe?: string | null;
  notes?: string | null;
  order: number;
}

export interface DietPlan {
  id: string;
  gymId: string;
  memberId?: string | null;
  trainerId?: string | null;
  name: string;
  description?: string | null;
  goal?: string | null;
  totalCalories?: number | null;
  proteinGrams?: number | null;
  carbGrams?: number | null;
  fatGrams?: number | null;
  isTemplate: boolean;
  isActive: boolean;
  meals?: DietMeal[];
  createdAt: string;
  updatedAt: string;
}

// ─── Goal ─────────────────────────────────────────────────────────────────────

export type GoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";

export type GoalType =
  | "WEIGHT_LOSS"
  | "WEIGHT_GAIN"
  | "MUSCLE_GAIN"
  | "ENDURANCE"
  | "FLEXIBILITY"
  | "STRENGTH"
  | "BODY_FAT"
  | "CUSTOM";

export interface Goal {
  id: string;
  memberId: string;
  gymId: string;
  type: GoalType;
  title: string;
  description?: string | null;
  targetValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
  status: GoalStatus;
  startDate: string;
  targetDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Body Measurement ─────────────────────────────────────────────────────────

export interface BodyMeasurement {
  id: string;
  memberId: string;
  gymId: string;
  recordedAt: string;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
  bodyFatPercent?: number | null;
  muscleMassKg?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  thighs?: number | null;
  arms?: number | null;
  shoulders?: number | null;
  neck?: number | null;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt: string;
}

// Progress photos are intentionally NOT supported (no media uploads).

// ─── Session (Trainer-Member) ─────────────────────────────────────────────────

export type SessionStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Session {
  id: string;
  gymId: string;
  branchId?: string | null;
  memberId: string;
  trainerId: string;
  workoutPlanId?: string | null;
  scheduledAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  durationMinutes?: number | null;
  status: SessionStatus;
  notes?: string | null;
  rating?: number | null;
  feedback?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Challenge & Community ────────────────────────────────────────────────────

export type ChallengeStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Challenge {
  id: string;
  gymId: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  xpReward?: number;
  badgeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityGroup {
  id: string;
  gymId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isPrivate: boolean;
  createdById: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}
