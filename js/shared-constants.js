// Dimensions and margins
const margin = { top: 40, right: 50, bottom: 50, left: 70 };
const width = 800;
const height = 400;
const inner = { width: width - margin.left - margin.right, height: height - margin.top - margin.bottom };

const tooltipbox = { width: 65, height: 32};

// Colors
const barColor = "steelblue";
const bodyBackgroundColor = "#f7f7f7";

// Color scales
const mapColorScale = d3.scaleSequential(d3.interpolateBlues)