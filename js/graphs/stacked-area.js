// Stacked Area Chart for Infringement Categories Over Time

// State management
const StackedAreaChart = {
    data: [],
    filteredMetrics: new Set(),
    availableJurisdictions: new Set(),
    currentMetricFilter: 'all',
    selectedJurisdiction: 'all',
    tooltip: null,
    
    // Initialize chart
    init() {
        this.loadData();
    },
    
    // Load data method
    loadData() {
        loadStackedAreaData();
    },
    
    // Reset filters
    resetFilters() {
        this.currentMetricFilter = 'all';
        this.selectedJurisdiction = 'all';
    }
};

// Configuration
const CHART_CONFIG = {
    dimensions: typeof stackedAreaDimensions !== 'undefined' ? stackedAreaDimensions : {
        margin: { top: 40, right: 200, bottom: 80, left: 100 },
        width: 1200,
        height: 600,
        inner: { width: 1000, height: 480 }
    },
    padding: 2,
    colors: typeof jurisdictionColors !== 'undefined' ? jurisdictionColors : {
        'NSW': '#E69F00', 'VIC': '#56B4E9', 'QLD': '#009E73', 'SA': '#F0E442',
        'WA': '#0072B2', 'TAS': '#D55E00', 'NT': '#CC79A7', 'ACT': '#999999'
    },
    referenceLines: typeof referenceLines !== 'undefined' ? referenceLines : [
        { year: 2021, label: '2021-30 National Road Safety Strategy', color: '#CC0000', dasharray: '5,5' },
        { year: 2023, label: '2023-25 Action Plan', color: '#0066CC', dasharray: '3,3' }
    ]
};

// Data loading and processing
async function loadStackedAreaData() {
    try {
        console.log('Loading stacked area data...');
        
        const dataFiles = [
            { url: 'data/annual_speed_mobile.csv', valueColumn: 'Sum(FINES)' },
            { url: 'data/annual_pos_breath.csv', valueColumn: 'Sum(COUNT)' },
            { url: 'data/annual_pos_drug.csv', valueColumn: 'Sum(COUNT)' },
            { url: 'data/annual_drug_breath_conducted.csv', valueColumn: 'Sum(COUNT)' }
        ];

        const datasets = await Promise.all(
            dataFiles.map(async ({ url, valueColumn }) => {
                const data = await d3.csv(url);
                return processCSVData(data, valueColumn);
            })
        );

        console.log('Data loaded successfully:', datasets.map(d => d.length));

        // Combine all data and filter out unlicensed_driving
        StackedAreaChart.data = datasets
            .flat()
            .filter(d => d.metric !== 'unlicensed_driving');

        // Update state
        StackedAreaChart.filteredMetrics = new Set(StackedAreaChart.data.map(d => d.metric));
        StackedAreaChart.availableJurisdictions = new Set(StackedAreaChart.data.map(d => d.jurisdiction));

        console.log('Processed data:', StackedAreaChart.data.length, 'records');
        console.log('Available metrics:', Array.from(StackedAreaChart.filteredMetrics));
        console.log('Available jurisdictions:', Array.from(StackedAreaChart.availableJurisdictions));

        // Initialize chart
        drawStackedArea('#stacked-area', StackedAreaChart.data);
        createMetricFilter();

    } catch (error) {
        console.error('Error loading stacked area data:', error);
        displayError('#stacked-area', error.message);
    }
}

function displayError(selector, message) {
    const container = d3.select(selector);
    container.selectAll('*').remove();
    container.append('div')
        .style('text-align', 'center')
        .style('padding', '50px')
        .style('color', '#666')
        .html(`
            <h3>Error Loading Data</h3>
            <p>Unable to load the infringement data. Please check the console for details.</p>
            <p><small>Error: ${message}</small></p>
        `);
}

// UI Components
function createMetricFilter() {
    const container = d3.select('#stacked-area').node().parentNode;
    d3.select(container).select('.metric-filter').remove();
    
    const filterDiv = d3.select(container)
        .insert('div', ':first-child')
        .attr('class', 'metric-filter')
        .style('margin-bottom', '20px')
        .style('text-align', 'center');

    filterDiv.append('label')
        .text('Filter by Metric: ')
        .style('margin-right', '10px')
        .style('font-weight', 'bold');

    const select = filterDiv.append('select')
        .style('padding', '5px 10px')
        .style('border-radius', '4px')
        .style('border', '1px solid #ccc')
        .on('change', function() {
            StackedAreaChart.currentMetricFilter = this.value;
            drawStackedArea('#stacked-area', StackedAreaChart.data);
        });

    // Add options
    select.append('option').attr('value', 'all').text('All Metrics');
    Array.from(StackedAreaChart.filteredMetrics).sort().forEach(metric => {
        select.append('option')
            .attr('value', metric)
            .text(metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    });
}

// Data processing for chart
function prepareChartData(data) {
    let filteredData = data;
    if (StackedAreaChart.currentMetricFilter !== 'all') {
        filteredData = data.filter(d => d.metric === StackedAreaChart.currentMetricFilter);
    }

    if (filteredData.length === 0) return null;

    const aggregatedData = d3.rollup(
        filteredData,
        v => d3.sum(v, d => d.value),
        d => d.year,
        d => d.jurisdiction
    );

    const years = Array.from(aggregatedData.keys()).sort();
    const jurisdictions = Array.from(StackedAreaChart.availableJurisdictions).sort();

    const processedData = years.map(year => {
        const yearData = { year };
        jurisdictions.forEach(jurisdiction => {
            yearData[jurisdiction] = aggregatedData.get(year)?.get(jurisdiction) || 0;
        });
        return yearData;
    });

    return { processedData, years, jurisdictions };
}

// Main drawing function
function drawStackedArea(selector, data) {
    console.log('Drawing stacked area chart...');
    
    const container = d3.select(selector);
    if (container.empty()) {
        console.error('Container not found:', selector);
        return;
    }
    
    container.selectAll("*").remove();
    
    const chartData = prepareChartData(data);
    if (!chartData) {
        displayNoDataMessage(container);
        return;
    }

    const { processedData, years, jurisdictions } = chartData;
    const svg = createSVG(container);
    const { xScale, yScale } = createScales(years, processedData, jurisdictions);
    const { stackedData, area } = createStackedData(processedData, jurisdictions, xScale, yScale);
    
    const chart = svg.append('g')
        .attr('transform', `translate(${CHART_CONFIG.dimensions.margin.left}, ${CHART_CONFIG.dimensions.margin.top})`);

    StackedAreaChart.tooltip = createTooltip('stacked-area-tooltip');
    
    drawAreas(chart, stackedData, area, processedData);
    drawAxes(chart, xScale, yScale);
    drawReferenceLines(chart, xScale, years);
    drawLegend(svg, jurisdictions);
}

function displayNoDataMessage(container) {
    container.append('div')
        .style('text-align', 'center')
        .style('padding', '50px')
        .style('color', '#666')
        .html('<h3>No data available for the selected filter</h3>');
}

function createSVG(container) {
    return container.append('svg')
        .attr('class', 'stacked-area-chart')
        .attr('viewBox', [0, 0, CHART_CONFIG.dimensions.width, CHART_CONFIG.dimensions.height]);
}

function createScales(years, processedData, jurisdictions) {
    const xScale = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([0, CHART_CONFIG.dimensions.inner.width]);
        
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => 
            d3.sum(jurisdictions, jurisdiction => d[jurisdiction])
        ) + (jurisdictions.length * 2)])
        .range([CHART_CONFIG.dimensions.inner.height, 0]);
        
    return { xScale, yScale };
}

function createStackedData(processedData, jurisdictions, xScale, yScale) {
    const stack = d3.stack()
        .keys(jurisdictions)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const stackedData = stack(processedData);
    
    // Add padding between stack layers
    stackedData.forEach((layer, layerIndex) => {
        layer.forEach(d => {
            if (layerIndex > 0) {
                d[0] += layerIndex * CHART_CONFIG.padding;
                d[1] += layerIndex * CHART_CONFIG.padding;
            }
        });
    });

    const area = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveLinear);

    return { stackedData, area };
}// Drawing helper functions
function drawAreas(chart, stackedData, area, processedData) {
    const dataAccessor = (d, event, element) => {
        const [mouseX] = d3.pointer(event, element);
        const xPos = d3.scaleLinear()
            .domain(d3.extent(processedData, pd => pd.year))
            .range([0, CHART_CONFIG.dimensions.inner.width])
            .invert(mouseX);
        const closestYear = Math.round(xPos);
        const yearData = processedData.find(item => item.year === closestYear);
        const value = yearData ? yearData[d.key] : 0;
        
        return `
            <strong>${d.key}</strong><br/>
            Year: ${closestYear}<br/>
            Value: ${formatNumber(value)}
        `;
    };

    const handlers = createMouseHandlers(StackedAreaChart.tooltip, dataAccessor);

    chart.selectAll('.area')
        .data(stackedData)
        .join('path')
        .attr('class', 'area')
        .attr('d', area)
        .attr('fill', d => CHART_CONFIG.colors[d.key] || '#69b3a2')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .style('opacity', d => StackedAreaChart.selectedJurisdiction === 'all' || StackedAreaChart.selectedJurisdiction === d.key ? 0.8 : 0.3)
        .style('transition', 'opacity 0.3s ease')
        .on('mouseover', handlers.mouseover)
        .on('mousemove', handlers.mousemove)
        .on('mouseout', handlers.mouseout);
}

function drawAxes(chart, xScale, yScale) {
    // X-axis
    chart.append('g')
        .attr('transform', `translate(0, ${CHART_CONFIG.dimensions.inner.height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
        .append('text')
        .attr('x', CHART_CONFIG.dimensions.inner.width / 2)
        .attr('y', 40)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Year');

    // Y-axis
    chart.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -CHART_CONFIG.dimensions.inner.height / 2)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Count/Fines');
}

function drawReferenceLines(chart, xScale, years) {
    CHART_CONFIG.referenceLines.forEach(line => {
        if (line.year >= d3.min(years) && line.year <= d3.max(years)) {
            chart.append('line')
                .attr('x1', xScale(line.year))
                .attr('x2', xScale(line.year))
                .attr('y1', 0)
                .attr('y2', CHART_CONFIG.dimensions.inner.height)
                .attr('stroke', line.color)
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', line.dasharray)
                .style('opacity', 0.7);

            chart.append('text')
                .attr('x', xScale(line.year) - 80)
                .attr('y', line.year === 2023 ? 30 : 15)
                .attr('fill', line.color)
                .style('font-size', '11px')
                .style('font-weight', 'bold')
                .text(line.label);
        }
    });
}

function drawLegend(svg, jurisdictions) {
    const legend = svg.append('g')
        .attr('transform', `translate(${CHART_CONFIG.dimensions.width - 47}, 190)`);

    const legendItems = legend.selectAll('.legend-item')
        .data(jurisdictions)
        .join('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`)
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            StackedAreaChart.selectedJurisdiction = StackedAreaChart.selectedJurisdiction === d ? 'all' : d;
            drawStackedArea('#stacked-area', StackedAreaChart.data);
        })
        .on('mouseover', function(event, d) {
            d3.select(this).select('rect')
                .attr('stroke', '#333')
                .attr('stroke-width', 1);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).select('rect')
                .attr('stroke', d => StackedAreaChart.selectedJurisdiction === d ? '#333' : 'none')
                .attr('stroke-width', d => StackedAreaChart.selectedJurisdiction === d ? 2 : 0);
        });

    legendItems.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d => CHART_CONFIG.colors[d] || '#69b3a2')
        .attr('stroke', d => StackedAreaChart.selectedJurisdiction === d ? '#333' : 'none')
        .attr('stroke-width', d => StackedAreaChart.selectedJurisdiction === d ? 2 : 0);

    legendItems.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '12px')
        .style('font-weight', d => StackedAreaChart.selectedJurisdiction === d ? 'bold' : 'normal')
        .style('fill', d => StackedAreaChart.selectedJurisdiction === 'all' || StackedAreaChart.selectedJurisdiction === d ? '#333' : '#999')
        .text(d => d);
}

// Initialize the chart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking for stacked area container...');
    const container = document.getElementById('stacked-area');
    if (container) {
        console.log('Stacked area container found, initializing...');
        StackedAreaChart.init();
    } else {
        console.error('Stacked area container not found!');
    }
});
