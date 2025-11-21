import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const haptics = {
  // Light impact - for subtle interactions
  light: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Silently fail if haptics not available (web browser)
    }
  },

  // Medium impact - for standard button presses
  medium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Silently fail
    }
  },

  // Heavy impact - for important actions
  heavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      // Silently fail
    }
  },

  // Success notification
  success: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      // Silently fail
    }
  },

  // Warning notification
  warning: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      // Silently fail
    }
  },

  // Error notification
  error: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      // Silently fail
    }
  },

  // Selection changed (for pickers/selects)
  selectionChanged: async () => {
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      // Silently fail
    }
  },
};
