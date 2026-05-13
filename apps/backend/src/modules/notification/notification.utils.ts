export const buildMessage = (
  type: string,
  memberName: string
) => {
  switch (type) {
    case "MEMBERSHIP_RENEWAL":
      return `Hi ${memberName}, your gym membership is about to expire. Please renew to continue your training.`;

    case "PAYMENT_REMINDER":
      return `Hi ${memberName}, your pending payment is due. Please clear it to avoid interruption.`;

    case "ATTENDANCE_REMINDER":
      return `Hi ${memberName}, we missed you today! Stay consistent with your fitness goals 💪`;

    case "DIET_PLAN_UPDATED":
      return `Hi ${memberName}, your diet plan has been updated by your trainer.`;

    case "WORKOUT_PLAN_UPDATED":
      return `Hi ${memberName}, your workout plan has been updated. Check your app for details.`;

    default:
      return `Hi ${memberName}, you have a new update from your gym.`;
  }
};