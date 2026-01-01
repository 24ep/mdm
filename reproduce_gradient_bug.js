
function parseGradient(gradStr) {
    if (!gradStr) return { type: 'linear', angle: 0, stops: [{ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 100 }] }

    const isLinear = gradStr.includes('linear-gradient')
    const isRadial = gradStr.includes('radial-gradient')

    // Extract angle/direction
    let angle = 0
    if (isLinear) {
        const angleMatch = gradStr.match(/(\d+)deg/)
        if (angleMatch) angle = parseInt(angleMatch[1])
        else if (gradStr.includes('to top')) angle = 0
        else if (gradStr.includes('to right')) angle = 90
        else if (gradStr.includes('to bottom')) angle = 180
        else if (gradStr.includes('to left')) angle = 270
    }

    // Extract color stops
    const stopsMatch = gradStr.match(/\(([^)]+)\)/)
    const stops = []
    if (stopsMatch) {
        // THE BUGGY SPLIT
        const parts = stopsMatch[1].split(',').map(s => s.trim())

        console.log('Split Parts:', parts);

        parts.forEach(part => {
            const colorMatch = part.match(/(#[0-9a-fA-F]{6}|rgb\([^)]+\)|rgba\([^)]+\)|[a-z]+)/i)
            const posMatch = part.match(/(\d+)%/)
            if (colorMatch) {
                stops.push({
                    color: colorMatch[1],
                    position: posMatch ? parseInt(posMatch[1]) : stops.length === 0 ? 0 : 100
                })
            }
        })
    }

    if (stops.length === 0) {
        stops.push({ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 100 })
    }

    return {
        type: isRadial ? 'radial' : 'linear',
        angle,
        stops
    }
}

// Test Case
const input = "linear-gradient(90deg, rgba(255, 0, 0, 1) 0%, rgba(0, 255, 0, 0.5) 50%, rgba(0, 0, 255, 1) 100%)";
console.log('Parsing:', input);
const result = parseGradient(input);
console.log('Result Stops:', JSON.stringify(result.stops, null, 2));


// PROPOSED FIX
function parseGradientFixed(gradStr) {
    if (!gradStr) return { type: 'linear', angle: 0, stops: [{ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 100 }] }

    const isLinear = gradStr.includes('linear-gradient')
    const isRadial = gradStr.includes('radial-gradient')

    let angle = 0
    if (isLinear) {
        const angleMatch = gradStr.match(/(\d+)deg/)
        if (angleMatch) angle = parseInt(angleMatch[1])
    }

    const stopsMatch = gradStr.match(/\((.+)\)/); // Grab everything inside outer parens
    const stops = []

    if (stopsMatch) {
        // Regex to split by comma ONLY if not followed by a closing paren that comes before an opening paren?
        // Actually, easiest way is to split by comma lookahead that ensures we are not inside parens.
        // Or simply: (rgba\(.*?\)|rgb\(.*?\)|[^,]+)

        // Let's try the simple regex split: split by comma not followed by ')' without an opening '('?
        // No, lookahead for "Not inside parens" is hard.

        // Better: match the stops instead of splitting.
        // A stop is: Color + Space + Percentage
        // Color can be hex, name, or functional.

        // Regex for splitting on commas that are not inside parenthesis
        const parts = stopsMatch[1].split(/,(?![^(]*\))/).map(s => s.trim());
        console.log('Fixed Split Parts:', parts);

        parts.forEach(part => {
            // Angle is not a stop
            if (part.includes('deg') || part.includes('to ')) return;

            const colorMatch = part.match(/(#[0-9a-fA-F]{6}|rgb\([^)]+\)|rgba\([^)]+\)|[a-z]+)/i)
            const posMatch = part.match(/(\d+)%/)
            if (colorMatch) {
                stops.push({
                    color: colorMatch[1],
                    position: posMatch ? parseInt(posMatch[1]) : stops.length === 0 ? 0 : 100
                })
            }
        })
    }
    return { stops }
}

console.log('--- Testing Fix ---');
const fixResult = parseGradientFixed(input);
console.log('Fixed Result Stops:', JSON.stringify(fixResult.stops, null, 2));
