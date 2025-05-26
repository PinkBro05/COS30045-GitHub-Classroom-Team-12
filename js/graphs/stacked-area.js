
// Configuration
const CHART_CONFIG = {
  dimensions: {
    margin: { top: 40, right: 200, bottom: 80, left: 100 },
    width: 800,
    height: 380,
    inner: { width: 630, height: 300 }
  },
  padding: 1,
  referenceLines: [
    { year: 2021, label: '2021-30 National Road Safety Strategy', color: '#CC0000', dasharray: '5,5' },
    { year: 2023, label: '2023-25 Action Plan', color: '#0066CC', dasharray: '3,3' }
  ]
};

// Data loading and processing
// async function loadStackedAreaData() {
//   try {
//     console.log('Loading stacked area data...');

//     const dataFiles = [
//       { url: 'data/annual_speed_mobile.csv', valueColumn: 'Sum(FINES)' },
//       { url: 'data/annual_pos_breath.csv', valueColumn: 'Sum(COUNT)' },
//       { url: 'data/annual_pos_drug.csv', valueColumn: 'Sum(COUNT)' },
//       { url: 'data/annual_drug_breath_conducted.csv', valueColumn: 'Sum(COUNT)' }
//     ];

//     const datasets = await Promise.all(
//       dataFiles.map(async ({ url, valueColumn }) => {
//         const data = await d3.csv(url);
//         return processCSVData(data, valueColumn);
//       })
//     );

//     console.log('Data loaded successfully:', datasets.map(d => d.length));

//     // Combine all data and filter out unlicensed_driving
//     StackedAreaChart.data = datasets
//     .flat()
//     .filter(d => d.metric !== 'unlicensed_driving');

//     // Update state
//     StackedAreaChart.filteredMetrics = new Set(StackedAreaChart.data.map(d => d.metric));
//     StackedAreaChart.availableJurisdictions = new Set(StackedAreaChart.data.map(d => d.jurisdiction));

//     console.log('Processed data:', StackedAreaChart.data.length, 'records');
//     console.log('Available metrics:', Array.from(StackedAreaChart.filteredMetrics));
//     console.log('Available jurisdictions:', Array.from(StackedAreaChart.availableJurisdictions));

//     // Initialize chart
//     drawStackedArea('#stacked-area', StackedAreaChart.data);
//     createMetricFilter();

//   } catch (error) {
//     console.error('Error loading stacked area data:', error);
//     displayError('#stacked-area', error.message);
//   }
// }

// // UI Components
// function createMetricFilter() {
//   const container = d3.select('#stacked-area').node().parentNode;
//   d3.select(container).select('.metric-filter').remove();

//   const filterDiv = d3.select(container)
//   .insert('div', ':first-child')
//   .attr('class', 'metric-filter')
//   .style('margin-bottom', '20px')
//   .style('text-align', 'center');

//   filterDiv.append('label')
//   .text('Filter by Metric: ')
//   .style('margin-right', '10px')
//   .style('font-weight', 'bold');

//   const select = filterDiv.append('select')
//   .style('padding', '5px 10px')
//   .style('border-radius', '4px')
//   .style('border', '1px solid #ccc')
//   .on('change', function() {
//     StackedAreaChart.currentMetricFilter = this.value;
//     drawStackedArea('#stacked-area', StackedAreaChart.data);
//   });

//   // Add options
//   select.append('option').attr('value', 'all').text('All Metrics');
//   Array.from(StackedAreaChart.filteredMetrics).sort().forEach(metric => {
//     select.append('option')
//     .attr('value', metric)
//     .text(metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
//   });
// }

// // Data processing for chart
// function prepareChartData(data) {
//   let filteredData = data;
//   if (StackedAreaChart.currentMetricFilter !== 'all') {
//     filteredData = data.filter(d => d.metric === StackedAreaChart.currentMetricFilter);
//   }

//   if (filteredData.length === 0) return null;

//   const aggregatedData = d3.rollup(
//     filteredData,
//     v => d3.sum(v, d => d.value),
//     d => d.year,
//     d => d.jurisdiction
//   );

//   const years = Array.from(aggregatedData.keys()).sort();
//   const jurisdictions = Array.from(StackedAreaChart.availableJurisdictions).sort();

//   const processedData = years.map(year => {
//     const yearData = { year };
//     jurisdictions.forEach(jurisdiction => {
//       yearData[jurisdiction] = aggregatedData.get(year)?.get(jurisdiction) || 0;
//     });
//     return yearData;
//   });

//   return { processedData, years, jurisdictions };
// }

// Main drawing function
function drawStackedArea(selector, data) {
  data = data.sort((a, b) => d3.ascending(a.year, b.year));

  const svg = d3.select(selector).append('svg');
  svg.selectAll("*").remove();
  svg.attr('viewBox', [0, 0, CHART_CONFIG.dimensions.width, CHART_CONFIG.dimensions.height]);

  // Group and stack data for stacked area chart
  const groupedData = d3.index(data, d => d.year, d => d.state);

  const stack = d3.stack()
    .keys(d3.union(data.map(d => d.state)))
    .value(([, group], key) => group.get(key)?.data || 0);

  const stackedData = stack(groupedData);

  // Define scales
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([0, CHART_CONFIG.dimensions.inner.width]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(stackedData.flat().flat())])
    .range([CHART_CONFIG.dimensions.inner.height, 0])
    .nice();

  // Add padding between stack layers
  stackedData.forEach((layer, layerIndex) => {
    layer.forEach(d => {
      if (layerIndex > 0) {
        d[0] += layerIndex * yScale.invert(CHART_CONFIG.dimensions.inner.height - CHART_CONFIG.padding);
        d[1] += layerIndex * yScale.invert(CHART_CONFIG.dimensions.inner.height - CHART_CONFIG.padding);
      }
    });
  });

  // Define areas from stacked data
  const area = d3.area()
    .x(d => xScale(d.data[0]))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveLinear);

  const chart = svg.append('g')
  .attr('transform', `translate(${CHART_CONFIG.dimensions.margin.left}, ${CHART_CONFIG.dimensions.margin.top})`);

  // Draw areas
  chart.selectAll('.area')
    .data(stackedData)
    .join('path')
    .attr('class', 'area')
    .attr('d', area)
    .attr('fill', d => stateColorScale(d.key) || '#69b3a2');

  // X-axis
  chart.append('g')
    .attr('transform', `translate(0, ${CHART_CONFIG.dimensions.inner.height})`)
    .attr('class', 'axis')
    .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
  .append('text')
    .attr('x', CHART_CONFIG.dimensions.inner.width / 2)
    .attr('y', 40)
    .attr('fill', 'black')
    .text('Year');

  // Y-axis
  chart.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(yScale))
  .append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('y', -80)
    .attr('x', -CHART_CONFIG.dimensions.inner.height / 2)
    .attr('fill', 'black')
    .text('Count/Fines');

  CHART_CONFIG.referenceLines.forEach(line => {
    if (line.year >= d3.min(data, d => d.year) && line.year <= d3.max(data, d => d.year)) {
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
      .attr('x', xScale(line.year))
      .attr('y', line.year === 2023 ? 15 : -5)
      .attr('fill', line.color)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text(line.label);
    }
  });

  // Draw legends
  const legend = svg.append('g')
    .attr('transform', `translate(${CHART_CONFIG.dimensions.width - 47}, 150)`);

  const legendItems = legend.selectAll('.legend-item')
    .data(Array.from(d3.union(data.map(d => d.state))).reverse())
    .join('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`)
    .style('cursor', 'pointer');

  legendItems.append('rect')
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', d => stateColorScale(d));

  legendItems.append('text')
    .attr('x', 20)
    .attr('y', 12)
    .style('font-size', '12px')
    .text(d => d);
}

// Drawing helper functions
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
  .style('opacity', d => StackedAreaChart.selectedJurisdiction === 'all' || StackedAreaChart.selectedJurisdiction === d.key ? 0.8 : 0.3)
  .style('transition', 'opacity 0.3s ease')
  .on('mouseover', handlers.mouseover)
  .on('mousemove', handlers.mousemove)
  .on('mouseout', handlers.mouseout);
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
