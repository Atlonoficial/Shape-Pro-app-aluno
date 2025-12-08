/**
 * 🛒 useCheckout Hook - DISABLED FOR iOS COMPLIANCE
 * 
 * ⚠️ Apple App Store Guideline 3.1.1 Compliance
 * 
 * Este hook foi DESABILITADO para o app do aluno iOS.
 * O sistema de checkout externo (MercadoPago, Stripe, etc.) NÃO é permitido
 * pela Apple para bens/serviços digitais consumidos no app.
 * 
 * O modelo de negócio Shape Pro funciona assim:
 * - Personal Trainers configuram pagamentos no Dashboard
 * - Pagamentos pelo serviço de coaching acontecem FORA do app (PIX, transferência, etc.)
 * - O aluno usa o app GRATUITAMENTE após ser vinculado pelo professor
 * 
 * Para compras in-app (Coach AI Premium), usamos RevenueCat/Apple IAP.
 * 
 * @see Guideline 3.1.3(e) - Person-to-person services exception
 */

import { useState } from 'react';

// Keep interfaces for type compatibility with any remaining imports
interface CheckoutItem {
  type: 'course' | 'product' | 'plan';
  id: string;
  title: string;
  price: number;
  quantity?: number;
  course_id?: string;
  product_id?: string;
  plan_catalog_id?: string;
}

interface CustomerData {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * Hook desabilitado para compliance com Apple App Store.
 * Todas as chamadas retornam erro indicando que checkout externo não está disponível.
 */
export const useCheckout = () => {
  const [loading] = useState(false);

  const createCheckout = async (
    _items: CheckoutItem[],
    _customerData?: CustomerData
  ) => {
    // 🚫 DISABLED: External checkout not allowed on iOS
    console.warn(
      '[useCheckout] ⚠️ External checkout is DISABLED for iOS compliance.',
      'Use RevenueCat for in-app purchases.'
    );

    return {
      success: false,
      error: 'Checkout externo não disponível. Use o Apple App Store para assinaturas.',
      checkout_url: null,
      transaction_id: null,
      gateway_type: null,
      expires_at: null
    };
  };

  const checkPaymentStatus = async (_transactionId: string) => {
    // 🚫 DISABLED: External payment status check not available
    console.warn('[useCheckout] ⚠️ Payment status check is DISABLED for iOS compliance.');
    return null;
  };

  return {
    createCheckout,
    checkPaymentStatus,
    loading
  };
};