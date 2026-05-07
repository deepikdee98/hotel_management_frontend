/**
 * PMS Helpers for Frontend Calculations
 */

export interface CheckoutPlanMetadata {
  type: "duration" | "fixed";
  hours?: number;
  time?: string;
}

/**
 * Calculates checkout date and time based on checkout plan
 */
export const calculateCheckoutDateTime = (
  checkInDate: string, // YYYY-MM-DD
  checkInTime: string, // HH:mm
  metadata: CheckoutPlanMetadata
): { date: string; time: string } | null => {
  if (!checkInDate || !checkInTime) return null;

  const [year, month, day] = checkInDate.split("-").map(Number);
  const [hours, minutes] = checkInTime.split(":").map(Number);
  
  const checkInDateTime = new Date(year, month - 1, day, hours, minutes);
  if (isNaN(checkInDateTime.getTime())) return null;

  let checkOutDateTime = new Date(checkInDateTime);

  if (metadata.type === "duration") {
    const durationHours = Number(metadata.hours) || 24;
    checkOutDateTime.setHours(checkOutDateTime.getHours() + durationHours);
  } else if (metadata.type === "fixed") {
    // Set to next day with fixed time
    checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);
    
    if (metadata.time) {
      const [fixedHours, fixedMinutes] = metadata.time.split(":").map(Number);
      checkOutDateTime.setHours(fixedHours || 12, fixedMinutes || 0, 0, 0);
    } else {
      checkOutDateTime.setHours(12, 0, 0, 0); // Default to 12 Noon
    }
  }

  // Format back to YYYY-MM-DD and HH:mm
  const outYear = checkOutDateTime.getFullYear();
  const outMonth = String(checkOutDateTime.getMonth() + 1).padStart(2, "0");
  const outDay = String(checkOutDateTime.getDate()).padStart(2, "0");
  const outHours = String(checkOutDateTime.getHours()).padStart(2, "0");
  const outMinutes = String(checkOutDateTime.getMinutes()).padStart(2, "0");

  return {
    date: `${outYear}-${outMonth}-${outDay}`,
    time: `${outHours}:${outMinutes}`,
  };
};

/**
 * Calculates net amount based on PMS logic
 * netAmount = (planCharge + roomGst + foodCharge + foodGst) - discount
 * If isInclusive is true, roomGst is already part of planCharge.
 */
export const calculateNetAmount = (
  planCharge: number | string,
  foodCharge: number | string,
  discount: number | string,
  roomGst: number | string = 0,
  foodGst: number | string = 0,
  isInclusive: boolean = false
): number => {
  const pCharge = Number(planCharge) || 0;
  const fCharge = Number(foodCharge) || 0;
  const disc = Number(discount) || 0;
  const rGst = Number(roomGst) || 0;
  const fGst = Number(foodGst) || 0;

  // Validation: Discount applies ONLY to planCharge
  const effectiveDiscount = Math.min(disc, pCharge);
  
  // If inclusive, pCharge already contains rGst
  const baseRoomTotal = isInclusive ? pCharge : (pCharge + rGst);
  
  const netAmount = (baseRoomTotal + fCharge + fGst) - effectiveDiscount;
  
  return Math.max(0, netAmount);
};
