export type ApiDevice = {
  id: string;
  deviceId: string;
  status: string;
  buildingId: string;
  buildingAddress: string;
  lastReading: { timestamp: string; kWh: number } | null;
  todayKWh: number;
  totalKWh: number;
  createdAt: string;
  updatedAt: string;
};

export async function getDevices(landlordId: string): Promise<ApiDevice[]> {
  const res = await fetch(
    `/api/devices?landlordId=${encodeURIComponent(landlordId)}`
  );
  if (!res.ok) throw new Error(`API /devices ${res.status}`);
  return res.json();
}
