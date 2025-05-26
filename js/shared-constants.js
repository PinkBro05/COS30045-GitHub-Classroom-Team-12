// Dimensions and margins
const margin = { top: 40, right: 30, bottom: 50, left: 70 };
const width = 900;
const height = 400;
const inner = { width: width - margin.left - margin.right, height: height - margin.top - margin.bottom };

const tooltipbox = { width: 65, height: 32};

// Colors
const barColor = "steelblue";
const bodyBackgroundColor = "#f7f7f7";

// Color scales
const mapColorScale = d3.scaleSequential(d3.interpolateBlues)

// Color scheme using Okabe-Ito palette for color-blind safety
const stateColorScale = d3.scaleOrdinal()
.domain(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'])
.range(['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#999999']);