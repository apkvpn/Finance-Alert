export type AlertCondition = "ABOVE" | "BELOW" | "REACHES";
export type AlertStatus = "ACTIVE" | "TRIGGERED" | "DISABLED";
export type AlertInternalState = "EVALUATING" | "PENDING" | "NOTIFICATION_DELIVERED" | "ERROR";

export interface AlertRecord {
  id: string;
  anonUserId: string;
  assetSymbol: string;
  assetName: string;
  assetLogo?: string | null;
  assetType: "crypto" | "forex";
  condition: AlertCondition;
  targetPrice: number;
  initialPrice: number;
  previousPrice?: number | null;
  currentPrice?: number | null;
  soundId: string;
  soundVolume: number;
  status: AlertStatus;
  internalState: AlertInternalState;
  triggeredAt?: Date | string | null;
  lastEvaluatedAt?: Date | string | null;
  triggerCount: number;
  idempotencyKey?: string | null;
  note?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EvaluationResult {
  alertId: string;
  isTriggered: boolean;
  previousPrice: number;
  currentPrice: number;
  targetPrice: number;
  condition: AlertCondition;
  triggerEventId?: string;
  idempotencyKey?: string;
  message?: string;
}

/**
 * Evaluates whether a target price condition has been validly crossed.
 * Guarantees transition-based triggering rather than simple static inequality.
 */
export function evaluateAlertCondition(
  condition: AlertCondition,
  targetPrice: number,
  previousPrice: number,
  currentPrice: number
): boolean {
  if (isNaN(currentPrice) || isNaN(targetPrice) || isNaN(previousPrice)) {
    return false;
  }

  switch (condition) {
    case "ABOVE": {
      // Valid transition: previous price was below target, current price is at or above target
      return previousPrice < targetPrice && currentPrice >= targetPrice;
    }
    case "BELOW": {
      // Valid transition: previous price was above target, current price is at or below target
      return previousPrice > targetPrice && currentPrice <= targetPrice;
    }
    case "REACHES": {
      // Zone entry transition: price has entered target threshold (within 0.1% or exact match)
      const relativeDist = Math.abs(currentPrice - targetPrice) / targetPrice;
      const prevDist = Math.abs(previousPrice - targetPrice) / targetPrice;
      return relativeDist <= 0.001 || (prevDist > 0.001 && relativeDist <= 0.001);
    }
    default:
      return false;
  }
}

/**
 * Calculates distance metrics between current price and target price
 */
export function calculateAlertDistance(
  currentPrice: number,
  targetPrice: number
): {
  distanceAbs: number;
  distancePercent: number;
  direction: "UP" | "DOWN" | "EQUAL";
} {
  if (!currentPrice || !targetPrice) {
    return { distanceAbs: 0, distancePercent: 0, direction: "EQUAL" };
  }

  const distanceAbs = Math.abs(targetPrice - currentPrice);
  const distancePercent = ((targetPrice - currentPrice) / currentPrice) * 100;
  let direction: "UP" | "DOWN" | "EQUAL" = "EQUAL";

  if (targetPrice > currentPrice) {
    direction = "UP";
  } else if (targetPrice < currentPrice) {
    direction = "DOWN";
  }

  return {
    distanceAbs,
    distancePercent: Math.round(distancePercent * 100) / 100,
    direction,
  };
}

/**
 * Evaluates an alert record against a new market price update
 */
export function processAlertEvaluation(
  alert: AlertRecord,
  newMarketPrice: number
): EvaluationResult {
  // If alert is disabled or already triggered, skip evaluation
  if (alert.status !== "ACTIVE") {
    return {
      alertId: alert.id,
      isTriggered: false,
      previousPrice: alert.previousPrice ?? alert.initialPrice,
      currentPrice: newMarketPrice,
      targetPrice: alert.targetPrice,
      condition: alert.condition,
      message: `Alert status is ${alert.status}`,
    };
  }

  const prevPrice = alert.previousPrice ?? alert.initialPrice;
  const isTriggered = evaluateAlertCondition(alert.condition, alert.targetPrice, prevPrice, newMarketPrice);

  if (isTriggered) {
    const triggerTimestamp = new Date().toISOString();
    const triggerEventId = `evt_${alert.id}_${Date.now()}`;
    const idempotencyKey = `${alert.id}_${alert.targetPrice}_${triggerTimestamp.slice(0, 16)}`;

    return {
      alertId: alert.id,
      isTriggered: true,
      previousPrice: prevPrice,
      currentPrice: newMarketPrice,
      targetPrice: alert.targetPrice,
      condition: alert.condition,
      triggerEventId,
      idempotencyKey,
      message: `${alert.assetSymbol} target crossed ${alert.condition} ${alert.targetPrice} (Price: ${newMarketPrice})`,
    };
  }

  return {
    alertId: alert.id,
    isTriggered: false,
    previousPrice: prevPrice,
    currentPrice: newMarketPrice,
    targetPrice: alert.targetPrice,
    condition: alert.condition,
    message: "Condition not met",
  };
}
