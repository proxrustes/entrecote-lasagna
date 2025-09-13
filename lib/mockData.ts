export const MOCK_HOUSES = [
  {
    id: "house-1",
    address: "123 Green St",
    units: [
      {
        id: "unit-1",
        name: "WE1",
        tenant: { id: "t-1", name: "Alex Doe", email: "tenant@test.com" },
        consumptionLog: [
          { timestamp: "15:00", kWh: 0.026 },
          { timestamp: "15:15", kWh: 0.027 },
        ],
        meterLog: [
          { timestamp: "15:00", value: 22.457 },
          { timestamp: "15:15", value: 22.483 },
        ],
        bills: [
          { month: "Aug", amount: 120, status: "Paid" },
          { month: "Sep", amount: 135, status: "Pending" },
        ],
      },
      {
        id: "unit-2",
        name: "WE2",
        tenant: { id: "t-2", name: "Sam Smith", email: "sam@example.com" },
        consumptionLog: [
          { timestamp: "15:00", kWh: 0.0 },
          { timestamp: "15:15", kWh: 0.0 },
        ],
        meterLog: [
          { timestamp: "15:00", value: 2.57 },
          { timestamp: "15:15", value: 2.57 },
        ],
        bills: [
          { month: "Aug", amount: 80, status: "Paid" },
          { month: "Sep", amount: 92, status: "Paid" },
        ],
      },
    ],
    generalConsumptionLog: [
      { timestamp: "15:00", kWh: 0.017 },
      { timestamp: "15:15", kWh: 0.016 },
    ],
    pvGenerationLog: [
      { timestamp: "15:00", kWh: 0.4273 },
      { timestamp: "15:15", kWh: 0.8492 },
    ],
    gridLog: [
      { timestamp: "15:00", import: 0, export: 0.3843 },
      { timestamp: "15:15", import: 0, export: 0.8062 },
    ],
  },
  {
    id: "house-2",
    address: "45 Solar Ave",
    units: [
      {
        id: "unit-1",
        name: "WE1",
        tenant: { id: "t-3", name: "Jamie Lee", email: "jamie@example.com" },
        consumptionLog: [
          { timestamp: "15:00", kWh: 0.012 },
          { timestamp: "15:15", kWh: 0.018 },
        ],
        meterLog: [
          { timestamp: "15:00", value: 11.5 },
          { timestamp: "15:15", value: 11.6 },
        ],
        bills: [
          { month: "Aug", amount: 95, status: "Paid" },
          { month: "Sep", amount: 110, status: "Pending" },
        ],
      },
    ],
    generalConsumptionLog: [
      { timestamp: "15:00", kWh: 0.01 },
      { timestamp: "15:15", kWh: 0.015 },
    ],
    pvGenerationLog: [
      { timestamp: "15:00", kWh: 0.3 },
      { timestamp: "15:15", kWh: 0.7 },
    ],
    gridLog: [
      { timestamp: "15:00", import: 0, export: 0.2 },
      { timestamp: "15:15", import: 0, export: 0.5 },
    ],
  },
];