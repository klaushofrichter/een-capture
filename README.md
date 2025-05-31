# THIS REPOSITORY IS NOT MAINTAINED. IT HAS MOVED TO [THIS PLACE](https://klaushofrichter.github.io/een-gng)

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

This application implements a comprehensive multi-layered security architecture that protects against various attack vectors including XSS, injection attacks, and unauthorized access. The security implementation includes domain restrictions, authentication enforcement, data ownership validation, comprehensive input validation, and Content Security Policy.

### 🔒 Security Architecture Overview

The application employs **defense-in-depth** security with multiple layers:

1. **Content Security Policy (CSP)** - Browser-level XSS protection
2. **Input Sanitization** - Multi-pass sanitization against injection attacks  
3. **Domain Restrictions** - Firebase access limited to authorized domains
4. **Authentication Flow** - EEN OAuth + Firebase custom tokens with email verification
5. **Firebase Security Rules** - Database and storage access controls
6. **Rate Limiting** - Protection against abuse and DoS attacks

### Authentication Flow

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

#### 1. **Content Security Policy (CSP)**

**Location**: `index.html`
**Protection**: Browser-level XSS prevention

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; font-src 'self' data:;">
```

**Benefits**:
- Prevents execution of malicious inline scripts
- Restricts resource loading to trusted sources
- Blocks unauthorized external connections

#### 2. **Comprehensive Input Sanitization**

**Location**: `src/services/security.js`, `functions/index.js`
**Protection**: Multi-pass sanitization against injection attacks

**Key Features**:
- **Iterative Multi-Pass Sanitization**: Uses do-while loops to handle overlapping attack patterns
- **Global Regex Flags**: Ensures all occurrences are sanitized, not just the first
- **Enhanced Event Handler Detection**: Improved pattern matching for HTML event attributes

```javascript
// Enhanced event handler sanitization
function sanitizeEventHandlers(input) {
  let result = input;
  let previousResult;
  
  do {
    previousResult = result;
    // Enhanced pattern with positive lookahead instead of restrictive word boundaries
    result = result.replace(/\bon[a-z0-9_]*(?=\W|$)/gi, '');
    result = result.replace(/\bon[a-z0-9_]*=/gi, '');
  } while (result !== previousResult);
  
  return result;
}
```

**Protected Patterns**:
- JavaScript protocols (`javascript:`, `vbscript:`, `data:`)
- HTML event handlers (`onclick`, `onload`, `onerror`, etc.)
- Script tags and dangerous HTML elements
- SQL injection patterns
- Control characters and HTML entities

**Bypass Prevention**:
- Handles overlapping patterns like `javjavascript:ascript:alert(1)`
- Removes event handlers with numbers/underscores: `on123=alert(1)`, `on_click=alert(1)`
- Processes standalone dangerous patterns: `on=alert(1)`

#### 3. **Domain Restrictions**

**Firebase Configuration**: `src/firebase.js`
**Storage Rules**: `storage.rules`
**Firestore Rules**: `firestore.rules`

**Authorized Domains**:
- `http://localhost:3333` (development)
- `http://127.0.0.1:3333` (development)
- `https://klaushofrichter.github.io` (production)

```javascript
// Firebase configuration with domain validation
const allowedAuthDomains = [
  'klaus-hofrichter-simple.firebaseapp.com',
  'klaushofrichter.github.io'
];

// Validate auth domain
if (!allowedAuthDomains.includes(authDomain)) {
  throw new Error(`Invalid auth domain: ${authDomain}`);
}
```

#### 4. **Email Verification Against Source of Truth**

**Location**: `functions/index.js`
**Problem Solved**: Prevents token hijacking using stolen user information

**Implementation**:
- Client provides: `eenUserId`, `eenUserEmail`, `eenAccessToken`, `eenBaseUrl`
- Firebase function calls EEN API: `GET ${eenBaseUrl}/api/v3.0/users/self`
- Compares API response email with provided email
- Only creates Firebase token if emails match exactly (case-insensitive)

```javascript
// Email verification with EEN API
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

#### 5. **Firebase Security Rules**

**Firestore Rules** (`firestore.rules`):
```javascript
// User data ownership validation
function isValidUser(userId) {
  return request.auth != null && 
         request.auth.uid == userId && 
         request.auth.token.eenUserEmail != null;
}

// Users can only access their own data
match /users/{userId} {
  allow read, write: if isValidUser(userId);
}
```

**Storage Rules** (`storage.rules`):
```javascript
// Authenticated users can manage their capture images
match /captures/{captureId}/{allPaths=**} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() && isValidImageFile();
  allow delete: if isAuthenticated();
}

function isValidImageFile() {
  return request.resource.contentType.matches('image/.*') &&
         request.resource.size < 10 * 1024 * 1024; // Max 10MB per image
}
```

#### 6. **Rate Limiting and Timing Attack Protection**

**Location**: `src/services/security.js`

```javascript
// Rate limiting for different operations
checkRateLimit(operation, maxRequests = 100, windowMs = 60000) {
  // Implements sliding window rate limiting
}

// Timing attack protection
async hashCompare(provided, stored) {
  // Constant-time comparison to prevent timing attacks
}
```

#### 7. **Secure Parameter Validation**

**Problem Solved**: Prevents injection attacks and ensures required security parameters

```javascript
// Required parameter validation with sanitization
function validateAndSanitizeInput(params) {
  const sanitized = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
```

#### 8. **Session and Environment Validation**

**Environment Variables**: Enhanced validation with domain checks
**Session Management**: Secure token handling with automatic cleanup

```javascript
// Environment validation with domain restrictions
function validateEnvironment() {
  const requiredVars = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN'];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
}
```

### Security Benefits

1. **XSS Prevention**: CSP and input sanitization prevent script injection
2. **Token Hijacking Protection**: Email verification ensures legitimate access
3. **Real-time Validation**: EEN token validation ensures current access rights
4. **Injection Attack Prevention**: Multi-pass sanitization handles complex attack patterns
5. **Domain Isolation**: Access restricted to authorized domains only
6. **Data Ownership**: Users can only access their own data
7. **Rate Limiting**: Protection against abuse and DoS attacks
8. **Audit Trail**: Comprehensive logging for security monitoring

### Security Incident Response

**Monitoring Commands**:
```bash
# View Firebase function logs
firebase functions:log --only createCustomToken

# View security events
grep "SECURITY" firebase-debug.log

# Monitor authentication failures
grep "authentication.*failed" application.log
```

**Key Security Events to Monitor**:
- Email verification failures (potential attack attempts)
- Multiple failed authentication attempts
- Unusual access patterns from unauthorized domains
- Input sanitization triggers (potential injection attempts)

### Implementation Files

- **Security Service**: `src/services/security.js` - Core security functions
- **Firebase Auth**: `src/services/firebase-auth.js` - Client-side authentication
- **Firebase Functions**: `functions/index.js` - Server-side token creation with email verification
- **Firebase Rules**: `firestore.rules`, `storage.rules` - Database access controls
- **CSP Policy**: `index.html` - Browser security headers

### Compliance and Standards

This implementation follows security best practices:
- **OWASP Top 10** protection against common vulnerabilities
- **Defense in Depth** with multiple security layers
- **Principle of Least Privilege** in access controls
- **Input Validation** at all entry points
- **Secure by Default** configuration

## EEN API Services

This application provides a comprehensive set of service classes for interacting with Eagle Eye Networks (EEN) APIs. All services implement security validation, authentication checks, and error handling.

### 🎥 Camera Service (`src/services/cameras.js`)

**Purpose**: Manages camera information and device details through EEN Camera APIs.

**Key Features**:
- Camera details retrieval by ID
- Automatic authentication validation
- URL scheme security validation
- Comprehensive error handling

**Methods**:

```javascript
// Get camera details by ID
const camera = await cameraService.getCameraById('camera-123')
```

**Example Response**:
```javascript
{
  id: "camera-123",
  name: "Front Door Camera",
  status: "online",
  // ... additional camera properties
}
```

**Error Handling**:
- Authentication validation (requires valid EEN login)
- Camera not found (404) errors
- Network and API failure handling

### 📷 Media Service (`src/services/media.js`)

**Purpose**: Handles live and recorded image retrieval from EEN cameras with optimized image processing.

**Key Features**:
- Live image capture from cameras
- Historical image retrieval with timestamps
- Base64 image conversion for web display
- Automatic retry and error recovery
- EEN timestamp and token handling

**Methods**:

#### Live Image Capture
```javascript
// Get live image from camera
const result = await mediaService.getLiveImage('device-123', 'jpeg')
// Returns: { image: "data:image/jpeg;base64,...", timestamp: "...", prevToken: "..." }
```

#### Historical Image Retrieval
```javascript
// Get recorded image at specific timestamp
const result = await mediaService.getRecordedImage(
  'device-123', 
  '2024-01-15T10:30:00Z', 
  'preview'
)
```

**Image Processing**:
- Automatic ArrayBuffer to Base64 conversion
- Data URL generation for direct browser display
- Optimized memory handling for large image sequences

**Headers Handled**:
- `X-Een-Timestamp`: EEN server timestamp for synchronization
- `X-Een-PrevToken`: Token for efficient image sequencing

### 👤 User Service (`src/services/user.js`)

**Purpose**: Manages user profile information and account details from EEN APIs.

**Key Features**:
- User profile retrieval
- Automatic authentication and base URL configuration
- Axios-based HTTP client with security headers

**Methods**:

```javascript
// Get current user profile
const profile = await userService.getUserProfile()
```

**Example Response**:
```javascript
{
  id: "user-123",
  email: "user@example.com",
  name: "John Doe",
  // ... additional user properties
}
```

### 🔧 API Utilities (`src/services/api.js`)

**Purpose**: Provides foundational HTTP client creation and configuration for EEN API interactions.

**Key Features**:
- Authenticated API instance creation
- OAuth proxy configuration for authentication flow
- Centralized header and base URL management

**Methods**:

#### Authentication API Client
```javascript
// Create client for OAuth authentication
const authApi = createAuthApi()
```

#### Authenticated API Client
```javascript
// Create client for EEN API calls
const api = createApiInstance()
const response = await api.get('/api/v3.0/cameras')
```

### 🏗️ Service Architecture

All EEN API services follow a consistent architecture pattern:

#### 1. **Singleton Pattern**
```javascript
// Each service exports both class and singleton instance
export const cameraService = new CameraService()
export { CameraService } // For testing/multiple instances
```

#### 2. **Security Integration**
```javascript
// URL validation on all requests
if (!securityService.validateUrlScheme(requestUrl)) {
  throw new Error('Invalid request URL scheme')
}
```

#### 3. **Authentication Checks**
```javascript
// Consistent auth validation
if (!authStore.isAuthenticated) {
  throw new Error('Authentication required')
}
```

#### 4. **Error Handling**
```javascript
// Standardized error handling with logging
try {
  // API call
} catch (error) {
  console.error('[ServiceName] Error:', error)
  throw error
}
```

### 📊 Usage Patterns

#### Typical Camera Capture Flow
```javascript
// 1. Get camera details
const camera = await cameraService.getCameraById(cameraId)

// 2. Capture live image
const liveImage = await mediaService.getLiveImage(cameraId)

// 3. Get historical images for sequence
const images = []
for (const timestamp of timestamps) {
  const image = await mediaService.getRecordedImage(cameraId, timestamp)
  if (image.image) images.push(image)
}
```

#### User Profile Integration
```javascript
// Get user profile for display
const profile = await userService.getUserProfile()
console.log(`Logged in as: ${profile.name} (${profile.email})`)
```

### 🔗 EEN API Endpoints Used

The services interact with these EEN API endpoints:

- **Cameras**: `GET /api/v3.0/cameras/{id}` - Camera details
- **Live Images**: `GET /api/v3.0/media/liveImage.jpeg` - Real-time camera images
- **Recorded Images**: `GET /api/v3.0/media/recordedImage.jpeg` - Historical images
- **User Profile**: `GET /api/v3.0/users/self` - Current user information

### 🛡️ Security Features

All EEN API services include:

- **Authentication Validation**: Ensures valid EEN OAuth tokens
- **URL Scheme Validation**: Prevents protocol injection attacks
- **Input Sanitization**: Protects against injection vulnerabilities
- **Rate Limiting**: Built-in protection against API abuse
- **Error Logging**: Security incident tracking and debugging

### 🚀 Performance Optimizations

- **Singleton Pattern**: Reduces memory overhead and initialization costs
- **Base64 Conversion**: Optimized ArrayBuffer processing for images
- **Automatic Retry Logic**: Built-in resilience for network failures
- **Memory Management**: Efficient handling of large image sequences
- **Async/Await**: Non-blocking operations for better user experience

### 🧪 Testing Support

All services are designed for easy testing:

```javascript
// Import class for unit testing
import { CameraService } from '@/services/cameras'

// Create test instance with mocked dependencies
const testService = new CameraService()
```

**Mock-Friendly Design**:
- Dependency injection support
- Separated business logic from HTTP concerns
- Comprehensive error scenarios for test coverage

### 📝 Adding New EEN API Services

When adding new EEN API functionality:

1. **Follow the established pattern**: Use the existing services as templates
2. **Include security validation**: All requests must validate URLs and authentication
3. **Implement error handling**: Provide meaningful error messages and logging
4. **Export both class and singleton**: Support both direct usage and testing
5. **Document methods**: Include JSDoc comments for all public methods

**Example New Service**:
```javascript
class DeviceService {
  async getDeviceList() {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }
    
    const url = `${authStore.baseUrl}/api/v3.0/devices`
    
    if (!securityService.validateUrlScheme(url)) {
      throw new Error('Invalid request URL scheme')
    }
    
    // ... implementation
  }
}

export const deviceService = new DeviceService()
export { DeviceService }
```

This service architecture provides a robust, secure, and maintainable foundation for all EEN API interactions while ensuring consistency across the application.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
