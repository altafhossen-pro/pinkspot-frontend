export const formatProductName = (title, subtitle) => {
    if (!subtitle) return title;
    
    // If subtitle contains the placeholder, replace it with the title
    // and don't prepend the title again.
    if (subtitle.includes('$subtitleName') || subtitle.includes('$productName')) {
        return subtitle.replace(/\$(subtitleName|productName)/g, title);
    }
    
    // Otherwise, prepend the title to the subtitle
    return `${title} ${subtitle}`;
};
