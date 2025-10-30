import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useIsMobileApp } from './useIsMobileApp';

export const useHapticFeedback = () => {
  const { isMobileApp } = useIsMobileApp();

  const light = async () => {
    if (!isMobileApp) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error('[Haptics] Light impact error:', error);
    }
  };

  const medium = async () => {
    if (!isMobileApp) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.error('[Haptics] Medium impact error:', error);
    }
  };

  const heavy = async () => {
    if (!isMobileApp) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.error('[Haptics] Heavy impact error:', error);
    }
  };

  const success = async () => {
    if (!isMobileApp) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.error('[Haptics] Success notification error:', error);
    }
  };

  const warning = async () => {
    if (!isMobileApp) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.error('[Haptics] Warning notification error:', error);
    }
  };

  const error = async () => {
    if (!isMobileApp) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.error('[Haptics] Error notification error:', error);
    }
  };

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
  };
};
