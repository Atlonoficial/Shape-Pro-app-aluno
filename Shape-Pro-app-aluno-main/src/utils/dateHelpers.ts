/**
 * Utilitários de data centralizados
 * Para garantir consistência em todo o sistema
 */

/**
 * Calcula o número da semana ISO 8601
 * Garante consistência em todo o sistema
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Verifica se duas datas estão na mesma semana ISO
 */
export function isSameISOWeek(date1: Date, date2: Date): boolean {
  const week1 = getISOWeekNumber(date1);
  const week2 = getISOWeekNumber(date2);
  const year1 = date1.getFullYear();
  const year2 = date2.getFullYear();
  return week1 === week2 && year1 === year2;
}

/**
 * Retorna a sexta-feira da semana para uma data
 */
export function getFridayOfWeek(date: Date): Date {
  const result = new Date(date);
  const dayOfWeek = result.getDay();
  
  if (dayOfWeek === 5) {
    // Já é sexta
    return result;
  } else if (dayOfWeek === 6) {
    // Sábado - volta 1 dia
    result.setDate(result.getDate() - 1);
  } else if (dayOfWeek === 0) {
    // Domingo - volta 2 dias
    result.setDate(result.getDate() - 2);
  } else {
    // Segunda a quinta - avança para sexta
    result.setDate(result.getDate() + (5 - dayOfWeek));
  }
  
  return result;
}
