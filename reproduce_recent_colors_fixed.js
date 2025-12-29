
const MAX_RECENT_COLORS = 8;
const RECENT_COLORS_KEY = 'color-picker-recent-colors';

// Helper to simulate localStorage
let mockLocalStorage = {};
const localStorage = {
    getItem: (key) => mockLocalStorage[key],
    setItem: (key, value) => { mockLocalStorage[key] = value },
    clear: () => { mockLocalStorage = {} }
};

// Updated addToRecentColors function to mimic the FIX
function addToRecentColors(color, currentRecentColors) {
    if (color.startsWith('#') || color.startsWith('rgb')) {
        const baseColor = color; 
        
        // FIX IMPLEMENTED HERE: .toLowerCase() comparison
        const filtered = currentRecentColors.filter(c => c.toLowerCase() !== baseColor.toLowerCase());
        const updated = [baseColor, ...filtered].slice(0, MAX_RECENT_COLORS);
        
        return updated;
    }
    return currentRecentColors;
}

// Test cases
console.log("--- Testing Recent Colors Logic (With Fix) ---");

let recentColors = [];

// 1. Add first color
recentColors = addToRecentColors('#ffffff', recentColors);
console.log("1. Add #ffffff:", recentColors);

// 2. Add second color
recentColors = addToRecentColors('#000000', recentColors);
console.log("2. Add #000000:", recentColors);

// 3. Add duplicate #ffffff (expect moved to top)
recentColors = addToRecentColors('#ffffff', recentColors);
console.log("3. Add #ffffff again:", recentColors);

// 4. Add case-insensitive duplicate (expect NO duplicate, just update/move)
recentColors = addToRecentColors('#FFFFFF', recentColors);
console.log("4. Add #FFFFFF (expect no duplicate):", recentColors);

if (recentColors.length !== 2) {
    console.error("FAIL: Duplicate found or entry missing!");
} else {
    console.log(" PASS: No duplicates found.");
}

console.log("Final List:", recentColors);
