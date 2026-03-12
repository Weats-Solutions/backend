import { HelmetOptions } from 'helmet';

/**
 * Helmet Security Configuration for Production
 *
 * This configuration should only be applied in production environments (NODE_ENV !== "development")
 * to ensure that the development environment does not break.
 *
 * Included security measures:
 * - HSTS (HTTP Strict Transport Security) with a 1-year duration
 * - XSS Protection
 * - Content Security Policy (CSP)
 * - Clickjacking protection (X-Frame-Options)
 * - Server information hiding
 * - MIME type sniffing protection
 * - Unauthorized download protection
 * - Referrer Policy
 */
export const helmetConfig: HelmetOptions = {
    // HSTS - enforces HTTPS for 1 year, including subdomains
    hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true, // allows inclusion in browser HSTS preload list
    },

    // Content Security Policy - defines trusted content sources
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"], // only resources from own domain by default
            scriptSrc: ["'self'"], // scripts only from own domain
            styleSrc: ["'self'", "'unsafe-inline'"], // styles from own domain + inline (needed for some libraries)
            imgSrc: ["'self'", 'data:', 'https:'], // images from own domain, data URIs, and HTTPS
            fontSrc: ["'self'", 'data:'], // fonts from own domain and data URIs
            connectSrc: ["'self'"], // API connections only to own domain
            frameSrc: ["'none'"], // no iframes allowed
            objectSrc: ["'none'"], // no plugins (Flash, etc)
            upgradeInsecureRequests: [], // forces HTTP to HTTPS upgrade
        },
    },

    // X-Frame-Options - clickjacking protection
    frameguard: {
        action: 'deny', // completely blocks usage in iframes
    },

    // X-Content-Type-Options - prevents MIME type sniffing
    noSniff: true,

    // X-XSS-Protection - XSS protection (legacy, but still useful for older browsers)
    xssFilter: true,

    // Referrer-Policy - controls referrer information
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },

    // X-Download-Options - prevents automatic download in IE
    ieNoOpen: true,

    // X-DNS-Prefetch-Control - controls DNS prefetching
    dnsPrefetchControl: {
        allow: false,
    },

    // Hide X-Powered-By - hides information about the server technology
    hidePoweredBy: true,

    // X-Permitted-Cross-Domain-Policies - restricts cross-domain policies
    permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
    },
};

/**
 * Checks if Helmet should be enabled based on the environment
 * @param nodeEnv - Value of the NODE_ENV variable
 * @returns true if Helmet should be enabled, false otherwise
 */
export function shouldEnableHelmet(nodeEnv: string | undefined): boolean {
    return nodeEnv !== 'development';
}
