# Google Login Troubleshooting Guide

## Current Issue: OAuthSignin Error

The error `OAuthSignin` indicates that Google OAuth authentication failed during the sign-in process. The backend is also receiving `/api/auth/error` requests, which shouldn't happen.

## Root Cause Analysis

1. **Backend receiving NextAuth routes**: The backend shouldn't receive `/api/auth/*` requests - these should be handled by the Next.js frontend server.

2. **OAuthSignin error**: This typically means:
   - Redirect URI mismatch between Google Console and NextAuth
   - Invalid OAuth credentials
   - Network/proxy issues

## Solutions

### 1. Verify Google OAuth Redirect URI

**In Google Cloud Console:**
1. Go to APIs & Services → Credentials
2. Click on your OAuth 2.0 Client ID
3. Verify the **Authorized redirect URIs** includes:
   ```
   http://localhost:4001/api/auth/callback/google
   ```
4. Make sure there are NO trailing slashes
5. Make sure it's exactly `http://localhost:4001` (not `https://` or different port)

### 2. Verify Environment Variables

Make sure your `.env.local` has:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:4001
```

**Important**: 
- `NEXTAUTH_URL` must match exactly where your frontend is running
- No trailing slash
- Use `http://` for localhost (not `https://`)

### 3. Restart Dev Server

After updating `.env.local`:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### 4. Clear Browser Data

1. Clear cookies for `localhost:4001`
2. Clear browser cache
3. Try in incognito/private window

### 5. Check Backend Port

Make sure your backend is running on port 3000 and frontend on 4001. The backend should NOT handle `/api/auth/*` routes.

### 6. Verify NextAuth Route is Working

Test if NextAuth route is accessible:
- Open: `http://localhost:4001/api/auth/providers`
- Should return JSON with Google provider info
- If this fails, NextAuth isn't set up correctly

### 7. Check Browser Console

Open browser DevTools (F12) and check:
- Console for errors
- Network tab for failed requests
- Look for requests to `/api/auth/*` that are failing

### 8. Common Issues

**Issue**: "Invalid client" error
- **Fix**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

**Issue**: Backend receiving `/api/auth/error`
- **Fix**: Make sure frontend dev server is running on port 4001
- **Fix**: Check if there's a proxy/load balancer routing requests incorrectly

**Issue**: Redirect URI mismatch
- **Fix**: In Google Console, the redirect URI must be EXACTLY: `http://localhost:4001/api/auth/callback/google`
- **Fix**: Make sure `NEXTAUTH_URL` in `.env.local` matches: `http://localhost:4001`

## Testing Steps

1. **Test NextAuth endpoint:**
   ```
   http://localhost:4001/api/auth/providers
   ```
   Should return: `{"google":{"id":"google","name":"Google",...}}`

2. **Test Google OAuth:**
   - Go to `http://localhost:4001/login`
   - Click "Sign in with Google"
   - Should redirect to Google sign-in page
   - After signing in, should redirect back to your app

3. **Check for errors:**
   - Browser console (F12)
   - Terminal running `npm run dev`
   - Backend logs (should NOT see `/api/auth/*` requests)

## Next Steps

If the issue persists:
1. Share the exact error message from browser console
2. Share the network request details (from DevTools Network tab)
3. Verify the redirect URI in Google Console matches exactly
4. Make sure both frontend and backend servers are running
