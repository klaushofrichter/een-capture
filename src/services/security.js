/**
 * Security Service for EEN Capture Application
 * Handles domain validation, request validation, and security checks
 */

class SecurityService {
  constructor() {
    this.allowedDomains = [
      'localhost',
      '127.0.0.1', 
      'klaushofrichter.github.io'
    ];
    
    this.allowedOrigins = [
      'http://localhost:3333',
      'http://127.0.0.1:3333',
      'https://klaushofrichter.github.io'
    ];
  }

  /**
   * Validate current domain against allowed domains
   */
  validateCurrentDomain() {
    const currentDomain = window.location.hostname;
    const isAuthorized = this.allowedDomains.includes(currentDomain);
    
    if (!isAuthorized) {
      console.error(`🚫 Security: Unauthorized domain ${currentDomain}`);
      return false;
    }
    
    console.log(`✅ Security: Domain ${currentDomain} authorized`);
    return true;
  }

  /**
   * Validate origin for API requests
   */
  validateOrigin(origin = window.location.origin) {
    const isAuthorized = this.allowedOrigins.includes(origin);
    
    if (!isAuthorized) {
      console.error(`🚫 Security: Unauthorized origin ${origin}`);
      return false;
    }
    
    return true;
  }

  /**
   * Add security headers to fetch requests
   */
  addSecurityHeaders(headers = {}) {
    return {
      ...headers,
      'X-Requested-With': 'XMLHttpRequest',
      'X-Domain-Validation': window.location.hostname,
      'Origin': window.location.origin,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }

  /**
   * Validate Firebase operation is allowed
   */
  validateFirebaseOperation(operation, user = null) {
    // Check domain
    if (!this.validateCurrentDomain()) {
      throw new Error('Domain not authorized for Firebase operations');
    }

    // Check origin
    if (!this.validateOrigin()) {
      throw new Error('Origin not authorized for Firebase operations');
    }

    // Check authentication for protected operations
    const protectedOperations = ['create', 'update', 'delete', 'upload'];
    if (protectedOperations.includes(operation) && !user) {
      throw new Error('Authentication required for this operation');
    }

    return true;
  }

  /**
   * Validate URL scheme to prevent dangerous protocols
   */
  validateUrlScheme(url) {
    if (typeof url !== 'string') return false;
    
    try {
      const urlObj = new URL(url);
      const allowedSchemes = ['http:', 'https:'];
      
      if (!allowedSchemes.includes(urlObj.protocol)) {
        console.warn(`🚫 Security: Blocked dangerous URL scheme: ${urlObj.protocol}`);
        return false;
      }
      
      return true;
    } catch (error) {
      // Invalid URL format
      console.warn(`🚫 Security: Invalid URL format: ${url}`);
      return false;
    }
  }

  /**
   * Sanitize user input to prevent injection attacks
   * Uses global flag and iterative approach to handle overlapping patterns
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    let sanitized = input;
    let previousLength;
    
    // Keep sanitizing until no more changes occur (handles overlapping patterns)
    do {
      previousLength = sanitized.length;
      
      sanitized = sanitized
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocols (global)
        .replace(/data:/gi, '') // Remove data: protocols (global)
        .replace(/vbscript:/gi, '') // Remove vbscript: protocols (global)
        .replace(/file:/gi, '') // Remove file: protocols (global)
        .replace(/about:/gi, '') // Remove about: protocols (global)
        .replace(/on\s*\w*\s*=/gi, '') // Remove event handlers with optional spaces (global)
        .replace(/\bon[a-z]*\b/gi, '') // Remove any on* patterns at word boundaries
        .replace(/\s+on\s+/gi, ' ') // Remove standalone 'on' with spaces
        .replace(/\bon\s/gi, ' ') // Remove 'on' followed by space at word boundary
        .replace(/\s+on$/gi, ' ') // Remove 'on' at end of string with spaces
        .replace(/^on\s/gi, '') // Remove 'on' at start of string followed by space
        .replace(/\bon$/gi, '') // Remove standalone 'on' at word boundary and end
        .replace(/^on$/gi, '') // Remove if string is exactly 'on'
        .replace(/&[#\w]+;/g, '') // Remove HTML entities that could be used for encoding
        .replace(/[\p{Cc}]/gu, '') // Remove control characters using Unicode property
        .trim();
        
    } while (sanitized.length !== previousLength && sanitized.length > 0);
    
    return sanitized;
  }

  /**
   * Validate and sanitize input for specific contexts
   */
  validateInput(input, type = 'general') {
    if (typeof input !== 'string') return { isValid: false, sanitized: '', error: 'Input must be a string' };
    
    // First apply general sanitization
    const sanitized = this.sanitizeInput(input);
    
    // Apply context-specific validation
    switch (type) {
      case 'email': {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return {
          isValid: emailRegex.test(sanitized),
          sanitized,
          error: emailRegex.test(sanitized) ? null : 'Invalid email format'
        };
      }
        
      case 'url': {
        try {
          new URL(sanitized);
          const isValid = this.validateUrlScheme(sanitized);
          return {
            isValid,
            sanitized,
            error: isValid ? null : 'Invalid or unsafe URL'
          };
        } catch {
          return { isValid: false, sanitized, error: 'Invalid URL format' };
        }
      }
        
      case 'alphanumeric': {
        const alphanumericRegex = /^[a-zA-Z0-9\s-_]+$/;
        return {
          isValid: alphanumericRegex.test(sanitized),
          sanitized,
          error: alphanumericRegex.test(sanitized) ? null : 'Only alphanumeric characters, spaces, hyphens, and underscores allowed'
        };
      }
        
      case 'general':
      default:
        return {
          isValid: sanitized.length > 0,
          sanitized,
          error: sanitized.length > 0 ? null : 'Input cannot be empty after sanitization'
        };
    }
  }

  /**
   * Validate file upload security
   */
  validateFileUpload(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }
    
    if (file.size > maxSize) {
      throw new Error(`File size ${file.size} exceeds maximum ${maxSize}`);
    }
    
    return true;
  }

  /**
   * Rate limiting for API calls
   */
  checkRateLimit(operation, maxCalls = 100, timeWindow = 60000) {
    const key = `rateLimit_${operation}`;
    const now = Date.now();
    
    let calls = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Remove old calls outside time window
    calls = calls.filter(timestamp => now - timestamp < timeWindow);
    
    if (calls.length >= maxCalls) {
      throw new Error(`Rate limit exceeded for ${operation}`);
    }
    
    // Add current call
    calls.push(now);
    localStorage.setItem(key, JSON.stringify(calls));
    
    return true;
  }

  /**
   * Constant time string comparison to prevent timing attacks
   */
  constantTimeEquals(a, b) {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Generate cryptographically secure random values
   */
  generateSecureRandom(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate session integrity
   */
  validateSession() {
    const authStore = window.authStore || { isAuthenticated: false };
    
    // Check if session has been tampered with
    const sessionStart = localStorage.getItem('sessionStart');
    const sessionExpiry = localStorage.getItem('token_expiration');
    
    if (!sessionStart || !sessionExpiry || !authStore.isAuthenticated) {
      return false;
    }
    
    const now = Date.now();
    if (now > parseInt(sessionExpiry)) {
      this.logSecurityEvent('session_expired', { sessionStart, sessionExpiry, now });
      return false;
    }
    
    return true;
  }

  /**
   * Clean sensitive data from memory
   */
  cleanSensitiveData() {
    // Clear any sensitive data from memory
    if (window.temp_credentials) {
      window.temp_credentials = null;
    }
    
    // Clear clipboard if it contains sensitive data
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('');
    }
  }

  /**
   * Log security events
   */
  logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      domain: window.location.hostname,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      sessionId: this.generateSecureRandom(16),
      ...details
    };
    
    console.log('🔒 Security Event:', logEntry);
    
    // In production, you might want to send this to a logging service
    // this.sendToLoggingService(logEntry);
  }
}

export default new SecurityService(); 