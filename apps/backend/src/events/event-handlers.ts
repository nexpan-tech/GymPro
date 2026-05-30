import { eventBus } from "./event-bus";
import { DOMAIN_EVENTS } from "./event-types";

import {
  emitNotificationToUser,
  emitDashboardUpdate,
} from "../realtime/socket";

/**
 * MEMBER CREATED
 */
eventBus.on(DOMAIN_EVENTS.MEMBER_CREATED, async (payload) => {
  console.log("👤 MEMBER_CREATED handler", payload);

  emitDashboardUpdate(payload.gymId, {
    type: "member_created",
    memberId: payload.memberId,
    timestamp: new Date().toISOString(),
  });
});

/**
 * PAYMENT RECEIVED
 */
eventBus.on(DOMAIN_EVENTS.PAYMENT_RECEIVED, async (payload) => {
  console.log("💰 PAYMENT_RECEIVED handler", payload);

  emitNotificationToUser(payload.userId, {
    title: "Payment Received",
    message: `₹${payload.amount} payment successful`,
  });

  emitDashboardUpdate(payload.gymId, {
    type: "payment_received",
    revenue: payload.amount,
    timestamp: new Date().toISOString(),
  });
});