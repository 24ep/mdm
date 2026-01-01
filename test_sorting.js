
// Simulate buildGradientString behavior
const buildGradientString = (config) => {
    // Current implementation checks
    // const stopsStr = config.stops.map(s => `${s.color} ${s.position}%`).join(', ')

    // Check if we should sort
    // The browser renders stops in order. If pos < prevPos, it clamps.

    const stopsStr = config.stops.map(s => `${s.color} ${s.position}%`).join(', ')
    if (config.type === 'radial') {
        return `radial-gradient(circle, ${stopsStr})`
    }
    return `linear-gradient(${config.angle}deg, ${stopsStr})`
}

const configUnsorted = {
    type: 'linear',
    angle: 90,
    stops: [
        { color: 'red', position: 0 },
        { color: 'blue', position: 100 }, // Stop 2
        { color: 'green', position: 50 }  // Stop 3 added later, position 50
    ]
};

const output = buildGradientString(configUnsorted);
console.log('Unsorted Output:', output);

// Browsers render: Red (0%) -> Blue (100%). Green (50%) is < 100%, so it's treated as 100%.
// Result: Red to Blue gradient. Green is invisible/clamped at the end.
// Expectation: Red -> Green -> Blue.

// Sorted version
const configSorted = {
    ...configUnsorted,
    stops: [...configUnsorted.stops].sort((a, b) => a.position - b.position)
};
const outputSorted = buildGradientString(configSorted);
console.log('Sorted Output:', outputSorted);
