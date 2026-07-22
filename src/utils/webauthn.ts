import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { api } from '../api/client';

/**
 * Returns true if the current device supports WebAuthn (biometrics).
 */
export function isBiometricSupported(): boolean {
  return typeof window !== 'undefined' && 
    'PublicKeyCredential' in window;
}

/**
 * Register the current device's biometric for the logged-in user.
 * Requires a valid JWT in auth headers (user must be logged in).
 */
export async function registerBiometric(): Promise<void> {
  try {
    // Step 1: Get registration options from server
    const optionsRes = await api.get('/api/webauthn/register/generate');
    const options = optionsRes.data;

    // Step 2: Use the browser API to prompt for biometric
    const registration = await startRegistration(options);

    // Step 3: Verify with server
    await api.post('/api/webauthn/register/verify', registration);
  } catch (err: any) {
    throw new Error(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Biometric registration failed. Please try again.');
  }
}

/**
 * Log in using the saved biometric for a given username.
 * Returns the same shape as a normal login (token, role, employeeId, name).
 */
export async function loginWithBiometric(username: string): Promise<{
  token: string;
  refreshToken?: string;
  role: string;
  employeeId?: number | null;
  name?: string | null;
}> {
  if (!username.trim()) throw new Error('Please enter your username first, then tap Use Biometric.');

  // Step 1: Get auth options from server  
  const optionsRes = await api.get('/api/webauthn/authenticate/generate', {
    params: { username: username.trim() }
  });
  const options = optionsRes.data;

  // Step 2: Prompt browser for biometric
  const authResponse = await startAuthentication(options);

  // Step 3: Verify with server and get JWT
  const verifyRes = await api.post('/api/webauthn/authenticate/verify', {
    username: username.trim(),
    response: authResponse,
  });

  return verifyRes.data;
}
