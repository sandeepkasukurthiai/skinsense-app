import AsyncStorage from "@react-native-async-storage/async-storage";

/** Per-day tick state for the home "ritual" checklist, kept on the device only. */
function key(prescriptionId: string) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return `regimen:${prescriptionId}:${day}`;
}

export async function loadTicks(prescriptionId: string): Promise<Record<number, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(key(prescriptionId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveTicks(prescriptionId: string, ticks: Record<number, boolean>) {
  try {
    await AsyncStorage.setItem(key(prescriptionId), JSON.stringify(ticks));
  } catch {
    // Non-critical: the checklist simply resets.
  }
}
