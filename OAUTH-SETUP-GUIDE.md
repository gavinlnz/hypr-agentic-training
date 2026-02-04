# OAuth Setup Guide

## 🚀 Quick Setup Instructions

### Step 1: Create GitHub OAuth App

1. **Go to GitHub Settings**:
   - Visit: https://github.com/settings/developers
   - Click "OAuth Apps" → "New OAuth App"

2. **Fill in these exact details**:
   ```
   Application name: Config Service Local Dev
   Homepage URL: http://localhost:3001
   Authorization callback URL: http://localhost:8000/auth/callback
   Description: Local development OAuth for Config Service
   ```
   
   **Important**: 
   - ✅ **Leave "Enable Device Flow" UNCHECKED** (we're using web app flow)
   - ✅ Make sure "Authorization callback URL" is exactly `http://localhost:8000/auth/callback`

3. **After creating**, GitHub will show you:
   - **Client ID** (looks like: `Ov23liABCDEF1234567890`)
   - **Client Secret** (click "Generate a new client secret")

### Step 2: Configure Your API

1. **Edit the file**: `config-service-dotnet/src/ConfigService.Api/appsettings.Development.json`

2. **Replace the placeholders**:
   ```json
   {
     "OAuth": {
       "CallbackBaseUrl": "http://localhost:8000",
       "Providers": {
         "github": {
           "ClientId": "YOUR_ACTUAL_GITHUB_CLIENT_ID_HERE",
           "ClientSecret": "YOUR_ACTUAL_GITHUB_CLIENT_SECRET_HERE",
           "IsEnabled": true
         }
       }
     }
   }
   ```

### Step 3: Test the Setup

1. **Start the API**:
   ```bash
   cd config-service-dotnet/src/ConfigService.Api
   dotnet run
   ```

2. **Start the UI**:
   ```bash
   cd ui
   npm run dev
   ```

3. **Test OAuth endpoints**:
   - Visit: http://localhost:8000/auth/providers
   - Should return: `[{"name":"github","displayName":"GitHub","authorizationUrl":"https://github.com/login/oauth/authorize","iconUrl":"https://github.com/favicon.ico","isEnabled":true}]`

4. **Test the full flow**:
   - Visit: http://localhost:3001
   - Should see login form with "Continue with GitHub" button
   - Click button → redirects to GitHub → authorize → redirects back with login

## 🔍 Testing Endpoints

### Check Available Providers
```bash
curl http://localhost:8000/auth/providers
```

### Get Authorization URL
```bash
curl "http://localhost:8000/auth/authorize/github?returnUrl=http://localhost:3001"
```

### Check Current User (after login)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/auth/me
```

## 🐛 Troubleshooting

### "OAuth provider 'github' not found"
- Check that `ClientId` and `ClientSecret` are set in `appsettings.Development.json`
- Restart the API after changing configuration

### "Invalid redirect_uri"
- Ensure GitHub OAuth app callback URL is exactly: `http://localhost:8000/auth/callback`
- Check that `CallbackBaseUrl` in config matches

### "Authentication failed"
- Check browser developer tools for errors
- Verify JWT key is set in configuration
- Check API logs for detailed error messages

### CORS Issues
- API should allow `http://localhost:3001` origin
- Check browser network tab for CORS errors

## 🔐 Security Notes

- **Never commit** real OAuth credentials to git
- Use `appsettings.Development.json` for local development
- Use environment variables or Azure Key Vault for production
- The first user to log in becomes Admin automatically

## 📋 What Happens During OAuth Flow

1. User clicks "Continue with GitHub"
2. Frontend calls `/auth/authorize/github`
3. API generates OAuth state (CSRF protection) and returns GitHub URL
4. User redirects to GitHub, authorizes the app
5. GitHub redirects back to `/auth/callback` with authorization code
6. API exchanges code for access token with GitHub
7. API fetches user profile from GitHub
8. API creates/updates user in database
9. API generates JWT access token and refresh token
10. Frontend stores tokens and shows main app

## 🎯 Expected User Experience

1. **First Visit**: Login form with GitHub button
2. **Click GitHub**: Redirect to GitHub authorization
3. **Authorize**: GitHub asks permission for email/profile
4. **Success**: Redirect back to app, now logged in as Admin
5. **Subsequent Visits**: Automatic login with stored tokens
6. **Token Expiry**: Automatic refresh or re-login prompt

The system is now ready for production with proper OAuth security! 🎉