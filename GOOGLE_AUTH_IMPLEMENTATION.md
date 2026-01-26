# Google Auth implementation (frontend) — 9ja-buyer

This project implements Google sign-in using **Google Identity Services** via `@react-oauth/google`.

## End-to-end flow (what happens)

1. The app is wrapped in `GoogleOAuthProvider` using `VITE_GOOGLE_CLIENT_ID`.
2. The UI renders a Google sign-in button (`GoogleLogin`).
3. On success, Google returns `credentialResponse.credential` (**an ID token JWT**).
4. The Login/Register page passes that ID token to `useAuthStore().googleLogin(idToken)`.
5. The store POSTs to the backend endpoint **`/buyer/google-login`** with:
   - `idToken`: the Google ID token (JWT)
   - `accessToken`: sent as the same value as `idToken` (backend currently expects both fields)
6. Backend responds with your app’s auth `token` + buyer profile fields.
7. Zustand persists auth state to `localStorage` under `auth-storage`.

## Where it is wired (files to share)

### Provider setup (required)

- `src/providers/index.tsx` wraps the app with `GoogleOAuthProvider`:

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';
import { config } from "../lib/config";

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const googleClientId = config.auth.google.clientId;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {children}
    </GoogleOAuthProvider>
  );
};
```

- `src/App.tsx` mounts `Providers`:

```tsx
import Providers from "./providers";

export default function App() {
  return (
    <Providers>
      {/* app routes */}
    </Providers>
  );
}
```

### Google button (returns an ID token JWT)

- `src/components/Auth/GoogleSignInButton.tsx`:

```tsx
import { GoogleLogin } from '@react-oauth/google';

export const GoogleSignInButton = ({ onSuccess, onError, disabled, text }) => {
  const handleSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      // This is the Google ID token JWT:
      onSuccess(credentialResponse.credential);
    } else {
      onError?.(new Error('No credential received from Google'));
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => onError?.(new Error('Google sign-in was cancelled or failed'))}
    />
  );
};
```

### Page usage (Login + Register)

- `src/pages/Auth/LoginPage.tsx` uses:
  - `const { googleLogin } = useAuthStore()`
  - `await googleLogin(idToken)` in its Google success handler

- `src/pages/Auth/RegisterPage.tsx` does the same, then redirects.

### Auth store → API call → persisted session

- `src/store/useAuthStore.ts` (google login action):

```ts
googleLogin: async (idToken) => {
  const googleData = {
    idToken,
    accessToken: idToken, // backend requires both fields
  };

  const response = await authApi.googleLogin(googleData);

  set({
    user: {
      id: response.data.buyerId,
      email: response.data.emailAddress,
      firstName: response.data.firstName,
      lastName: response.data.lastName,
      token: response.data.token,
      isEmailVerified: true,
    },
    token: response.data.token,
    isAuthenticated: true,
  });
}
```

- `src/api/auth.ts` (backend endpoint):

```ts
export interface GoogleLoginRequest {
  idToken: string;
  accessToken: string;
}

export const authApi = {
  googleLogin: async (googleData: GoogleLoginRequest) => {
    return apiClient.post('/buyer/google-login', googleData);
  },
};
```

## Configuration / env vars

- `src/lib/config.ts` reads:
  - `VITE_GOOGLE_CLIENT_ID`

In your `.env` you have `VITE_GOOGLE_CLIENT_ID=...` (don’t paste the real value into chats/docs if you don’t want it shared).

## Common issues (quick checklist)

- **Wrong token type**: this implementation sends an **ID token** (`credential`), not an OAuth access token.
  - If a backend expects an **access token**, it must either:
    - switch frontend flow to obtain one, or
    - update backend to verify Google **ID tokens** (common for “Sign in with Google”).
- **Google Console config**:
  - The OAuth client must be a **Web** client.
  - “Authorized JavaScript origins” must match dev/prod domains.
- **Missing/empty `VITE_GOOGLE_CLIENT_ID`**:
  - Provider gets an empty client id → Google button fails silently or errors.

