# ZenVentora Accounts

A standalone identity and sign-in portal for ZenVentora products.

## Stack
- React + TypeScript + Vite
- Supabase Auth (email/password, email confirmation, password recovery, Google OAuth)
- Supabase Postgres profile table with row-level security
- Render Static Site hosting

## Local development
1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the new ZenVentora Accounts Supabase project URL and publishable key.
3. Run `npm install`, then `npm run dev`.

## Supabase dashboard setup still required
- Authentication > URL Configuration: set the production Site URL to `https://accounts.zenventora.in`; allow the production callback URLs `https://accounts.zenventora.in/auth/callback` and `https://accounts.zenventora.in/reset-password`, plus the Render preview URL during initial testing.
- Authentication > Providers > Google: enable Google and add the Google OAuth client ID and secret. Add the Supabase callback URL shown in the provider settings to the Google Cloud OAuth client.
- Authentication > Email: configure confirmation and password recovery email templates. For the 6-digit code screen, use the Supabase email OTP variable `{{ .Token }}`; if using the default confirmation link, users can open the link and return to the callback route.
- Configure a custom SMTP provider only after obtaining SMTP credentials from the verified sending domain provider. Never put SMTP credentials or service-role keys in this frontend.

## Security notes
- The browser uses only the Supabase publishable key. Never add a service-role key or SMTP password to Vite variables.
- Profile data is isolated by RLS and keyed to `auth.uid()`.
- New account registration requires email confirmation when Supabase email confirmation is enabled.
- OAuth requires the provider to be configured in Supabase before Google sign-in can work.

## Deployment
Render static site build command: `npm install && npm run build`
Publish directory: `dist`
Required build environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
