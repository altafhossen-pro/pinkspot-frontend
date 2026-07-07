/**
 * Format date utility function
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.showTime - Whether to show time (default: true)
 * @param {boolean} options.showDate - Whether to show date (default: true)
 * @param {string} options.timeFormat - Time format ('12h' or '24h', default: '12h')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    const {
        showTime = true,
        showDate = true,
        timeFormat = '12h'
    } = options;

    if (!date) return 'N/A';

    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }

    const parts = [];

    // Add time if requested
    if (showTime) {
        let timeString;
        if (timeFormat === '24h') {
            timeString = dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } else {
            timeString = dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        parts.push(timeString);
    }

    // Add date if requested
    if (showDate) {
        const dateString = dateObj.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        parts.push(dateString);
    }

    return parts.join(', ');
};

/**
 * Format date for display in tables (compact format)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string (e.g., "10:04 PM, 29 Aug 2024")
 */
export const formatDateForTable = (date) => {
    return formatDate(date, { showTime: true, showDate: true });
};

/**
 * Format date only (without time)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string (e.g., "29 Aug 2024")
 */
export const formatDateOnly = (date) => {
    return formatDate(date, { showTime: false, showDate: true });
};

/**
 * Format time only (without date)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time string (e.g., "10:04 PM")
 */
export const formatTimeOnly = (date) => {
    return formatDate(date, { showTime: true, showDate: false });
};
