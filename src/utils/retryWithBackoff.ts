/**
 * Retry utility with exponential backoff
 * Retries failed operations with increasing delays
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 1,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error as Error;
      
      // Don't retry on authentication or permission errors
      if (error?.code === 'PGRST301' || error?.code === '42501') {
        throw error;
      }
      
      // Last retry - throw error
      if (i === maxRetries - 1) break;
      
      // Single retry with 2s delay
      const delay = initialDelay;
      console.log(`⏳ Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}
