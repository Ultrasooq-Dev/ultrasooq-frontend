# Google Phone Number & Date of Birth Implementation ✅

## Implementation Complete

All three steps have been implemented to fetch and store phone number and date of birth from Google OAuth.

## What Was Implemented

### Step 1: ✅ NextAuth Configuration Updated
**File**: `app/api/auth/[...nextauth]/route.ts`

- Added sensitive scopes to Google OAuth:
  - `https://www.googleapis.com/auth/user.birthday.read`
  - `https://www.googleapis.com/auth/user.phonenumbers.read`
- Implemented `jwt` callback to fetch additional data from Google People API
- Extracts phone number and date of birth from People API response
- Adds phone/DOB to session via `session` callback

### Step 2: ✅ Frontend Updated
**Files**: 
- `app/login/page.tsx`
- `app/register/page.tsx`

- Updated `handleSocialLogin` and `handleSocialRegister` functions to:
  - Accept `phoneNumber` and `dateOfBirth` from session
  - Extract country code from phone number (e.g., +91 1234567890)
  - Pass phone number, country code, and DOB to backend API

### Step 3: ✅ Backend Updated
**File**: `C:\Users\sahaa\Desktop\ultrasooq\backend\src\user\user.service.ts`

- Updated `socialLogin` method to:
  - Accept `phoneNumber`, `cc`, and `dateOfBirth` from payload
  - Store phone number and country code in MasterAccount
  - Store date of birth in MasterAccount (if provided)

## How It Works

1. **User clicks "Sign in with Google"**
   - NextAuth requests additional scopes (birthday & phone numbers)
   - User grants permission (if they have this data in Google)

2. **After OAuth callback**
   - NextAuth `jwt` callback fetches data from Google People API
   - Phone number and DOB are extracted and stored in token
   - Session callback adds them to session object

3. **Frontend receives session**
   - Login/Register pages extract phone/DOB from session
   - Phone number is parsed to extract country code
   - Data is sent to backend `/user/socialLogin` endpoint

4. **Backend stores data**
   - MasterAccount is created/updated with phone, cc, and DOB
   - User account is linked to MasterAccount

## Testing

### Prerequisites
1. ✅ Google OAuth consent screen updated with sensitive scopes (Step 4 - already done)
2. User must have phone number and/or DOB in their Google account
3. User must grant permission when prompted

### Test Steps

1. **Restart both servers:**
   ```bash
   # Frontend
   cd C:\Users\sahaa\Desktop\ultrasooq\frontend
   npm run dev
   
   # Backend
   cd C:\Users\sahaa\Desktop\ultrasooq\backend
   npm run start:dev
   ```

2. **Test Google Login:**
   - Go to `http://localhost:4001/login`
   - Click "Sign in with Google"
   - Grant permissions when prompted (including phone/birthday)
   - Check if phone number and DOB are populated in profile

3. **Verify Data:**
   - After login, go to profile page
   - Check if:
     - Phone number field is populated
     - Date of Birth field is populated
     - Country code is correctly extracted

## Important Notes

### Limitations
- **Not all users will have this data**: Users must have phone/DOB in their Google account
- **Permission required**: Users must grant permission for sensitive scopes
- **App verification**: For production, Google may require app verification for sensitive scopes
- **Silent failures**: If People API fails, login still works but phone/DOB won't be populated

### Error Handling
- If Google People API fails, it logs but doesn't break the login flow
- If phone/DOB are not available, empty strings/null are stored (can be updated later)
- Frontend gracefully handles missing phone/DOB data

## Troubleshooting

### Issue: Phone/DOB not showing up
**Possible causes:**
1. User doesn't have this data in Google account
2. User didn't grant permission for sensitive scopes
3. Google People API call failed (check browser console)
4. Backend not receiving the data (check network tab)

**Solutions:**
- Check browser console for errors
- Verify Google OAuth consent screen has the scopes
- Test with a Google account that has phone/DOB set
- Check backend logs for API errors

### Issue: Country code not extracted correctly
**Solution:**
- Phone number format should be: `+91 1234567890` or `+1 2345678900`
- The regex pattern extracts first 1-3 digits as country code
- If format is different, country code may not be extracted correctly

## Files Modified

1. ✅ `app/api/auth/[...nextauth]/route.ts` - Added People API integration
2. ✅ `app/login/page.tsx` - Updated to pass phone/DOB
3. ✅ `app/register/page.tsx` - Updated to pass phone/DOB
4. ✅ `backend/src/user/user.service.ts` - Updated to store phone/DOB

---

**Status**: ✅ All steps implemented and ready for testing!
