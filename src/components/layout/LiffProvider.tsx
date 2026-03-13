import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import liff from '@line/liff';

// ─── Public types ────────────────────────────────────────────────────────────

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LiffContextData {
  /** 'utou' | 'room' | 'group' | 'none' | 'square_chat' */
  type?: string;
  /** 'compact' | 'tall' | 'full' */
  viewType?: string;
  userId?: string;
  utouId?: string;
  roomId?: string;
  groupId?: string;
}

export interface LiffEnvironment {
  /** 'ios' | 'android' | 'web' */
  os: string;
  /** LINE app language (RFC 5646), e.g. 'th', 'en', 'ja' */
  language: string;
  /** LIFF SDK version */
  sdkVersion: string;
  /** LINE app version, null on external browsers */
  lineVersion: string | null;
  /** Whether running inside LINE's in-app browser */
  isInClient: boolean;
}

/** Capabilities specific to LINE Mini App vs regular LIFF browser */
export interface MiniAppCapabilities {
  /** true when running inside LINE app (not external browser) */
  isMiniApp: boolean;
  /** Can send messages to the chat the LIFF was opened from */
  canSendMessages: boolean;
  /** Can use share target picker to share content */
  canShareTargetPicker: boolean;
  /** Can scan QR codes via scanCodeV2 */
  canScanCode: boolean;
  /** Can use the Bluetooth LE API */
  canUseBluetooth: boolean;
  /** The context type: 'utou', 'group', 'room', 'none' etc */
  launchContext: string;
  /** View type: 'compact', 'tall', 'full' */
  viewType: string;
  /** Whether user is a friend of the OA */
  isFriend: boolean;
}

interface LiffState {
  isInitialized: boolean;
  profile: LiffProfile | null;
  error: Error | null;
  accessToken: string | null;
  context: LiffContextData | null;
  environment: LiffEnvironment | null;
  isFriend: boolean | null;
  miniApp: MiniAppCapabilities | null;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const defaultState: LiffState = {
  isInitialized: false,
  profile: null,
  error: null,
  accessToken: null,
  context: null,
  environment: null,
  isFriend: null,
  miniApp: null,
};

const LiffContext = createContext<LiffState>(defaultState);

// ─── Provider ────────────────────────────────────────────────────────────────

export const LiffProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LiffState>(defaultState);
  const shouldCheckFriendship = import.meta.env.VITE_LIFF_CHECK_FRIENDSHIP === 'true';

  const checkApiAvailable = useCallback((api: string): boolean => {
    try {
      return liff.isApiAvailable(api);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({
          liffId: import.meta.env.VITE_LIFF_ID,
          withLoginOnExternalBrowser: true,
        });

        // ── Environment detection ──────────────────────────────────────────
        const isInClient = liff.isInClient() ?? false;
        const environment: LiffEnvironment = {
          os: liff.getOS() ?? 'web',
          language: liff.getLanguage() ?? 'en',
          sdkVersion: liff.getVersion() ?? '',
          lineVersion: liff.getLineVersion() ?? null,
          isInClient,
        };

        // ── Context (launch source) ────────────────────────────────────────
        let context: LiffContextData | null = null;
        try {
          const ctx = liff.getContext();
          if (ctx) {
            context = {
              type: ctx.type,
              viewType: ctx.viewType,
              userId: ctx.userId,
              utouId: (ctx as unknown as Record<string, unknown>).utouId as string | undefined,
              roomId: (ctx as unknown as Record<string, unknown>).roomId as string | undefined,
              groupId: (ctx as unknown as Record<string, unknown>).groupId as string | undefined,
            };
          }
        } catch (err) {
          console.warn('getContext failed:', err);
        }

        // ── Auth + Profile ─────────────────────────────────────────────────
        let profile: LiffProfile | null = null;
        let accessToken: string | null = null;

        if (liff.isLoggedIn()) {
          accessToken = liff.getAccessToken();
          const userProfile = await liff.getProfile();
          profile = {
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            statusMessage: userProfile.statusMessage,
          };
        }

        // ── Friendship check ───────────────────────────────────────────────
        let isFriend: boolean | null = null;
        if (shouldCheckFriendship && liff.isLoggedIn()) {
          try {
            const friendship = await liff.getFriendship();
            isFriend = friendship.friendFlag;
          } catch (err) {
            if (import.meta.env.DEV) {
              console.info('Friendship status unavailable. Enable the friendship option in LIFF settings to use this feature.', err);
            }
          }
        }

        // ── Mini App capabilities detection ────────────────────────────────
        // This is the key differentiator: inside LINE app = Mini App mode
        // with access to native APIs. External browser = limited LIFF mode.
        const miniApp: MiniAppCapabilities = {
          isMiniApp: isInClient,
          canSendMessages: checkApiAvailable('sendMessages'),
          canShareTargetPicker: checkApiAvailable('shareTargetPicker'),
          canScanCode: checkApiAvailable('scanCodeV2'),
          canUseBluetooth: checkApiAvailable('bluetooth'),
          launchContext: context?.type ?? 'none',
          viewType: context?.viewType ?? 'full',
          isFriend: isFriend ?? false,
        };

        // Log environment for debugging
        console.log('[LIFF] Environment:', {
          isInClient,
          os: environment.os,
          lineVersion: environment.lineVersion,
          context: context?.type,
          viewType: context?.viewType,
          miniApp,
        });

        setState({
          isInitialized: true,
          profile,
          error: null,
          accessToken,
          context,
          environment,
          isFriend,
          miniApp,
        });
      } catch (err) {
        console.error('LIFF initialization failed', err);
        setState(prev => ({ ...prev, error: err as Error }));
      }
    };

    initLiff();
  }, [checkApiAvailable, shouldCheckFriendship]);

  // ── Loading / Error screens ──────────────────────────────────────────────

  if (state.error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-[#F4F5F6]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">เชื่อมต่อไม่สำเร็จ</h2>
        <p className="text-gray-600 mb-4">{state.error.message}</p>
        <p className="text-sm text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-red-100 break-all w-full">
          กรุณาเปิดแอปนี้ผ่าน LINE หรือตรวจสอบ endpoint URL ใน LINE Developers Console
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-[#06C755] text-white rounded-full font-medium text-sm"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!state.isInitialized) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F4F5F6]">
        <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">กำลังเชื่อมต่อ OpenClaw Connect...</p>
      </div>
    );
  }

  return <LiffContext.Provider value={state}>{children}</LiffContext.Provider>;
};

// ─── Consumer hook ───────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const useLiff = () => useContext(LiffContext);
