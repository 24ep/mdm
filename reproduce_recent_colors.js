
const MAX_RECENT_COLORS = 8;
const RECENT_COLORS_KEY = 'color-picker-recent-colors';

// Helper to simulate localStorage
let mockLocalStorage = {};
const localStorage = {
    getItem: (key) => mockLocalStorage[key],
    setItem: (key, value) => { mockLocalStorage[key] = value },
    clear: () => { mockLocalStorage = {} }
};

// Simplified addToRecentColors function from the component
function addToRecentColors(color, currentRecentColors) {
    if (color.startsWith('#') || color.startsWith('rgb')) {
        // Mocking extractBaseColor to just return color for simplicity, 
        // assuming standard hex inputs for now as that's the likely use case failing
        const baseColor = color; 
        
        const updated = [baseColor, ...currentRecentColors.filter(c => c !== baseColor)].slice(0, MAX_RECENT_COLORS)
        return updated;
    }
    return currentRecentColors;
}

// Test cases
console.log("--- Testing Recent Colors Logic ---");

let recentColors = [];

// 1. Add first color
recentColors = addToRecentColors('#ffffff', recentColors);
console.log("1. Add #ffffff:", recentColors);

// 2. Add second color
recentColors = addToRecentColors('#000000', recentColors);
console.log("2. Add #000000:", recentColors);

// 3. Add duplicate #ffffff (should move to top, no duplicate)
recentColors = addToRecentColors('#ffffff', recentColors);
console.log("3. Add #ffffff again (expect no duplicate, moved to top):", recentColors);

// 4. Add case-insensitive duplicate (simulating issue)
recentColors = addToRecentColors('#FFFFFF', recentColors);
console.log("4. Add #FFFFFF (expect no duplicate check fail if simple string comparison):", recentColors);
// If this fails, it means we need case-insensitive check and normalization

// 5. Add many colors to test limit
for (let i = 0; i < 10; i++) {
    recentColors = addToRecentColors(`#color${i}`, recentColors);
}
console.log("5. After adding 10 more colors (expect max 8):", recentColors.length);

console.log("Final List:", recentColors);
