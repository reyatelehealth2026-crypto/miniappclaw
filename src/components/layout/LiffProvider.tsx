import React, { createContext, useContext, useEffect, useState } from 'react';
import liff from '@line/liff';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface LiffContextType {
  isInitialized: boolean;
  profile: LiffProfile | null;
  error: Error | null;
}

const LiffContext = createContext<LiffContextType>({ isInitialized: false, profile: null, error: null });

export const LiffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        console.log("Initializing LIFF with ID:", import.meta.env.VITE_LIFF_ID);
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
        console.log("LIFF initialized successfully");
        
        if (liff.isLoggedIn()) {
          console.log("User is logged in");
          const userProfile = await liff.getProfile();
          setProfile(userProfile);
        } else {
          console.log("User is NOT logged in. Attempting login...");
          // Skip login if in LINE app or mini app context
          if (!liff.isInClient()) {
             liff.login();
          }
        }
        setIsInitialized(true);
      } catch (err) {
        console.error("LIFF initialization failed", err);
        setError(err as Error);
      }
    };
    initLiff();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-[#F4F5F6]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">LIFF Initialization Failed</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <p className="text-sm text-gray-500 bg-white p-4 rounded-lg shadow-sm border border-red-100 break-all w-full">
          Are you opening this inside LINE? Or did you set the endpoint URL correctly in the LINE Developers Console?
        </p>
      </div>
    );
  }
  
  if (!isInitialized) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F4F5F6]">
        <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Initializing OpenClaw Connect...</p>
      </div>
    );
  }

  return <LiffContext.Provider value={{ isInitialized, profile, error }}>{children}</LiffContext.Provider>;
};

export const useLiff = () => useContext(LiffContext);
