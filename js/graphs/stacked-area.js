// Stacked Area Chart for Infringement Categories Over Time
let stackedAreaData = [];
let filteredMetrics = new Set();
let availableJurisdictions = new Set();
let currentMetricFilter = 'all';
let selectedJurisdiction = 'all';

// Fallback dimensions in case shared-constants.js isn't loaded
const chartDimensions = {
    margin: typeof margin !== 'undefined' ? margin : { top: 40, right: 200, bottom: 80, left: 100 },
    width: typeof width !== 'undefined' ? width : 1200,
    height: typeof height !== 'undefined' ? height : 600
};
chartDimensions.inner = {
    width: chartDimensions.width - chartDimensions.margin.left - chartDimensions.margin.right,
    height: chartDimensions.height - chartDimensions.margin.top - chartDimensions.margin.bottom
};

// Number formatting utility
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

// Color scheme for different jurisdictions
const jurisdictionColors = {
    'NSW': '#FF6B6B',
    'VIC': '#4ECDC4', 
    'QLD': '#45B7D1',
    'SA': '#96CEB4',
    'WA': '#FFEAA7',
    'TAS': '#DDA0DD',
    'NT': '#98D8C8',
    'ACT': '#F7DC6F'
};

// Load and process all data files
async function loadStackedAreaData() {
    try {
        console.log('Loading stacked area data...');
        
        const [speedMobileData, posBreatheData, posDrugData, drugBreathConductedData] = await Promise.all([
            d3.csv('data/annual_speed_mobile.csv'),
            d3.csv('data/annual_pos_breath.csv'),
            d3.csv('data/annual_pos_drug.csv'),
            d3.csv('data/annual_drug_breath_conducted.csv')
        ]);

        console.log('Data loaded successfully:', {
            speedMobile: speedMobileData.length,
            posBreath: posBreatheData.length,
            posDrug: posDrugData.length,
            drugBreathConducted: drugBreathConductedData.length
        });

        // Process speed/mobile data (use Sum(FINES))
        const processedSpeedMobile = speedMobileData.map(d => ({
            year: +d.YEAR,
            jurisdiction: d.JURISDICTION,
            metric: d.METRIC,
            value: +d["Sum(FINES)"] || 0
        })).filter(d => !isNaN(d.year) && !isNaN(d.value));

        // Process positive breath data (use Sum(COUNT))
        const processedPosBreath = posBreatheData.map(d => ({
            year: +d.YEAR,
            jurisdiction: d.JURISDICTION,
            metric: d.METRIC,
            value: +d["Sum(COUNT)"] || 0
        })).filter(d => !isNaN(d.year) && !isNaN(d.value));

        // Process positive drug data (use Sum(COUNT))
        const processedPosDrug = posDrugData.map(d => ({
            year: +d.YEAR,
            jurisdiction: d.JURISDICTION,
            metric: d.METRIC,
            value: +d["Sum(COUNT)"] || 0
        })).filter(d => !isNaN(d.year) && !isNaN(d.value));

        // Process drug/breath conducted data (use Sum(COUNT))
        const processedDrugBreathConducted = drugBreathConductedData.map(d => ({
            year: +d.YEAR,
            jurisdiction: d.JURISDICTION,
            metric: d.METRIC,
            value: +d["Sum(COUNT)"] || 0
        })).filter(d => !isNaN(d.year) && !isNaN(d.value));        // Combine all data and filter out unlicensed_driving
        stackedAreaData = [
            ...processedSpeedMobile,
            ...processedPosBreath,
            ...processedPosDrug,
            ...processedDrugBreathConducted
        ].filter(d => d.metric !== 'unlicensed_driving');console.log('Processed data:', stackedAreaData.length, 'records');
        console.log('Sample data records:', stackedAreaData.slice(0, 5));
        console.log('Year range:', d3.extent(stackedAreaData, d => d.year));
        console.log('Unique years:', [...new Set(stackedAreaData.map(d => d.year))].sort());        // Get all unique metrics and jurisdictions for filtering
        filteredMetrics = new Set(stackedAreaData.map(d => d.metric));
        availableJurisdictions = new Set(stackedAreaData.map(d => d.jurisdiction));
        console.log('Available metrics:', Array.from(filteredMetrics));
        console.log('Available jurisdictions:', Array.from(availableJurisdictions));
        
        // Debug unlicensed_driving data specifically (should be empty now)
        const unlicensedData = stackedAreaData.filter(d => d.metric === 'unlicensed_driving');
        console.log('Unlicensed driving data after filter:', unlicensedData.length, 'records');        // Draw initial chart
        drawStackedArea('#stacked-area', stackedAreaData);
        createMetricFilter();

    } catch (error) {
        console.error('Error loading stacked area data:', error);
        
        // Show error message to user
        const container = d3.select('#stacked-area');
        container.selectAll('*').remove();
        container.append('div')
            .style('text-align', 'center')
            .style('padding', '50px')
            .style('color', '#666')
            .html(`
                <h3>Error Loading Data</h3>
                <p>Unable to load the infringement data. Please check the console for details.</p>
                <p><small>Error: ${error.message}</small></p>
            `);
    }
}

function createMetricFilter() {
    const container = d3.select('#stacked-area').node().parentNode;
    
    // Remove existing filter if any
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
            currentMetricFilter = this.value;
            drawStackedArea('#stacked-area', stackedAreaData);
        });

    // Add options
    select.append('option')
        .attr('value', 'all')
        .text('All Metrics');

    Array.from(filteredMetrics).sort().forEach(metric => {
        select.append('option')
            .attr('value', metric)
            .text(metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    });
}

function drawStackedArea(selector, data) {
    console.log('Drawing stacked area chart...');
    console.log('Selector:', selector);
    console.log('D3 version:', d3.version);
    
    // Clear existing content
    const container = d3.select(selector);
    if (container.empty()) {
        console.error('Container not found:', selector);
        return;
    }
    
    container.selectAll("*").remove();
    
    // Create SVG element
    const svg = container.append('svg')
        .attr('class', 'stacked-area-chart')
        .attr('viewBox', [0, 0, chartDimensions.width, chartDimensions.height])
        .attr('width', chartDimensions.width- 200)
        .attr('height', chartDimensions.height - 200);    // Filter data by metric if needed
    let filteredData = data;
    if (currentMetricFilter !== 'all') {
        filteredData = data.filter(d => d.metric === currentMetricFilter);
    }

    console.log('Filtered data length:', filteredData.length);if (filteredData.length === 0) {
        svg.append('text')
            .attr('x', chartDimensions.width / 2)
            .attr('y', chartDimensions.height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .text('No data available for the selected filter');
        return;
    }    // Aggregate data by year and jurisdiction
    const aggregatedData = d3.rollup(
        filteredData,
        v => d3.sum(v, d => d.value),
        d => d.year,
        d => d.jurisdiction
    );    // Convert to array format suitable for stacking
    const years = Array.from(aggregatedData.keys()).sort();
    const jurisdictions = Array.from(availableJurisdictions).sort(); // Always show all jurisdictions

    console.log('Processing years:', years);
    console.log('Processing jurisdictions:', jurisdictions);    const processedData = years.map(year => {
        const yearData = { year };
        jurisdictions.forEach(jurisdiction => {
            yearData[jurisdiction] = aggregatedData.get(year)?.get(jurisdiction) || 0;
        });
        return yearData;
    });

    console.log('Processed data for chart:', processedData.slice(0, 3));// Set up scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([0, chartDimensions.inner.width]);    const yScale = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => 
            d3.sum(jurisdictions, jurisdiction => d[jurisdiction])
        ) + (jurisdictions.length * 2)]) // Add padding to domain
        .range([chartDimensions.inner.height, 0]);// Create stack generator with padding
    const stack = d3.stack()
        .keys(jurisdictions)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const stackedData = stack(processedData);
    
    // Add padding between stack layers for visual separation
    const padding = 2; // pixels of padding between areas
    stackedData.forEach((layer, layerIndex) => {
        layer.forEach(d => {
            if (layerIndex > 0) {
                d[0] += layerIndex * padding;
                d[1] += layerIndex * padding;
            }
        });
    });    // Create area generator (no interpolation for accurate data representation)
    const area = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveLinear);// Create chart group
    const chart = svg.append('g')
        .attr('transform', `translate(${chartDimensions.margin.left}, ${chartDimensions.margin.top})`);

    // Add tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none');    // Draw areas with borders and spacing
    chart.selectAll('.area')
        .data(stackedData)
        .join('path')
        .attr('class', 'area')
        .attr('d', area)
        .attr('fill', d => jurisdictionColors[d.key] || '#69b3a2')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .style('opacity', d => selectedJurisdiction === 'all' || selectedJurisdiction === d.key ? 0.8 : 0.3)
        .style('transition', 'opacity 0.3s ease').on('mouseover', function(event, d) {
            d3.select(this).style('opacity', 1);
            tooltip.transition().duration(200).style('opacity', .9);
              // Find the data point closest to mouse position
            const [mouseX] = d3.pointer(event, this);
            const xPos = xScale.invert(mouseX);
            const closestYear = Math.round(xPos);
            const yearData = processedData.find(item => item.year === closestYear);
            const value = yearData ? yearData[d.key] : 0;
            
            tooltip.html(`
                <strong>${d.key}</strong><br/>
                Year: ${closestYear}<br/>
                Value: ${formatNumber(value)}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })        .on('mousemove', function(event, d) {            // Update tooltip position and content on mouse move
            const [mouseX] = d3.pointer(event, this);
            const xPos = xScale.invert(mouseX);
            const closestYear = Math.round(xPos);
            const yearData = processedData.find(item => item.year === closestYear);
            const value = yearData ? yearData[d.key] : 0;
            
            tooltip.html(`
                <strong>${d.key}</strong><br/>
                Year: ${closestYear}<br/>
                Value: ${formatNumber(value)}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(event, d) {
            d3.select(this).style('opacity', 0.8);
            tooltip.transition().duration(500).style('opacity', 0);
        });    // Add x-axis
    chart.append('g')
        .attr('transform', `translate(0, ${chartDimensions.inner.height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
        .append('text')
        .attr('x', chartDimensions.inner.width / 2)
        .attr('y', 40)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Year');

    // Add y-axis
    chart.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -75)
        .attr('x', -chartDimensions.inner.height / 2)
        .attr('fill', 'black')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Count/Fines');    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${chartDimensions.width - 20}, 20)`);

    const legendItems = legend.selectAll('.legend-item')
        .data(jurisdictions)
        .join('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`)
        .style('cursor', 'pointer')        .on('click', function(event, d) {
            // Toggle jurisdiction selection
            if (selectedJurisdiction === d) {
                selectedJurisdiction = 'all';
            } else {
                selectedJurisdiction = d;
            }
            
            // Redraw chart with new selection
            drawStackedArea('#stacked-area', stackedAreaData);
        })
        .on('mouseover', function(event, d) {
            d3.select(this).select('rect')
                .attr('stroke', '#333')
                .attr('stroke-width', 1);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).select('rect')
                .attr('stroke', d => selectedJurisdiction === d ? '#333' : 'none')
                .attr('stroke-width', d => selectedJurisdiction === d ? 2 : 0);
        });

    legendItems.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d => jurisdictionColors[d] || '#69b3a2')
        .attr('stroke', d => selectedJurisdiction === d ? '#333' : 'none')
        .attr('stroke-width', d => selectedJurisdiction === d ? 2 : 0);

    legendItems.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '12px')
        .style('font-weight', d => selectedJurisdiction === d ? 'bold' : 'normal')
        .style('fill', d => selectedJurisdiction === 'all' || selectedJurisdiction === d ? '#333' : '#999')
        .text(d => d);
}

// Initialize the chart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking for stacked area container...');
    const container = document.getElementById('stacked-area');
    if (container) {
        console.log('Stacked area container found, loading data...');
        loadStackedAreaData();
    } else {
        console.error('Stacked area container not found!');
    }
});
