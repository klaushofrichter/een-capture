# EEN Capture Application

A modern Vue 3 application building on top of 
[EEN Login](https://github.com/klaushofrichter/een-login) with additional 
functionality for Google Firebase. All features of EEN Login are preserved,
please refer to the README there for details. 

This application is WIP, it integrates access to a Google Firebase data base to 
capture content from EEN Cameras for further processing. Further details will be 
provded at a later point in time. 

This application uses EEN APIs but is otherwise not associated to EEN or maintained by EEN. 

## Development 

### Node.js Version Requirements
This project requires **Node.js 20.19.0 or higher**. We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.

#### Quick Setup with Helper Script
```bash
# Run the setup script to automatically configure Node.js
source scripts/setup-node.sh
```

#### Manual Setup with nvm
1. Install nvm if you haven't already: [nvm installation guide](https://github.com/nvm-sh/nvm#installing-and-updating)
2. Install and use the correct Node version:
   ```bash
   # Install Node 20.19.0 (if not already installed)
   nvm install 20.19.0
   
   # Use Node 20.19.0 (reads from .nvmrc file)
   nvm use
   
   # Verify correct version
   node --version  # Should output v20.19.0
   ```

#### Checking Node Version
You can verify your Node.js version meets the requirements:
```bash
# Check if your Node version is compatible
npm run check-node
```

#### Alternative: Manual Installation
If you prefer not to use nvm, ensure you have Node.js 20.19.0+ installed from [nodejs.org](https://nodejs.org/).

### Running Tests
The project includes end-to-end tests using Playwright:

```bash
# Run all tests (development mode)
npm test

# Run specific test
npx playwright test --grep "ESC key closes modals"

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Test in CI-like environment locally (mimics GitHub Actions)
npm run test:ci
```

#### Code Quality

The project uses ESLint 9 with flat config for code quality and Prettier for formatting:

```bash
# Run ESLint and auto-fix issues
npm run lint

# Check for ESLint issues without fixing
npm run lint:check

# Format code with Prettier
npm run format
```

#### Troubleshooting CI Test Failures

If tests fail in GitHub Actions but work locally:

1. **Test locally in CI mode** to replicate the issue:
   ```bash
   npm run test:ci
   ```

2. **Check environment variables** - Ensure all required secrets are set in GitHub:
   - `VITE_EEN_CLIENT_ID`
   - `VITE_EEN_CLIENT_SECRET` 
   - `VITE_REDIRECT_URI`
   - `TEST_USER`
   - `TEST_PASSWORD`
   - Firebase configuration secrets (all `VITE_FIREBASE_*` variables)

3. **Review test artifacts** - GitHub Actions uploads:
   - Playwright HTML reports
   - Test videos and screenshots
   - Console logs for debugging

## Security Implementation

This application implements a comprehensive multi-layered security architecture that protects Firebase and Firestore databases from unauthorized access. The security implementation includes domain restrictions, authentication enforcement, data ownership validation, and comprehensive input validation.

### 🔒 **For detailed security documentation, see [SECURITY.md](./SECURITY.md)**

### Quick Security Overview

**Domain Restrictions**: Only `localhost:3333`, `127.0.0.1:3333`, and `klaushofrichter.github.io` can access Firebase services.

**Authentication Flow**: Combines EEN OAuth authentication with Firebase custom tokens, including email verification to prevent token hijacking.

### Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Client    │    │     EEN      │    │ Firebase Cloud  │    │   Firebase   │
│ Application │    │   API/OAuth  │    │   Functions     │    │   Database   │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
       │                   │                      │                     │
       │ 1. OAuth Login    │                      │                     │
       ├──────────────────►│                      │                     │
       │                   │                      │                     │
       │ 2. Access Token   │                      │                     │
       │◄──────────────────┤                      │                     │
       │                   │                      │                     │
       │ 3. Request Custom Token                   │                     │
       │   (userId, email, token, baseUrl)        │                     │
       ├──────────────────────────────────────────►│                     │
       │                   │                      │                     │
       │                   │ 4. Verify Email      │                     │
       │                   │   /api/v3.0/users/self                     │
       │                   │◄─────────────────────┤                     │
       │                   │                      │                     │
       │                   │ 5. Email Response    │                     │
       │                   ├─────────────────────►│                     │
       │                   │                      │                     │
       │ 6. Firebase Custom Token                 │                     │
       │   (only if email matches)                │                     │
       │◄──────────────────────────────────────────┤                     │
       │                   │                      │                     │
       │ 7. Authenticated Requests                 │                     │
       ├───────────────────────────────────────────────────────────────►│
```

### Security Features

#### 1. **Email Verification Against Source of Truth**

**Problem Solved**: Prevents attackers from creating Firebase tokens using stolen user information without valid EEN access.

**Implementation**: 
- Client provides: `eenUserId`, `eenUserEmail`, `eenAccessToken`, `eenBaseUrl`
- Firebase function calls EEN API: `GET ${eenBaseUrl}/api/v3.0/users/self`
- Compares API response email with provided email
- Only creates Firebase token if emails match exactly (case-insensitive)

```javascript
// Firebase Function - Email Verification
const eenApiResponse = await axios.get(`${eenBaseUrl}/api/v3.0/users/self`, {
  headers: {
    "Accept": "application/json",
    "Authorization": `Bearer ${eenAccessToken}`,
  },
  timeout: 10000,
});

const eenApiEmail = eenApiResponse.data.email;

if (eenApiEmail.toLowerCase() !== eenUserEmail.toLowerCase()) {
  throw new HttpsError(
    "permission-denied",
    "Email verification failed: provided email does not match EEN user email"
  );
}
```

#### 2. **Token Validation Through Active API Calls**

**Problem Solved**: Ensures the EEN access token is valid and not expired/revoked.

**Implementation**:
- Every Firebase token request requires a live EEN API call
- Invalid/expired tokens result in 401/403 responses
- Network failures are handled gracefully with appropriate error codes

```javascript
// Error Handling for Different Scenarios
if (error.response.status === 401) {
  throw new HttpsError(
    "unauthenticated",
    "EEN access token is invalid or expired"
  );
} else if (error.response.status === 403) {
  throw new HttpsError(
    "permission-denied", 
    "EEN access token does not have permission to access user profile"
  );
}
```

#### 3. **Comprehensive Error Handling**

**Security Benefit**: Prevents information leakage while providing useful debugging information.

**Implementation Categories**:
- **Authentication Errors**: Invalid/expired tokens
- **Authorization Errors**: Insufficient permissions
- **Network Errors**: API unavailability
- **Validation Errors**: Email mismatches, missing parameters
- **Internal Errors**: Unexpected failures

#### 4. **Secure Parameter Validation**

**Problem Solved**: Prevents injection attacks and ensures all required security parameters are present.

```javascript
// Required Parameter Validation
if (!eenUserId || !eenUserEmail || !eenAccessToken || !eenBaseUrl) {
  throw new HttpsError(
    "invalid-argument",
    "Missing required parameters: eenUserId, eenUserEmail, eenAccessToken, or eenBaseUrl"
  );
}
```

### Security Benefits

1. **Prevents Token Hijacking**: Even if someone obtains user profile information, they cannot create Firebase tokens without a valid EEN access token.

2. **Real-time Validation**: Every authentication request validates the EEN token is currently active.

3. **Email Integrity**: Ensures the Firebase user corresponds to the actual EEN user by verifying email addresses.

4. **Audit Trail**: Comprehensive logging enables security monitoring and incident response.

5. **Defense in Depth**: Multiple validation layers (parameter validation, token validation, email verification).

### Implementation Files

- **Client Integration**: `src/services/firebase-auth.js` - Calls Firebase function with EEN credentials
- **Security Logic**: `functions/index.js` - `createCustomToken` function with email verification
- **Error Handling**: Comprehensive error codes and logging throughout the flow

### Monitoring and Debugging

View authentication logs to verify security measures:

```bash
# View Firebase function logs
firebase functions:log --only createCustomToken

# Look for these security events:
# - "Verifying EEN user email with EEN API"
# - "EEN email verification successful" 
# - "Email verification failed" (security incidents)
```

### Security Considerations for Other Implementations

When adapting this pattern for other OAuth providers:

1. **Always verify against the source API**: Don't trust client-provided user information
2. **Validate tokens through active API calls**: Ensure tokens are currently valid
3. **Implement comprehensive error handling**: Prevent information leakage
4. **Log security events**: Enable monitoring and incident response
5. **Use timeouts**: Prevent hanging requests from affecting availability
6. **Validate all parameters**: Prevent injection and ensure required data is present

This implementation demonstrates how to securely bridge OAuth authentication with Firebase custom tokens while maintaining strong security guarantees.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
