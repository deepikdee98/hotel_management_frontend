export const staffEditableFields = new Set([
  "guestName",
  "mobile",
  "address",
  "idProofType",
  "idProofNumber",
])

export const staffRestrictedFields = new Set([
  "roomNo",
  "roomType",
  "planType",
  "planCharges",
  "foodCharges",
  "discount",
  "paymentMode",
  "advanceAmount",
  "ledgerAc",
])

export const multiRoomEditableFields = new Set([
  "roomNo",
  "roomType",
  "planType",
  "planCharge",
  "foodCharge",
  "planCharges",
  "foodCharges",
  "paxAdultMale",
  "paxAdultFemale",
  "paxChildren",
  "totalPax",
  "occupancyType",
])
