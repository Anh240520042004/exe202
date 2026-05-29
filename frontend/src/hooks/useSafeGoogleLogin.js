import { useGoogleLogin as useGoogleLoginOriginal } from '@react-oauth/google';

/**
 * Safe wrapper — only calls useGoogleLogin if GoogleOAuthProvider is present.
 * Returns null when VITE_GOOGLE_CLIENT_ID is not set.
 */
export const useSafeGoogleLogin = () => {
  try {
    return useGoogleLoginOriginal();
  } catch {
    return null;
  }
};
