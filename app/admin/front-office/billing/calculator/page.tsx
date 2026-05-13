"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Calculator } from "lucide-react"

export default function BillingCalculatorPage() {
  const [foodCharge, setFoodCharge] = useState<number>(500)
  const [planCharge, setPlanCharge] = useState<number>(1000)
  const [nights, setNights] = useState<number>(2)
  const [discountPercent, setDiscountPercent] = useState<number>(10)
  const [gstPercent, setGstPercent] = useState<number>(18)

  const [calculations, setCalculations] = useState({
    foodTotal: 0,
    planTotal: 0,
    discountAmount: 0,
    afterDiscount: 0,
    gstAmount: 0,
    finalPlanAmount: 0,
    netAmount: 0,
  })

  useEffect(() => {
    // Food total = foodCharge * nights
    const foodTotal = foodCharge * nights

    // Plan total = planCharge * nights
    const planTotal = planCharge * nights

    // Discount (percentage discount only on the plan total)
    const discountAmount = (planTotal * discountPercent) / 100
    const afterDiscount = planTotal - discountAmount

    // GST (Calculate GST after discount)
    const gstAmount = (afterDiscount * gstPercent) / 100
    
    // Add GST to the discounted plan amount
    const finalPlanAmount = afterDiscount + gstAmount

    // Net amount (add food total to get the net amount)
    const netAmount = finalPlanAmount + foodTotal

    setCalculations({
      foodTotal,
      planTotal,
      discountAmount,
      afterDiscount,
      gstAmount,
      finalPlanAmount,
      netAmount,
    })
  }, [foodCharge, planCharge, nights, discountPercent, gstPercent])

  return (
    <DashboardLayout requiredRole={["admin", "staff"]}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing Calculator</h1>
          <p className="text-sm text-muted-foreground">Calculate net amount with breakdown for charges, discounts, and taxes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Input Details
              </CardTitle>
              <CardDescription>Enter the charges and percentages below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="foodCharge">Food Charge (per night)</Label>
                  <Input
                    id="foodCharge"
                    type="number"
                    value={foodCharge}
                    onChange={(e) => setFoodCharge(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planCharge">Plan Charge (per night)</Label>
                  <Input
                    id="planCharge"
                    type="number"
                    value={planCharge}
                    onChange={(e) => setPlanCharge(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nights">Number of Nights</Label>
                <Input
                  id="nights"
                  type="number"
                  value={nights}
                  onChange={(e) => setNights(Number(e.target.value))}
                  min={1}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountPercent">Discount % (on Plan Only)</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstPercent">GST % (after Discount)</Label>
                  <Input
                    id="gstPercent"
                    type="number"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Billing Breakdown</CardTitle>
              <CardDescription>Detailed calculation of the net amount</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Food Total ({foodCharge} × {nights})</span>
                <span className="font-medium">₹{calculations.foodTotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan Total ({planCharge} × {nights})</span>
                <span className="font-medium">₹{calculations.planTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm text-success">
                <span>Discount ({discountPercent}%)</span>
                <span>-₹{calculations.discountAmount.toLocaleString()}</span>
              </div>

              <Separator className="my-1" />

              <div className="flex justify-between text-sm font-medium">
                <span>Plan Subtotal (After Discount)</span>
                <span>₹{calculations.afterDiscount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST ({gstPercent}%)</span>
                <span className="font-medium">+₹{calculations.gstAmount.toLocaleString()}</span>
              </div>

              <Separator className="my-1" />

              <div className="flex justify-between text-sm font-medium">
                <span>Final Plan Amount</span>
                <span>₹{calculations.finalPlanAmount.toLocaleString()}</span>
              </div>

              <div className="pt-4 mt-2 border-t border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-foreground">Net Amount</span>
                  <span className="text-2xl font-black text-primary">₹{calculations.netAmount.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right italic">
                  (Final Plan Amount + Food Total)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
