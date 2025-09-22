import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para gerar UUID determinístico a partir de string
export function generateDeterministicUUID(input: string): string {
  // Simple hash function to create consistent UUID from string
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert hash to UUID format (v4 style but deterministic)
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const uuid = [
    hex.substring(0, 8),
    hex.substring(0, 4),
    '4' + hex.substring(1, 4), // Version 4 UUID
    '8' + hex.substring(1, 4), // Variant bits
    hex + hex.substring(0, 4)
  ].join('-');
  
  return uuid;
}

// Função para validar se string é UUID
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Função para converter meal_id para UUID válido
export function ensureValidMealId(mealId: string): string {
  if (isValidUUID(mealId)) {
    return mealId;
  }
  
  // Se não for UUID, gerar um UUID determinístico
  const deterministicUuid = generateDeterministicUUID(mealId);
  console.log(`[ensureValidMealId] Converted "${mealId}" to UUID: ${deterministicUuid}`);
  return deterministicUuid;
}

export function formatMinutesToHoursAndMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutos`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  
  return `${hours} ${hours === 1 ? 'hora' : 'horas'} e ${remainingMinutes} minutos`;
}
