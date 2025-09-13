# API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
Currently no authentication required (development mode)

---

## Consumption Endpoints

### GET /api/consumption
Get energy consumption data with time period aggregation and filtering options.

**Parameters:**
- `landlordId` (required) - Landlord ID for security filtering
- `userId` (optional) - Filter by specific user
- `buildingId` (optional) - Filter by specific building (use buildingId like "BUILDING_1")
- `period` (optional) - Time period: "1day", "1week", "1month", "1year" (default: "1day")
- `endDate` (optional) - End date for time range (ISO string, defaults to now)

**Time Period Behavior:**
- **1day/1week**: Returns hourly aggregated data
- **1month/1year**: Returns daily aggregated data
- **Time Range**: Calculated backwards from endDate based on period

**Example Requests:**
```bash
# Default: Last 24 hours with hourly aggregation
curl "http://localhost:3000/api/consumption?landlordId=LANDLORD_1"

# Last week with hourly data for specific building
curl "http://localhost:3000/api/consumption?landlordId=LANDLORD_1&period=1week&buildingId=BUILDING_1"

# Last month with daily aggregation
curl "http://localhost:3000/api/consumption?landlordId=LANDLORD_1&period=1month"

# Last year from specific end date
curl "http://localhost:3000/api/consumption?landlordId=LANDLORD_1&period=1year&endDate=2024-12-31T23:59:59.000Z"

# Specific user consumption for last week
curl "http://localhost:3000/api/consumption?landlordId=LANDLORD_1&userId=CONTRACT_1&period=1week"
```

**Response:**
```json
[
  {
    "timestamp": "2024-01-15T10:00:00.000Z",
    "userId": "CONTRACT_1",
    "userName": "John Doe",
    "kWh": 15.234,
    "dataPoints": 12,
    "period": "1day",
    "aggregation": "hour",
    "timeRange": {
      "start": "2024-01-14T10:00:00.000Z",
      "end": "2024-01-15T10:00:00.000Z"
    }
  }
]
```

**Response Fields:**
- `timestamp` - Start of the aggregation period (hour or day)
- `userId` - User ID for this consumption
- `userName` - User's display name
- `kWh` - Total consumption for this period (aggregated)
- `dataPoints` - Number of raw data points aggregated
- `period` - Requested time period
- `aggregation` - Aggregation unit used ("hour" or "day")
- `timeRange` - Actual time range of data

**Status Codes:**
- `200` - Success
- `400` - Missing landlordId
- `403` - Building/user not accessible by landlord
- `500` - Server error

---

## Generation Endpoints

### GET /api/generation
Get PV generation data with time period aggregation and filtering options.

**Parameters:**
- `landlordId` (required) - Landlord ID for security filtering
- `userId` (optional) - Filter by user's building devices
- `buildingId` (optional) - Filter by specific building (use buildingId like "BUILDING_1")
- `period` (optional) - Time period: "1day", "1week", "1month", "1year" (default: "1day")
- `endDate` (optional) - End date for time range (ISO string, defaults to now)

**Time Period Behavior:**
- **1day/1week**: Returns hourly aggregated data
- **1month/1year**: Returns daily aggregated data
- **Time Range**: Calculated backwards from endDate based on period

**Example Requests:**
```bash
# Default: Last 24 hours with hourly aggregation
curl "http://localhost:3000/api/generation?landlordId=LANDLORD_1"

# Last week with hourly data for specific building
curl "http://localhost:3000/api/generation?landlordId=LANDLORD_1&period=1week&buildingId=BUILDING_1"

# Last month with daily aggregation
curl "http://localhost:3000/api/generation?landlordId=LANDLORD_1&period=1month"

# Last year from specific end date
curl "http://localhost:3000/api/generation?landlordId=LANDLORD_1&period=1year&endDate=2024-12-31T23:59:59.000Z"
```

**Response:**
```json
[
  {
    "timestamp": "2024-01-15T10:00:00.000Z",
    "deviceId": "PV_DEVICE_1",
    "buildingId": "BUILDING_1",
    "kWh": 18.567,
    "dataPoints": 12,
    "period": "1day",
    "aggregation": "hour",
    "timeRange": {
      "start": "2024-01-14T10:00:00.000Z",
      "end": "2024-01-15T10:00:00.000Z"
    }
  }
]
```

**Response Fields:**
- `timestamp` - Start of the aggregation period (hour or day)
- `deviceId` - PV device ID
- `buildingId` - Building ID where device is located
- `kWh` - Total generation for this period (aggregated)
- `dataPoints` - Number of raw data points aggregated
- `period` - Requested time period
- `aggregation` - Aggregation unit used ("hour" or "day")
- `timeRange` - Actual time range of data

**Status Codes:**
- `200` - Success
- `400` - Missing landlordId
- `403` - Building/user not accessible by landlord
- `500` - Server error

---

## Provider Endpoints

### GET /api/providers
List all energy providers.

**Example Request:**
```bash
curl "http://localhost:3000/api/providers"
```

**Response:**
```json
[
  {
    "id": "cm789...",
    "providerId": "PROVIDER_1",
    "name": "Green Energy GmbH",
    "nuclearEnergyPct": 10,
    "coalEnergyPct": 0,
    "gasEnergyPct": 0,
    "miscFossilEnergyPct": 0,
    "solarEnergyPct": 35,
    "windEnergyPct": 40,
    "miscRenewableEnergyPct": 15,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

### POST /api/providers
Create a new energy provider.

**Request Body:**
```json
{
  "name": "New Energy Corp",
  "nuclearEnergyPct": 20,
  "coalEnergyPct": 10,
  "gasEnergyPct": 15,
  "miscFossilEnergyPct": 5,
  "solarEnergyPct": 25,
  "windEnergyPct": 20,
  "miscRenewableEnergyPct": 5
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/providers" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Energy Corp", "solarEnergyPct": 50, "windEnergyPct": 30, "nuclearEnergyPct": 20}'
```

**Validation Rules:**
- `name` is required (ID is auto-generated)
- All energy percentages must sum to 100%
- Energy percentages default to 0 if not provided

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error (missing fields or percentages don't sum to 100%)
- `409` - Provider name already exists
- `500` - Server error

### GET /api/providers/[id]
Get a specific provider by auto-generated ID.

**Example Request:**
```bash
curl "http://localhost:3000/api/providers/cm5abc123def456"
```

**Status Codes:**
- `200` - Success
- `404` - Provider not found
- `500` - Server error

### PUT /api/providers/[id]
Update an existing provider by auto-generated ID.

**Request Body:** (partial updates supported)
```json
{
  "name": "Updated Provider Name",
  "solarEnergyPct": 60,
  "windEnergyPct": 25,
  "miscRenewableEnergyPct": 15
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/api/providers/cm5abc123def456" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Green Energy GmbH"}'
```

**Detailed Functionality:**
- Supports partial updates - only send fields you want to change
- When updating energy percentages, validation ensures total still equals 100%
- Uses existing values for energy types not included in update
- Provider name can be updated independently
- All 7 energy types can be updated: nuclear, coal, gas, miscFossil, solar, wind, miscRenewable

**Validation Rules:**
- If any energy percentage is updated, the total must still equal 100%
- Uses existing values for unchanged energy types

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation error
- `404` - Provider not found
- `500` - Server error

### DELETE /api/providers/[id]
Delete a provider by auto-generated ID (only if not in use by any buildings).

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/providers/cm5abc123def456"
```

**Detailed Functionality:**
- Checks if provider exists before deletion
- Prevents deletion if provider is associated with any buildings
- Returns count of buildings that would be affected if deletion fails
- Safe deletion with referential integrity protection

**Status Codes:**
- `200` - Deleted successfully
- `404` - Provider not found
- `409` - Cannot delete (provider has associated buildings)
- `500` - Server error

---

## Testing Examples

### Using curl
```bash
# Test provider creation
curl -X POST "http://localhost:3000/api/providers" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "TEST_PROVIDER",
    "name": "Test Energy Co",
    "solarEnergyPct": 100
  }'

# Test consumption data - default (last 24 hours, hourly)
curl "http://localhost:3000/api/consumption?landlordId=LANDLORD_1"

# Test consumption - last week hourly for specific building
curl "http://localhost:3000/api/consumption?landlordId=LANDLORD_1&period=1week&buildingId=BUILDING_1"

# Test consumption - last month daily aggregation
curl "http://localhost:3000/api/consumption?landlordId=LANDLORD_1&period=1month"

# Test generation data - default (last 24 hours, hourly)
curl "http://localhost:3000/api/generation?landlordId=LANDLORD_1"

# Test generation - last year daily from specific end date
curl "http://localhost:3000/api/generation?landlordId=LANDLORD_1&period=1year&endDate=2024-12-31T23:59:59.000Z&buildingId=BUILDING_1"
```

### Using Postman
1. Create new request
2. Set method (GET, POST, PUT, DELETE)
3. Enter URL: `http://localhost:3000/api/[endpoint]`
4. For POST/PUT: Add JSON body in Body tab
5. Send request

### Using VS Code REST Client
Create a `.http` file:
```http
### Get all providers
GET http://localhost:3000/api/providers

### Create new provider
POST http://localhost:3000/api/providers
Content-Type: application/json

{
  "name": "Test Provider",
  "solarEnergyPct": 70,
  "windEnergyPct": 30
}

### Get consumption data - default (24 hours, hourly)
GET http://localhost:3000/api/consumption?landlordId=LANDLORD_1

### Get consumption data - last week hourly
GET http://localhost:3000/api/consumption?landlordId=LANDLORD_1&period=1week&buildingId=BUILDING_1

### Get consumption data - last month daily
GET http://localhost:3000/api/consumption?landlordId=LANDLORD_1&period=1month

### Get generation data - default (24 hours, hourly)
GET http://localhost:3000/api/generation?landlordId=LANDLORD_1

### Get generation data - custom time range
GET http://localhost:3000/api/generation?landlordId=LANDLORD_1&period=1year&endDate=2024-12-31T23:59:59.000Z
```

---

## Complete Provider CRUD Test Sequence

Here's a complete test sequence to test Add → Edit → Delete for providers:

### Step 1: Create a New Provider
```bash
# Create provider with balanced energy mix
curl -X POST "http://localhost:3000/api/providers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Energy Company",
    "solarEnergyPct": 40,
    "windEnergyPct": 30,
    "nuclearEnergyPct": 20,
    "gasEnergyPct": 10
  }'
```

**Expected Response:**
```json
{
  "id": "cm5abc123def456",
  "name": "Test Energy Company",
  "solarEnergyPct": 40,
  "windEnergyPct": 30,
  "nuclearEnergyPct": 20,
  "gasEnergyPct": 10,
  "coalEnergyPct": 0,
  "miscFossilEnergyPct": 0,
  "miscRenewableEnergyPct": 0,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Copy the `id` from the response for the next steps!**

### Step 2: Get the Created Provider
```bash
# Replace {PROVIDER_ID} with the actual ID from step 1
curl "http://localhost:3000/api/providers/{PROVIDER_ID}"
```

### Step 3: Update the Provider
```bash
# Update energy mix - increase renewable, decrease fossil
curl -X PUT "http://localhost:3000/api/providers/{PROVIDER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Energy Company",
    "solarEnergyPct": 50,
    "windEnergyPct": 35,
    "miscRenewableEnergyPct": 10,
    "nuclearEnergyPct": 5,
    "gasEnergyPct": 0
  }'
```

**Expected Response:**
```json
{
  "id": "cm5abc123def456",
  "name": "Updated Test Energy Company",
  "solarEnergyPct": 50,
  "windEnergyPct": 35,
  "miscRenewableEnergyPct": 10,
  "nuclearEnergyPct": 5,
  "gasEnergyPct": 0,
  "coalEnergyPct": 0,
  "miscFossilEnergyPct": 0,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:05:00.000Z"
}
```

### Step 4: Verify the Update
```bash
# Get provider again to confirm changes
curl "http://localhost:3000/api/providers/{PROVIDER_ID}"
```

### Step 5: Attempt Partial Update
```bash
# Test partial update - only change name
curl -X PUT "http://localhost:3000/api/providers/{PROVIDER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Final Test Energy Company"
  }'
```

### Step 6: Delete the Provider
```bash
# Delete the test provider
curl -X DELETE "http://localhost:3000/api/providers/{PROVIDER_ID}"
```

**Expected Response:**
```json
{
  "message": "Provider deleted successfully"
}
```

### Step 7: Verify Deletion
```bash
# Try to get deleted provider (should return 404)
curl "http://localhost:3000/api/providers/{PROVIDER_ID}"
```

**Expected Response:**
```json
{
  "error": "Provider not found"
}
```

### Complete Test in One Script
```bash
#!/bin/bash

# Step 1: Create
echo "Creating provider..."
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/providers" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Energy Company", "solarEnergyPct": 40, "windEnergyPct": 30, "nuclearEnergyPct": 20, "gasEnergyPct": 10}')

# Extract ID from response
PROVIDER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Created provider with ID: $PROVIDER_ID"

# Step 2: Read
echo "Getting provider..."
curl -s "http://localhost:3000/api/providers/$PROVIDER_ID" | jq

# Step 3: Update
echo "Updating provider..."
curl -s -X PUT "http://localhost:3000/api/providers/$PROVIDER_ID" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Test Energy Company", "solarEnergyPct": 50, "windEnergyPct": 50}' | jq

# Step 4: Delete
echo "Deleting provider..."
curl -s -X DELETE "http://localhost:3000/api/providers/$PROVIDER_ID" | jq

# Step 5: Verify deletion
echo "Verifying deletion (should return 404)..."
curl -s "http://localhost:3000/api/providers/$PROVIDER_ID" | jq
```

**Note:** Replace `{PROVIDER_ID}` with the actual ID returned from the create request. The script version uses `jq` for pretty JSON formatting (install with `brew install jq` on macOS).

---

## Profit Endpoints

### GET /api/profit
Calculate landlord's profit from PV system (tenants + grid feeding).

**Parameters:**
- `landlordId` (required) - Landlord ID for security filtering
- `buildingId` (optional) - Filter by specific building
- `startDate` (optional) - Start date for calculation (ISO format, defaults to 1 year ago)
- `endDate` (optional) - End date for calculation (ISO format, defaults to now)
- `type` (optional) - "tenants", "feeding", or "combined" (default)

**Example Requests:**
```bash
# Combined profit (default)
curl "http://localhost:3000/api/profit?landlordId=LANDLORD_1"

# Only tenant profit for specific building
curl "http://localhost:3000/api/profit?landlordId=LANDLORD_1&buildingId=BUILDING_1&type=tenants"

# Profit for specific time range
curl "http://localhost:3000/api/profit?landlordId=LANDLORD_1&startDate=2024-01-01&endDate=2024-12-31"
```

**Response (Combined):**
```json
{
  "profitFromTenants": 156.75,
  "profitFromFeeding": 42.30,
  "totalProfit": 199.05,
  "currency": "EUR",
  "timeRange": {
    "start": "2023-01-15T10:00:00.000Z",
    "end": "2024-01-15T10:00:00.000Z"
  }
}
```

**Response (Tenants only):**
```json
{
  "profitFromTenants": 156.75,
  "currency": "EUR",
  "timeRange": {
    "start": "2023-01-15T10:00:00.000Z",
    "end": "2024-01-15T10:00:00.000Z"
  }
}
```

**Calculation Logic:**
- **Profit from tenants**: `min(total_pv, tenant_consumption) * pv_cost_per_kwh`
- **Profit from feeding**: `max(0, total_pv - total_consumption) * feeding_price`

**Status Codes:**
- `200` - Success
- `400` - Missing landlordId
- `404` - No buildings found for landlord
- `500` - Server error

---

## Cost Endpoints

### GET /api/costs
Calculate tenant's energy costs with PV allocation.

**Parameters:**
- `userId` (required) - Tenant user ID
- `startDate` (optional) - Start date for calculation (ISO format, defaults to 1 year ago)
- `endDate` (optional) - End date for calculation (ISO format, defaults to now)
- `unit` (optional) - "money" (default) or "kwh"

**Example Requests:**
```bash
# Tenant costs in money (default)
curl "http://localhost:3000/api/costs?userId=CONTRACT_1"

# Tenant consumption in kWh
curl "http://localhost:3000/api/costs?userId=CONTRACT_1&unit=kwh"

# Costs for specific time range
curl "http://localhost:3000/api/costs?userId=CONTRACT_1&startDate=2024-01-01&endDate=2024-03-31"
```

**Response (Money):**
```json
{
  "pvCost": 25.50,
  "gridCost": 45.30,
  "totalCost": 70.80,
  "baseFee": 12.50,
  "currency": "EUR",
  "breakdown": {
    "pvConsumption": 85.000,
    "gridConsumption": 151.000,
    "totalConsumption": 236.000,
    "pvRate": 0.30,
    "gridRate": 0.30
  },
  "timeRange": {
    "start": "2023-01-15T10:00:00.000Z",
    "end": "2024-01-15T10:00:00.000Z"
  }
}
```

**Response (kWh):**
```json
{
  "pvConsumption": 85.000,
  "gridConsumption": 151.000,
  "totalConsumption": 236.000,
  "unit": "kWh",
  "timeRange": {
    "start": "2023-01-15T10:00:00.000Z",
    "end": "2024-01-15T10:00:00.000Z"
  }
}
```

**PV Allocation Logic:**
- **Sufficient PV** (`total_pv >= total_consumption`): Tenant uses 100% PV for their consumption
- **Insufficient PV** (`total_pv < total_consumption`): Tenant gets proportional share
  - `tenant_pv_share = (tenant_consumption / total_consumption) * total_pv`
  - `tenant_grid_usage = tenant_consumption - tenant_pv_share`

**Status Codes:**
- `200` - Success
- `400` - Missing userId
- `404` - Tenant, building, or cost information not found
- `500` - Server error

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message description"
}
```

For provider deletion conflicts:
```json
{
  "error": "Cannot delete provider. It is currently used by 2 building(s)",
  "buildingsCount": 2
}
```