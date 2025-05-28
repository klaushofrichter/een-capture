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
      'Origin': window.location.origin
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
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/data:/gi, '') // Remove data: protocols
      .replace(/vbscript:/gi, '') // Remove vbscript: protocols
      .replace(/file:/gi, '') // Remove file: protocols
      .replace(/about:/gi, '') // Remove about: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
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
   * Log security events
   */
  logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      domain: window.location.hostname,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      ...details
    };
    
    console.log('🔒 Security Event:', logEntry);
    
    // In production, you might want to send this to a logging service
    // this.sendToLoggingService(logEntry);
  }
}

export default new SecurityService(); 