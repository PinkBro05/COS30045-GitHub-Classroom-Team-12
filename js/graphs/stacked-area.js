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

// Stacked Area Chart state
const StackedAreaChart = {
  selectedJurisdiction: 'all',
  tooltip: null
};

// Initialize tooltip
document.addEventListener('DOMContentLoaded', function() {
  StackedAreaChart.tooltip = createTooltip('stacked-area-tooltip');
});

// Main drawing function
function drawStackedArea(selector, data) {
  if (!data || data.length === 0) {
    console.warn('No data provided to drawStackedArea');
    return;
  }

  data = data.sort((a, b) => d3.ascending(a.year, b.year));

  const svg = d3.select(selector);
  svg.selectAll("*").remove(); // Clear existing content
  
  const svgElement = svg.append('svg');
  svgElement.attr('viewBox', [0, 0, CHART_CONFIG.dimensions.width, CHART_CONFIG.dimensions.height]);

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

  const chart = svgElement.append('g')
    .attr('transform', `translate(${CHART_CONFIG.dimensions.margin.left}, ${CHART_CONFIG.dimensions.margin.top})`);

  // Draw areas with interactivity
  const areas = chart.selectAll('.area')
    .data(stackedData)
    .join('path')
    .attr('class', 'area')
    .attr('d', area)
    .attr('fill', d => stateColorScale(d.key) || '#69b3a2')
    .style('opacity', d => StackedAreaChart.selectedJurisdiction === 'all' || StackedAreaChart.selectedJurisdiction === d.key ? 0.8 : 0.3)
    .style('transition', 'opacity 0.3s ease');

  // Add tooltip interactions to areas
  if (StackedAreaChart.tooltip) {
    areas.on('mouseover', function(event, d) {
      const metricText = data.length > 0 && data[0].metric === 'ALL' 
        ? 'Combined Metrics Data' 
        : 'Metric Data';
      const content = `<strong>${d.key}</strong><br/>${metricText}`;
      showTooltip(StackedAreaChart.tooltip, content, event);
    })
    .on('mousemove', function(event, d) {
      const metricText = data.length > 0 && data[0].metric === 'ALL' 
        ? 'Combined Metrics Data' 
        : 'Metric Data';
      const content = `<strong>${d.key}</strong><br/>${metricText}`;
      StackedAreaChart.tooltip.html(content)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      hideTooltip(StackedAreaChart.tooltip);
    });
  }

  // X-axis
  chart.append('g')
    .attr('transform', `translate(0, ${CHART_CONFIG.dimensions.inner.height})`)
    .attr('class', 'axis')
    .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
    .append('text')
    .attr('x', CHART_CONFIG.dimensions.inner.width / 2)
    .attr('y', 40)
    .attr('fill', 'black')
    .style('text-anchor', 'middle')
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

  // Reference lines
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

  // Draw legend
  drawLegend(svgElement, Array.from(d3.union(data.map(d => d.state))).reverse());
}

// Legend drawing function
function drawLegend(svg, jurisdictions) {
  const legend = svg.append('g')
    .attr('transform', `translate(${CHART_CONFIG.dimensions.width - 47}, 150)`);

  const legendItems = legend.selectAll('.legend-item')
    .data(jurisdictions)
    .join('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`)
    .style('cursor', 'pointer')
    .on('click', function(event, d) {
      StackedAreaChart.selectedJurisdiction = StackedAreaChart.selectedJurisdiction === d ? 'all' : d;
      // Re-render with updated filter - we need access to current data for this
      if (window.fullData && SharedFilter) {
        let filteredData;
        if (SharedFilter.currentMetric === 'ALL') {
          // For "ALL" metrics: aggregate data by state and year
          const stackedDataByStateYear = {};
          window.fullData.forEach(item => {
            const key = `${item.state}_${item.year}`;
            if (!stackedDataByStateYear[key]) {
              stackedDataByStateYear[key] = { state: item.state, year: item.year, data: 0, metric: 'ALL' };
            }
            stackedDataByStateYear[key].data += item.data;
          });
          filteredData = Object.values(stackedDataByStateYear);
        } else {
          filteredData = window.fullData.filter(item => item.metric === SharedFilter.currentMetric);
        }
        drawStackedArea('#stacked-area', filteredData);
      }
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
    .attr('fill', d => stateColorScale(d))
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
