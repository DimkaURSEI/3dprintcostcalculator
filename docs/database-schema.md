# Firebase Database Structure

## Global Settings (rarely changed - saved to Firebase)

equipment/
  {equipmentId}/
    name: string
    cost: number (₽)
    lifespan: number (hours)
    power: number (Watts)
    speed: number (mm/s, optional for future auto-calc)
    filamentTypes: array of strings (e.g., ["PLA", "ABS", "PETG"])

materials/
  {materialId}/
    name: string
    type: "FDM" | "SLA"
    unit: "kg" | "liter"
    cost: number (₽/unit)
    power: number (Watts, optional - defaults to printer power)

tariffs/
  monthlyRent: number (₽/month)
  monthlyHours: number
  electricityCost: number (₽/kWh)
  laborRate: number (₽/hour - printing)
  paintingLaborRate: number (₽/hour - post-processing)

postProcessing/
  sharpening:
    light: number (₽)
    medium: number (₽)
    heavy: number (₽)
  abrasives:
    light: number (₽)
    medium: number (₽)
    heavy: number (₽)

## Orders (per calculation)

projects/
  {projectId}/
    name: string
    createdAt: timestamp
    printerId: string (from equipment/)
    materialId: string (from materials/)
    quantity: number
    printerCount: number (for parallel printing)
    partWeight: number (g, FDM only)
    partVolume: number (ml, SLA only)
    printHours: number
    printMinutes: number
    complexity: number (1.0-2.0)
    postProcessingLevel: "light" | "medium" | "heavy"
    postProcessingHours: number
    paintingEnabled: boolean
    paintingArea: number (cm²)
    paintingHours: number
    compressorPower: number (Watts)
    paintChemistry: number (₽)
    failureRate: number (%)
    totalCost: number (₽)
    status: "pending" | "printing" | "post-processing" | "painting" | "completed"
    assignedPrinterId: string (from equipment/)
    assignedPostProcessingId: string
    assignedPaintingId: string
    estimatedTime: number (minutes)
    removalTime: number (minutes, default 5)

## Scheduling (new)

printers/
  {printerId}/
    status: "available" | "busy"
    currentOrderId: string

stations/
  postProcessing/
    {stationId}/
      name: string
      status: "available" | "busy"
      currentOrderId: string
  painting/
    {stationId}/
      name: string
      status: "available" | "busy"
      currentOrderId: string
