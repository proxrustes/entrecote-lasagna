# API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
Currently no authentication required (development mode)

---

## Consumption Endpoints

### GET /api/consumption
Get energy consumption data with filtering options.

**Parameters:**
- `landlordId` (required) - Landlord ID for security filtering
- `userId` (optional) - Filter by specific user
- `buildingId` (optional) - Filter by specific building

**Example Request:**
```bash
curl "http://localhost:3000/api/consumption?landlordId=LANDLORD_1&userId=CONTRACT_1"
```

**Response:**
```json
[
  {
    "id": "cm123...",
    "timestamp": "2024-01-15T10:00:00.000Z",
    "consumptionKwh": 2.5,
    "userId": "CONTRACT_1",
    "user": {
      "name": "John Doe"
    },
    "buildingId": "BUILDING_1"
  }
]
```

**Status Codes:**
- `200` - Success
- `400` - Missing landlordId
- `500` - Server error

---

## Generation Endpoints

### GET /api/generation
Get PV generation data with filtering options.

**Parameters:**
- `landlordId` (required) - Landlord ID for security filtering
- `userId` (optional) - Filter by user's building devices
- `buildingId` (optional) - Filter by specific building

**Example Request:**
```bash
curl "http://localhost:3000/api/generation?landlordId=LANDLORD_1&buildingId=BUILDING_1"
```

**Response:**
```json
[
  {
    "id": "cm456...",
    "timestamp": "2024-01-15T10:00:00.000Z",
    "generationKwh": 3.2,
    "deviceId": "PV_DEVICE_1",
    "device": {
      "deviceId": "PV_DEVICE_1",
      "buildingId": "BUILDING_1"
    }
  }
]
```

**Status Codes:**
- `200` - Success
- `400` - Missing landlordId
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
  "providerId": "PROVIDER_4",
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
  -d '{"providerId": "PROVIDER_4", "name": "New Energy Corp", "solarEnergyPct": 50, "windEnergyPct": 30, "nuclearEnergyPct": 20}'
```

**Validation Rules:**
- `providerId` and `name` are required
- All energy percentages must sum to 100%
- Energy percentages default to 0 if not provided

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error (missing fields or percentages don't sum to 100%)
- `409` - Provider ID already exists
- `500` - Server error

### GET /api/providers/[providerId]
Get a specific provider by ID.

**Example Request:**
```bash
curl "http://localhost:3000/api/providers/PROVIDER_1"
```

**Status Codes:**
- `200` - Success
- `404` - Provider not found
- `500` - Server error

### PUT /api/providers/[providerId]
Update an existing provider.

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
curl -X PUT "http://localhost:3000/api/providers/PROVIDER_1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Green Energy GmbH"}'
```

**Validation Rules:**
- If any energy percentage is updated, the total must still equal 100%
- Uses existing values for unchanged energy types

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation error
- `404` - Provider not found
- `500` - Server error

### DELETE /api/providers/[providerId]
Delete a provider (only if not in use by any buildings).

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/providers/PROVIDER_1"
```

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

# Test consumption data
curl "http://localhost:3000/api/consumption?landlordId=LANDLORD_1"

# Test generation data
curl "http://localhost:3000/api/generation?landlordId=LANDLORD_1&buildingId=BUILDING_1"
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
  "providerId": "PROVIDER_TEST",
  "name": "Test Provider",
  "solarEnergyPct": 70,
  "windEnergyPct": 30
}

### Get consumption data
GET http://localhost:3000/api/consumption?landlordId=LANDLORD_1
```

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