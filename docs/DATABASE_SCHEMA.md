# Database Schema Documentation

This document provides a comprehensive overview of the database schema for the RoofShare solar energy hackathon project.

## Overview

The database is designed to support a multi-tenant solar energy billing system for apartment buildings. It tracks energy consumption, solar generation, billing tariffs, and tenant contracts to enable transparent and fair billing for shared solar installations.

## Tables

### User Management

#### `users`
Central user table for authentication and role management.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `email` | String (Unique) | User login email |
| `password` | String | Hashed password |
| `role` | UserRole | TENANT or LANDLORD |
| `createdAt` | DateTime | Account creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:**
- One-to-many with `consumptions`
- One-to-many with `contracts`

---

### Billing & Contracts

#### `tariffs`
Pricing models for tenant electricity billing.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `name` | String (Unique) | Tariff identifier (e.g., "TENANT_T1") |
| `model` | String | Pricing model ("two_price", "flat_rate") |
| `pvPricePerKwh` | Float | Solar electricity price (€/kWh) |
| `gridPricePerKwh` | Float | Grid electricity price (€/kWh) |
| `baseFeePerMonth` | Float | Monthly base fee (€) |
| `currency` | String | Currency code (default: "EUR") |
| `validFrom` | DateTime | Tariff start date |
| `validTo` | DateTime? | Tariff end date (optional) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:**
- One-to-many with `consumptions`
- One-to-many with `contracts`

**Example Values:**
- PV Price: €0.26/kWh (22% cheaper than grid)
- Grid Price: €0.3351/kWh
- Base Fee: €10/month

#### `contracts`
Links tenants to specific meters and billing terms.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `contractId` | String (Unique) | Contract identifier (e.g., "CUST_WE1_2025") |
| `tenantName` | String | Tenant display name |
| `meterColumn` | String | Associated meter ("we1_consumption_kWh") |
| `contractStart` | DateTime | Contract start date |
| `contractEnd` | DateTime? | Contract end date (optional) |
| `billingCycle` | String | Billing frequency ("yearly") |
| `baseFeeShare` | Float | Base fee allocation (default: 1) |
| `userId` | String | Foreign key to `users` |
| `tariffId` | String | Foreign key to `tariffs` |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:**
- Many-to-one with `users`
- Many-to-one with `tariffs`

#### `settlements`
Landlord economics and feed-in pricing.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `name` | String (Unique) | Settlement identifier (e.g., "LANDLORD_S1") |
| `gridCostPerKwh` | Float | Grid purchase cost (€/kWh) |
| `feedInPricePerKwh` | Float | Feed-in revenue (€/kWh) |
| `currency` | String | Currency code (default: "EUR") |
| `validFrom` | DateTime | Settlement start date |
| `validTo` | DateTime? | Settlement end date (optional) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Example Values:**
- Grid Cost: €0.3351/kWh (passed to tenants)
- Feed-in: €0.08/kWh (landlord revenue for excess)

---

### Energy Data

#### `pv_generations`
Solar panel energy generation readings.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `timestamp` | DateTime | Reading timestamp |
| `generationKwh` | Float | Energy generated (kWh) |
| `meterId` | String? | Solar meter identifier |
| `createdAt` | DateTime | Record creation timestamp |

**Indexes:**
- `timestamp` for time-series queries

#### `consumptions`
Tenant energy consumption readings.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `timestamp` | DateTime | Reading timestamp |
| `consumptionKwh` | Float | Energy consumed (kWh) |
| `meterColumn` | String | Meter identifier |
| `userId` | String? | Tenant ID (null for common areas) |
| `tariffId` | String | Applied tariff |
| `createdAt` | DateTime | Record creation timestamp |

**Relations:**
- Many-to-one with `users` (optional)
- Many-to-one with `tariffs`

**Indexes:**
- `(timestamp, userId)` for user-specific queries
- `(meterColumn, timestamp)` for meter-specific queries

**Meter Types:**
- `we1_consumption_kWh` - Tenant 1 consumption
- `we2_consumption_kWh` - Tenant 2 consumption
- `general_consumption_kWh` - Common area consumption

#### `grid_flows`
Building-level grid import/export data.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `timestamp` | DateTime | Reading timestamp |
| `importKwh` | Float | Grid import (external power needed) |
| `exportKwh` | Float | Grid export (excess solar sold back) |
| `createdAt` | DateTime | Record creation timestamp |

**Indexes:**
- `timestamp` for time-series queries

---

## Data Relationships

### User-Centric View
```
User (Tenant)
├── Contracts (1:many) → Links to meter and tariff
├── Consumptions (1:many) → Energy usage records
└── Billing via Tariff pricing
```

### Energy Flow
```
PV Generation → Building Consumption + Grid Export
Building Consumption = Tenant 1 + Tenant 2 + Common Areas
Grid Import = When consumption > generation
```

### Billing Logic
```
For each tenant:
1. Get consumption from contracts.meterColumn
2. Apply tariff pricing (PV vs Grid rates)
3. Add proportional base fee
4. Generate monthly/yearly bill

For landlord:
1. Calculate grid purchase costs (import × cost)
2. Calculate feed-in revenue (export × price)
3. Net result = revenue - costs
```

## Sample Data

The database includes realistic sample data based on the hackathon dataset:

- **2 Tenants**: "Mieter EG rechts" and "Mieter EG links"
- **1 Landlord**: Building owner/manager
- **Tariff**: €0.26/kWh solar, €0.3351/kWh grid, €10/month base
- **Contracts**: Yearly billing cycles starting Aug 2025
- **Energy Data**: 15-minute interval readings for 10 time periods

## CSV Mapping

This schema directly maps to the provided hackathon CSV files:

| CSV File | Database Table | Purpose |
|----------|---------------|---------|
| `tenant_tariffs.csv` | `tariffs` | Pricing models |
| `contracts_yearly.csv` | `contracts` | Tenant assignments |
| `landlord_settlement.csv` | `settlements` | Landlord economics |
| `hackathon_dataset_prepared_CORRECTED.csv` | `consumptions`, `pv_generations`, `grid_flows` | Energy readings |

## Indexes & Performance

The schema is optimized for time-series queries common in energy applications:

- **Timestamp indexes** on all energy tables
- **Composite indexes** for user-specific consumption queries
- **Unique constraints** on business identifiers
- **Foreign key relationships** for data integrity

## Usage Examples

### Query tenant monthly consumption
```sql
SELECT
  DATE_TRUNC('month', timestamp) as month,
  SUM(consumptionKwh) as total_kwh
FROM consumptions
WHERE userId = 'tenant_id'
GROUP BY month
ORDER BY month;
```

### Calculate landlord monthly revenue
```sql
SELECT
  DATE_TRUNC('month', timestamp) as month,
  SUM(exportKwh * 0.08) as feedin_revenue,
  SUM(importKwh * 0.3351) as grid_costs
FROM grid_flows
GROUP BY month;
```

### Get building energy balance
```sql
SELECT
  pv.timestamp,
  pv.generationKwh,
  c.total_consumption,
  gf.importKwh,
  gf.exportKwh
FROM pv_generations pv
JOIN (
  SELECT timestamp, SUM(consumptionKwh) as total_consumption
  FROM consumptions
  GROUP BY timestamp
) c ON pv.timestamp = c.timestamp
JOIN grid_flows gf ON pv.timestamp = gf.timestamp;
```

This schema provides a complete foundation for building solar energy billing and analytics applications for the hackathon.