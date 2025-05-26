// Dimensions and margins
const margin = { top: 40, right: 30, bottom: 50, left: 70 };
const width = 900;
const height = 400;
const inner = { width: width - margin.left - margin.right, height: height - margin.top - margin.bottom };

// Chart dimensions for stacked area chart
const stackedAreaDimensions = {
    margin: { top: 40, right: 80, bottom: 80, left: 100 },
    width: 1200,
    height: 600
};
stackedAreaDimensions.inner = {
    width: stackedAreaDimensions.width - stackedAreaDimensions.margin.left - stackedAreaDimensions.margin.right,
    height: stackedAreaDimensions.height - stackedAreaDimensions.margin.top - stackedAreaDimensions.margin.bottom
};

const tooltipbox = { width: 65, height: 32};

// Colors
const barColor = "steelblue";
const bodyBackgroundColor = "#f7f7f7";

// Color scheme using Okabe-Ito palette for color-blind safety
const jurisdictionColors = {
    'NSW': '#E69F00',  // Orange
    'VIC': '#56B4E9',  // Sky Blue
    'QLD': '#009E73',  // Bluish Green
    'SA': '#F0E442',   // Yellow
    'WA': '#0072B2',   // Blue
    'TAS': '#D55E00',  // Vermillion
    'NT': '#CC79A7',   // Reddish Purple
    'ACT': '#999999'   // Gray
};

// Reference lines for National Road Safety Strategy
const referenceLines = [
    { year: 2021, label: '2021-30 National Road Safety Strategy', color: '#CC0000', dasharray: '5,5' },
    { year: 2023, label: '2023-25 Action Plan', color: '#0066CC', dasharray: '3,3' }
];

// Color scales
const mapColorScale = d3.scaleSequential(d3.interpolateBlues)