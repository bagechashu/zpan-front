# ZPan Front-End Security Adaptations

## Summary

The ZPan front-end has been successfully adapted to integrate with the backend's enhanced JWT + HttpOnly Cookie authentication security improvements. All changes are **minimal and backward-compatible**.

---

## Changes Made

### 1. ✅ `src/libs/zpan/axios.js` - Enable `withCredentials`

**What Changed**:
```javascript
// Before
let config = {
    baseURL: "/api"
    // withCredentials: true, // Check cross-site Access-Control (COMMENTED)
};

// After
let config = {
    baseURL: "/api",
    withCredentials: true, // ✅ Enabled - Allows HttpOnly Cookies in CORS requests
};
```

**Why Important**:
- HttpOnly Cookies **must** be sent in cross-domain requests with this setting
- Without it, authentication would fail for cross-origin deployments
- Has **no impact** on same-origin deployments (but recommended to enable anyway)

**Security Impact**: ✅ **CRITICAL** - Enables secure cookie-based authentication

---

### 2. ✅ `src/plugins/axios.js` - Enable `withCredentials`

**What Changed**:
```javascript
// Before
let config = {
  // withCredentials: true, // Check cross-site Access-Control (COMMENTED)
};

// After
let config = {
  withCredentials: true, // ✅ Enabled - Allows HttpOnly Cookies in CORS requests
};
```

**Why Important**: Same as above - enables secure credential transport

**Security Impact**: ✅ **CRITICAL** - Backup axios instance also supports secure auth

---

## What Didn't Change (Intentionally)

✅ **API Endpoints**: 
- Login still: `POST /api/tokens`
- Logout still: `DELETE /api/tokens`
- All other endpoints unchanged

✅ **Authentication Flow**:
- No changes needed - browser handles HttpOnly Cookies transparently
- JavaScript cannot (and should not) read the cookies
- Axios automatically includes cookies in all requests

✅ **Error Handling**:
- 401 responses still redirect to `/u/signin`
- No changes to error interceptors needed

✅ **Components**:
- `Signin.vue` works as-is
- `src/libs/zpan/user.js` works as-is
- No JWT parsing in frontend needed

---

## Backend Security Enhancements (Reference)

The frontend works seamlessly with these backend improvements:

| Backend Change | Frontend Impact | Who Handles | 
|----------------|-----------------|-------------|
| HttpOnly Cookie attribute | ✅ Transparent | Browser (JavaScript cannot access) |
| SameSite=Strict | ✅ Transparent | Browser (automatic CSRF protection) |
| Secure attribute (HTTPS) | ✅ Transparent | Browser (auto-managed in HTTPS) |
| JWT validation | ✅ Through middleware | Backend auth middleware |
| JWT secret from config | ✅ No impact | Backend configuration |

---

## Integration Testing

### ✅ Login Flow
```
1. User navigates to /u/signin
2. Enters credentials and submits form
3. Frontend: axios.post('/api/tokens', {email, password})
4. Backend: Validates, returns Set-Cookie headers
5. Browser: Automatically stores z-token and z-role (HttpOnly)
6. Frontend: Redirects to home page
7. ✅ All subsequent requests include cookies automatically
```

### ✅ Authentication
```
1. User opens /app/file/list
2. Frontend: axios.get('/api/files?_sort=created')
3. Request headers automatically include:
   Cookie: z-token=...; z-role=...
4. Backend: Validates tokens, processes request
5. ✅ No frontend code changes needed!
```

### ✅ Logout
```
1. User clicks logout
2. Frontend: axios.delete('/api/tokens')
3. Backend: Deletes cookies (maxAge=-1)
4. Browser: Automatically removes HttpOnly cookies
5. ✅ No frontend code changes needed!
```

---

## Verification

### Development Environment

**Prerequisites**:
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:3000` (or built and served via Nginx)
- Backend configured with `jwt.cookie_secure: false` (HTTP environment)

**Steps**:
1. Open browser DevTools (F12)
2. Navigate to Application tab → Cookies
3. Login at `/u/signin`
4. Check that cookies appear:
   - ✅ `z-token` (HttpOnly, should not be readable from console)
   - ✅ `z-role` (HttpOnly, should not be readable from console)
5. Try API calls:
   - Open Network tab
   - Click on any resource (file operations, etc.)
   - In Request Headers, verify `Cookie: z-token=...; z-role=...`
6. Console test (should always return empty):
   ```javascript
   console.log(document.cookie)  // "" (correct - HttpOnly prevents access)
   ```

### Production Verification

**Prerequisites**:
- Frontend and backend served through Nginx (https://example.com)
- Backend configured with `jwt.cookie_secure: true` (HTTPS environment)

**Steps**:
1. Open browser DevTools
2. Navigate to Application → Cookies → example.com
3. Login and verify cookies:
   - ✅ `z-token`: Secure ✓, HttpOnly ✓, SameSite ✓
   - ✅ `z-role`: Secure ✓, HttpOnly ✓, SameSite ✓
4. All API requests should work seamlessly

---

## Deployment Guide

### Same-Origin Deployment (Recommended)

**Architecture**:
```
https://example.com
├── / → Next.js frontend (port 3000)
├── /api → Go backend (port 8080)
└── (Both served through single Nginx reverse proxy)
```

**Frontend Configuration**:
```javascript
// Already correct! Just needs:
withCredentials: true  // ✅ Enabled in both axios files
baseURL: "/api"       // ✅ Relative path works
```

**Backend Configuration** (`config.yml`):
```yaml
jwt:
  cookie_secure: true      # HTTPS environment
  access_token_ttl: 900    # 15 minutes
```

**Nginx Configuration**:
```nginx
server {
    listen 443 ssl;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }
}
```

✅ **No frontend code changes needed** - ready to deploy!

### Cross-Origin Deployment

**Architecture**:
```
Frontend: app.example.com (hosted elsewhere)
Backend:  api.example.com  (hosted elsewhere)
```

**Frontend Configuration**:
```javascript
// Already correct with withCredentials enabled!
withCredentials: true  // ✅ CRITICAL for cross-origin Auth
baseURL: "https://api.example.com/api"
```

**Backend Configuration** (`config.yml`):
```yaml
cors:
  enabled: true
  allow_origins:
    - https://app.example.com
  allow_credentials: true  # ⚠️ MUST be true for cookies
  allow_methods:
    - GET
    - POST
    - PUT
    - DELETE
    - OPTIONS
    - PATCH
  allow_headers:
    - Content-Type
    - Authorization

jwt:
  cookie_secure: true  # HTTPS required
```

✅ **Frontend code is already compatible!**

---

## Security Notes for Developers

### ✅ Do This
- Trust the browser to manage HttpOnly cookies automatically
- Always enable `withCredentials: true` in axios config
- Use HTTPS in production with `cookie_secure: true`
- Configure CORS only if frontend and backend are on different domains

### ❌ Don't Do This
- ❌ Try to read cookies from JavaScript: `document.cookie` (will be empty)
- ❌ Manually decode or parse JWT tokens in frontend
- ❌ Store tokens in localStorage (use HttpOnly cookies instead)
- ❌ Disable `withCredentials` for "convenience"
- ❌ Use `cookie_secure: false` in HTTPS environment

---

## Troubleshooting

### Issue: 401 errors after login

**Cause**: Missing `withCredentials: true`
**Solution**: Verify both axios files have `withCredentials: true` ✅

### Issue: Cookies not appearing in DevTools

**Development**:
- Check `jwt.cookie_secure: false` in backend config
- Ensure you're testing on `http://` not `https://`

**Production**:
- Check `jwt.cookie_secure: true` in backend config
- Ensure `https://` is being used
- Check CORS `allow_credentials: true` if cross-origin

### Issue: CORS errors in browser console

**Same-origin deployment**:
- No CORS middleware needed
- Just enable `withCredentials: true` in frontend ✅

**Cross-origin deployment**:
- Backend: Enable CORS with `allow_credentials: true`
- Frontend: Ensure `withCredentials: true` is enabled ✅

---

## Files Modified

```
zpan-front/
├── src/
│   ├── libs/zpan/axios.js          ✅ withCredentials: true
│   └── plugins/axios.js             ✅ withCredentials: true
└── (All other files unchanged)
```

**Total Changes**: 2 files modified, ~1 line each
**Breaking Changes**: None ✅
**Backward Compatibility**: 100% ✅

---

## Related Documentation

- [Frontend Adaptation Guide](../zpan/FRONTEND_ADAPTATION_GUIDE.md) - Detailed guide with troubleshooting
- [Security Improvements Report](../zpan/SECURITY_IMPROVEMENTS_FINAL_REPORT.md) - Backend security enhancements
- [Integration Checklist](../zpan/FRONTEND_INTEGRATION_CHECKLIST.md) - End-to-end verification steps

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024  
**Security Level**: Enhanced (JWT + HttpOnly Cookie)
