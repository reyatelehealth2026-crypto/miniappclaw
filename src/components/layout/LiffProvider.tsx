import { createContext, useContext, useEffect, useState } from 'react';
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

interface LiffState {
  isInitialized: boolean;
  profile: LiffProfile | null;
  error: Error | null;
  accessToken: string | null;
  context: LiffContextData | null;
  environment: LiffEnvironment | null;
  isFriend: boolean | null;
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
};

const LiffContext = createContext<LiffState>(defaultState);

// ─── Provider ────────────────────────────────────────────────────────────────

export const LiffProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LiffState>(defaultState);

  useEffect(() => {
    const initLiff = async () => {
      try {
        console.log('Initializing LIFF with ID:', import.meta.env.VITE_LIFF_ID);

        await liff.init({
          liffId: import.meta.env.VITE_LIFF_ID,
          withLoginOnExternalBrowser: true, // auto-redirect to LINE Login outside LINE client
        });

        console.log('LIFF initialized successfully');

        // ── Environment detection ──────────────────────────────────────────
        const environment: LiffEnvironment = {
          os: liff.getOS() ?? 'web',
          language: liff.getLanguage() ?? 'en',
          sdkVersion: liff.getVersion() ?? '',
          lineVersion: liff.getLineVersion() ?? null,
          isInClient: liff.isInClient() ?? false,
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
              // These fields are only present for specific context types
              // These fields exist on context subtypes; safely access via unknown cast
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
          console.log('User is logged in');
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
        try {
          const friendship = await liff.getFriendship();
          isFriend = friendship.friendFlag;
        } catch (err) {
          console.warn('getFriendship failed (channel may not have a linked OA):', err);
        }

        setState({
          isInitialized: true,
          profile,
          error: null,
          accessToken,
          context,
          environment,
          isFriend,
        });
      } catch (err) {
        console.error('LIFF initialization failed', err);
        setState(prev => ({ ...prev, error: err as Error }));
      }
    };

    initLiff();
  }, []);

  // ── Loading / Error screens ──────────────────────────────────────────────

  if (state.error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-[#F4F5F6]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">LIFF Initialization Failed</h2>
        <p className="text-gray-600 mb-4">{state.error.message}</p>
        <p className="text-sm text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-red-100 break-all w-full">
          Are you opening this inside LINE? Or did you set the endpoint URL correctly in the LINE Developers Console?
        </p>
      </div>
    );
  }

  if (!state.isInitialized) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F4F5F6]">
        <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Initializing OpenClaw Connect...</p>
      </div>
    );
  }

  return <LiffContext.Provider value={state}>{children}</LiffContext.Provider>;
};

// ─── Consumer hook ───────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const useLiff = () => useContext(LiffContext);
