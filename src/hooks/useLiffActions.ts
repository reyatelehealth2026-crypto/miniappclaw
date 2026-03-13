import liff from '@line/liff';
import { buildAgentResponseFlex, buildTextMessage } from '../lib/flexMessage';

/**
 * Hook providing guarded LIFF action wrappers.
 * Each action checks API availability before calling, and falls back gracefully.
 */
export function useLiffActions() {
  /** Check if a LIFF API is available in the current environment */
  const isAvailable = (api: string): boolean => {
    try {
      return liff.isApiAvailable(api);
    } catch {
      return false;
    }
  };

  /**
   * Share an agent response via LINE's friend/group picker (shareTargetPicker).
   * Builds a Flex Message card with the agent's branding.
   */
  const shareAgentResponse = async (
    agentName: string,
    agentColor: string,
    messageText: string,
  ): Promise<boolean> => {
    if (!isAvailable('shareTargetPicker')) return false;
    try {
      const flexMessage = buildAgentResponseFlex(agentName, agentColor, messageText);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await liff.shareTargetPicker([flexMessage as any]);
      return result !== undefined;
    } catch (err) {
      console.error('shareTargetPicker failed:', err);
      return false;
    }
  };

  /**
   * Send a text message directly into the current LINE chat.
   * Only works when the LIFF app was opened from a chat context.
   */
  const sendToChat = async (text: string): Promise<boolean> => {
    if (!isAvailable('sendMessages')) return false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await liff.sendMessages([buildTextMessage(text) as any]);
      return true;
    } catch (err) {
      console.error('sendMessages failed:', err);
      return false;
    }
  };

  /** Launch the QR / barcode scanner and return the scanned value */
  const scanQrCode = async (): Promise<string | null> => {
    if (!isAvailable('scanCodeV2')) return null;
    try {
      const result = await liff.scanCodeV2();
      return result.value ?? null;
    } catch (err) {
      console.error('scanCodeV2 failed:', err);
      return null;
    }
  };

  /** Open a URL in LINE's in-app browser or the system browser */
  const openUrl = (url: string, external: boolean = false) => {
    try {
      liff.openWindow({ url, external });
    } catch (err) {
      console.error('openWindow failed:', err);
      window.open(url, '_blank');
    }
  };

  /** Close the LIFF window (only works inside LINE client) */
  const closeLiff = () => {
    try {
      if (liff.isInClient()) {
        liff.closeWindow();
      }
    } catch (err) {
      console.error('closeWindow failed:', err);
    }
  };

  /** Log out and reload the page */
  const logout = () => {
    try {
      liff.logout();
      window.location.reload();
    } catch (err) {
      console.error('logout failed:', err);
    }
  };

  /** Generate a shareable LIFF permanent link, optionally for a specific hash path */
  const getPermanentLink = async (path?: string): Promise<string | null> => {
    try {
      if (path) {
        const url = new URL(window.location.href);
        url.hash = path;
        return await liff.permanentLink.createUrlBy(url.toString());
      }
      return await liff.permanentLink.createUrlBy(window.location.href);
    } catch (err) {
      console.error('permanentLink failed:', err);
      return null;
    }
  };

  return {
    isAvailable,
    shareAgentResponse,
    sendToChat,
    scanQrCode,
    openUrl,
    closeLiff,
    logout,
    getPermanentLink,
  };
}
