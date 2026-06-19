-- CreateTable
CREATE TABLE "PersonalWorkout" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "difficulty" "DifficultyLevel",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "scheduledDate" TIMESTAMP(3),
    "dayOfWeek" TEXT,
    "estMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalWorkoutExercise" (
    "id" TEXT NOT NULL,
    "personalWorkoutId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps" TEXT NOT NULL DEFAULT '10',
    "restSeconds" INTEGER,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PersonalWorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalWorkoutCompletion" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "personalWorkoutId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMinutes" INTEGER,
    "notes" TEXT,

    CONSTRAINT "PersonalWorkoutCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalDiet" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "dayOfWeek" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalDiet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalMeal" (
    "id" TEXT NOT NULL,
    "personalDietId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "title" TEXT NOT NULL,
    "calories" INTEGER,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fats" DOUBLE PRECISION,
    "time" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PersonalMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterLog" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "glasses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalWorkout_gymId_idx" ON "PersonalWorkout"("gymId");

-- CreateIndex
CREATE INDEX "PersonalWorkout_memberId_idx" ON "PersonalWorkout"("memberId");

-- CreateIndex
CREATE INDEX "PersonalWorkout_memberId_isArchived_idx" ON "PersonalWorkout"("memberId", "isArchived");

-- CreateIndex
CREATE INDEX "PersonalWorkout_scheduledDate_idx" ON "PersonalWorkout"("scheduledDate");

-- CreateIndex
CREATE INDEX "PersonalWorkoutExercise_personalWorkoutId_idx" ON "PersonalWorkoutExercise"("personalWorkoutId");

-- CreateIndex
CREATE INDEX "PersonalWorkoutCompletion_gymId_idx" ON "PersonalWorkoutCompletion"("gymId");

-- CreateIndex
CREATE INDEX "PersonalWorkoutCompletion_memberId_idx" ON "PersonalWorkoutCompletion"("memberId");

-- CreateIndex
CREATE INDEX "PersonalWorkoutCompletion_personalWorkoutId_idx" ON "PersonalWorkoutCompletion"("personalWorkoutId");

-- CreateIndex
CREATE INDEX "PersonalDiet_gymId_idx" ON "PersonalDiet"("gymId");

-- CreateIndex
CREATE INDEX "PersonalDiet_memberId_idx" ON "PersonalDiet"("memberId");

-- CreateIndex
CREATE INDEX "PersonalDiet_memberId_isArchived_idx" ON "PersonalDiet"("memberId", "isArchived");

-- CreateIndex
CREATE INDEX "PersonalMeal_personalDietId_idx" ON "PersonalMeal"("personalDietId");

-- CreateIndex
CREATE INDEX "WaterLog_gymId_idx" ON "WaterLog"("gymId");

-- CreateIndex
CREATE UNIQUE INDEX "WaterLog_memberId_date_key" ON "WaterLog"("memberId", "date");

-- CreateIndex
CREATE INDEX "Member_gymId_idx" ON "Member"("gymId");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE INDEX "Member_trainerId_idx" ON "Member"("trainerId");

-- CreateIndex
CREATE INDEX "Member_branchId_idx" ON "Member"("branchId");

-- AddForeignKey
ALTER TABLE "PersonalWorkout" ADD CONSTRAINT "PersonalWorkout_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalWorkout" ADD CONSTRAINT "PersonalWorkout_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalWorkoutExercise" ADD CONSTRAINT "PersonalWorkoutExercise_personalWorkoutId_fkey" FOREIGN KEY ("personalWorkoutId") REFERENCES "PersonalWorkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalWorkoutCompletion" ADD CONSTRAINT "PersonalWorkoutCompletion_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalWorkoutCompletion" ADD CONSTRAINT "PersonalWorkoutCompletion_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalWorkoutCompletion" ADD CONSTRAINT "PersonalWorkoutCompletion_personalWorkoutId_fkey" FOREIGN KEY ("personalWorkoutId") REFERENCES "PersonalWorkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalDiet" ADD CONSTRAINT "PersonalDiet_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalDiet" ADD CONSTRAINT "PersonalDiet_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalMeal" ADD CONSTRAINT "PersonalMeal_personalDietId_fkey" FOREIGN KEY ("personalDietId") REFERENCES "PersonalDiet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterLog" ADD CONSTRAINT "WaterLog_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterLog" ADD CONSTRAINT "WaterLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

