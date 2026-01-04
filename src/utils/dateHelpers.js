/**
 * Cross-platform Date handling utilities for web/desktop compatibility
 */

/**
 * Safely gets current timestamp without using Date.now()
 * Works in web environments where Date might be undefined
 */
function getCurrentTimestamp() {
    // Try performance API first (most reliable in web environments)
    if (typeof performance !== 'undefined' && performance.now && performance.timeOrigin) {
        return Math.floor(performance.timeOrigin + performance.now());
    }
    
    // Fallback to Date.now if Date constructor is available
    if (typeof Date === 'function' && Date.now) {
        return Date.now();
    }
    
    // Last resort: return a fixed timestamp (better than crashing)
    return 1640995200000; // January 1, 2022 00:00:00 UTC
}

/**
 * Checks if a value looks like a Date without using instanceof
 * Uses duck typing to avoid issues in web environments where Date constructor might be undefined
 */
function isDateLike(value) {
    return Boolean(value && typeof value === 'object' && typeof value.getTime === 'function');
}

/**
 * Safely formats a timestamp for display when Date constructor is not available
 */
function fallbackDateFormat(timestamp) {
    if (!timestamp || isNaN(timestamp)) return 'Invalid Date';
    
    // Try to use built-in Intl.DateTimeFormat if available
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        try {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).format(timestamp);
        } catch {
            // Fall through to manual formatting
        }
    }
    
    // Manual date formatting without using Date constructor
    // Convert timestamp to date components
    const MILLISECONDS_PER_DAY = 86400000;
    const MILLISECONDS_PER_HOUR = 3600000;
    const MILLISECONDS_PER_MINUTE = 60000;
    const MILLISECONDS_PER_SECOND = 1000;
    
    // Unix epoch: January 1, 1970
    const epochYear = 1970;
    const epochDayOfWeek = 4; // Thursday
    
    // Calculate days since epoch
    const daysSinceEpoch = Math.floor(timestamp / MILLISECONDS_PER_DAY);
    
    // Calculate time of day
    const millisecondsInDay = timestamp % MILLISECONDS_PER_DAY;
    const hours = Math.floor(millisecondsInDay / MILLISECONDS_PER_HOUR);
    const minutes = Math.floor((millisecondsInDay % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);
    const seconds = Math.floor((millisecondsInDay % MILLISECONDS_PER_MINUTE) / MILLISECONDS_PER_SECOND);
    
    // Simple approximation for display (not calendar-accurate but sufficient for timestamps)
    const approximateYear = epochYear + Math.floor(daysSinceEpoch / 365.25);
    const approximateMonth = Math.floor((daysSinceEpoch % 365.25) / 30.44) + 1;
    const approximateDay = Math.floor(daysSinceEpoch % 30.44) + 1;
    
    // Format as MM/DD/YYYY, HH:MM:SS
    const month = String(Math.min(approximateMonth, 12)).padStart(2, '0');
    const day = String(Math.min(approximateDay, 31)).padStart(2, '0');
    const hourStr = String(hours).padStart(2, '0');
    const minuteStr = String(minutes).padStart(2, '0');
    const secondStr = String(seconds).padStart(2, '0');
    
    return `${month}/${day}/${approximateYear}, ${hourStr}:${minuteStr}:${secondStr}`;
}

/**
 * Safely creates a Date object or normalizes timestamp values
 * Handles web environments where Date constructor might be undefined
 * Completely avoids Date constructor and static methods
 */
function ensureDate(value) {
    // If it already looks like a Date, return as is
    if (isDateLike(value)) {
        return value;
    }

    // Check if Date constructor is available (web environment safety)
    const hasDateConstructor = typeof Date === 'function' && 
                              Date.prototype && 
                              Date.prototype.constructor === Date;
    
    // Handle null/undefined
    if (value === undefined || value === null) {
        if (!hasDateConstructor) {
            // Get current timestamp without using Date methods
            const now = getCurrentTimestamp();
            return { 
                getTime: () => now, 
                toLocaleString: () => fallbackDateFormat(now),
                toString: () => fallbackDateFormat(now)
            };
        }
        return new Date();
    }

    // Handle numeric timestamps
    if (typeof value === 'number') {
        if (!hasDateConstructor) {
            return { 
                getTime: () => value, 
                toLocaleString: () => fallbackDateFormat(value),
                toString: () => fallbackDateFormat(value)
            };
        }
        return new Date(value);
    }

    // Handle string dates
    if (typeof value === 'string') {
        // Parse timestamp manually without using Date.parse
        let timestamp = 0;
        if (hasDateConstructor) {
            // Only use Date.parse if Date constructor is available
            timestamp = Date.parse(value);
        } else {
            // Try to parse as numeric string or fall back to 0
            const parsed = parseFloat(value);
            timestamp = isNaN(parsed) ? 0 : parsed;
        }
        
        if (!hasDateConstructor) {
            return { 
                getTime: () => timestamp, 
                toLocaleString: () => fallbackDateFormat(timestamp),
                toString: () => fallbackDateFormat(timestamp)
            };
        }
        return new Date(value);
    }

    // Fallback - create from any other value type
    if (!hasDateConstructor) {
        return { 
            getTime: () => 0, 
            toLocaleString: () => 'Invalid Date',
            toString: () => 'Invalid Date'
        };
    }
    
    return new Date(value);
}

module.exports = {
    ensureDate,
    isDateLike,
    getCurrentTimestamp
};
