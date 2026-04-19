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

consumables/ (includes materials like filament/resin and other consumables)
  {consumableId}/
    name: string (e.g., "PLA", "ABS", "Изопропиловый спирт")
    cost: number (₽/unit)
    unit: "kg" | "л" | "шт" | "мл" | "г"

## Calculator Layout

The Calculator now has a 3-column layout:
- **Left:** Order information and parts list
- **Middle:** Part parameters form
- **Right:** Calculated results

Settings are now in a separate "Settings" tab (Calculator | Settings | ERP).

## Workflow

1. Create order in Calculator tab (left panel)
2. Add parts with parameters (middle panel)
3. Calculate cost (right panel shows results)
4. Save order
5. Go to ERP tab to assign parts to timeline

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

projects/ (legacy - will be migrated to orders)
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

orders/ (new structure)
  {orderId}/
    name: string
    clientName: string (optional)
    comment: string (optional)
    createdAt: timestamp
    status: "pending" | "in_progress" | "completed"
  {orderId}/parts/{partId}/
    name: string
    materialType: string
    materialCost: number
    partWeight: number (g, FDM only)
    partVolume: number (ml, SLA only)
    quantity: number
    printHours: number
    printMinutes: number
    estimatedCost: number

assignments/ (new structure)
  {assignmentId}/
    orderId: string
    partId: string
    printerId: string (from equipment/)
    stationId: string (for post-processing/painting)
    quantity: number
    status: "pending" | "in_progress" | "completed"
    assignedAt: timestamp
    completedAt: timestamp

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
