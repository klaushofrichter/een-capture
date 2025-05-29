# 🔒 Security Implementation for EEN Capture Application

This document outlines the comprehensive security measures implemented to protect the Firebase and Firestore databases from unauthorized access.

## 🎯 Security Objectives

- **Domain Restriction**: Only allow access from authorized domains
- **Origin Validation**: Validate request origins to prevent CSRF attacks
- **Authentication Enforcement**: Ensure all operations require proper authentication
- **Data Ownership**: Users can only access their own data
- **Input Validation**: Sanitize and validate all user inputs
- **Rate Limiting**: Prevent abuse through rate limiting
- **File Upload Security**: Validate file types and sizes

## 🌐 Authorized Domains

The application is restricted to operate only from these domains:

### Development
- `localhost` (port 3333)
- `127.0.0.1` (port 3333)

### Production
- `klaushofrichter.github.io`

## 🛡️ Security Layers

### 1. Firebase Console Configuration

**Authorized Domains** (configured in Firebase Console):
- Authentication → Settings → Authorized domains
- Only the above domains are allowed for authentication

### 2. Client-Side Domain Validation

**File**: `src/firebase.js`
- Validates domain before initializing Firebase
- Throws error if accessed from unauthorized domain
- Logs security events for monitoring

```javascript
function validateDomain() {
  const allowedDomains = ['localhost', '127.0.0.1', 'klaushofrichter.github.io'];
  const currentDomain = window.location.hostname;
  
  if (!allowedDomains.includes(currentDomain)) {
    throw new Error(`Access denied: Unauthorized domain ${currentDomain}`);
  }
}
```

### 3. Firestore Security Rules

**File**: `firestore.rules`

**Key Features**:
- **Domain Validation**: Checks request origin headers
- **Authentication Required**: All operations require valid authentication
- **Data Ownership**: Users can only access their own captures/documents
- **Input Validation**: Validates required fields and data types
- **Ownership Prevention**: Prevents users from changing document ownership

**Helper Functions**:
```javascript
function isAuthorizedDomain() {
  return request.headers.origin in [
    'http://localhost:3333',
    'http://127.0.0.1:3333', 
    'https://klaushofrichter.github.io'
  ] || request.headers.origin == null;
}

function isAuthenticated() {
  return request.auth != null && 
         request.auth.token.eenUserEmail != null &&
         isAuthorizedDomain();
}

function isOwner(resourceData) {
  return request.auth.token.eenUserEmail == resourceData.eenUserEmailField ||
         request.auth.token.email == resourceData.eenUserEmailField;
}
```

### 4. Firebase Storage Security Rules

**File**: `storage.rules`

**Key Features**:
- **Domain Validation**: Same origin checking as Firestore
- **File Type Validation**: Only allows image files
- **File Size Limits**: Maximum 10MB per image
- **Authentication Required**: All operations require authentication

**Allowed File Types**:
- `image/jpeg`
- `image/png` 
- `image/gif`
- `image/webp`

### 5. Security Service

**File**: `src/services/security.js`

**Comprehensive Security Functions**:

#### Domain & Origin Validation
- `validateCurrentDomain()`: Checks current domain
- `validateOrigin()`: Validates request origins
- `addSecurityHeaders()`: Adds security headers to requests

#### Firebase Operation Security
- `validateFirebaseOperation()`: Validates operations before execution
- Rate limiting for API calls
- Authentication checks for protected operations

#### Input Security
- `sanitizeInput()`: Removes potential XSS vectors
- `validateFileUpload()`: Validates file uploads
- Input sanitization for HTML tags, JavaScript, and event handlers

#### Rate Limiting
- Configurable rate limits per operation
- Time-window based limiting
- Stored in localStorage for client-side enforcement

#### Security Logging
- `logSecurityEvent()`: Logs all security-related events
- Includes timestamp, domain, origin, and user agent
- Ready for integration with external logging services

## 🔧 Implementation Details

### Rate Limiting Configuration

| Operation | Max Calls | Time Window |
|-----------|-----------|-------------|
| Upload    | 1000      | 60 seconds  |
| Create    | 100       | 60 seconds  |
| Update    | 100       | 60 seconds  |
| Delete    | 50        | 60 seconds  |

### File Upload Restrictions

| Property | Limit |
|----------|-------|
| File Types | image/* only |
| Max Size | 10MB per file |
| Allowed Extensions | .jpg, .png, .gif, .webp |

### Authentication Requirements

All protected operations require:
1. Valid Firebase authentication token
2. `eenUserEmail` claim in the token
3. Request from authorized domain
4. Proper ownership of resources

## 🚀 Deployment

Security rules are deployed using:

```bash
# Deploy all security rules
firebase deploy --only firestore:rules,storage

# Deploy specific rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 🔍 Monitoring & Logging

### Security Events Logged

- Domain validation failures
- Unauthorized access attempts
- Rate limit violations
- File upload violations
- Authentication failures

### Log Format

```javascript
{
  timestamp: "2024-01-15T10:30:00.000Z",
  event: "domain_validation_failed",
  domain: "unauthorized-domain.com",
  origin: "https://unauthorized-domain.com",
  userAgent: "Mozilla/5.0...",
  details: { ... }
}
```

## ⚠️ Security Considerations

### Current Limitations

1. **Client-Side Validation**: Some validations are client-side and can be bypassed
2. **Rate Limiting**: Client-side rate limiting can be circumvented
3. **Domain Spoofing**: Headers can potentially be spoofed

### Recommended Enhancements

1. **Server-Side Validation**: Implement server-side validation for critical operations
2. **IP Whitelisting**: Add IP-based restrictions for production
3. **Request Signing**: Implement request signing for API calls
4. **Audit Logging**: Send security logs to external monitoring service
5. **Anomaly Detection**: Implement behavioral analysis for unusual patterns

## 🔄 Maintenance

### Regular Security Tasks

1. **Review Access Logs**: Monitor Firebase Console for unusual activity
2. **Update Domains**: Add/remove authorized domains as needed
3. **Review Rules**: Regularly audit security rules for effectiveness
4. **Test Security**: Perform penetration testing from unauthorized domains
5. **Update Dependencies**: Keep Firebase SDK and dependencies updated

### Security Rule Testing

Test security rules using Firebase Emulator:

```bash
# Start emulator with security rules
firebase emulators:start --only firestore,storage

# Run security tests
npm run test:security
```

## 📞 Security Incident Response

If unauthorized access is detected:

1. **Immediate**: Disable affected user accounts in Firebase Console
2. **Short-term**: Update security rules to block the attack vector
3. **Long-term**: Investigate logs and implement additional protections
4. **Documentation**: Update this security documentation with lessons learned

---

**Last Updated**: January 2024  
**Security Review**: Required every 6 months  
**Next Review**: July 2024 