// Configuration for combination chart
const COMBO_CONFIG = {
  dimensions: {
    margin: { top: 60, right: 80, bottom: 80, left: 100 },
    width: 900,
    height: 500,
    inner: { width: 720, height: 360 }
  },
  colors: {
    breathBar: '#2E86AB',
    drugBar: '#A23B72',
    breathLine: '#F18F01',
    drugLine: '#C73E1D'
  }
};

// Combination Chart state
const CombinationChart = {
  currentFilter: 'all', // 'all', 'breath', 'drug'
  tooltip: null
};

// Initialize tooltip
document.addEventListener('DOMContentLoaded', function() {
  CombinationChart.tooltip = createTooltip('combination-chart-tooltip');
});

// Main drawing function
function drawCombinationChart(selector, conductedData, positiveData) {
  if (!conductedData || !positiveData || conductedData.length === 0) {
    console.warn('No data provided to drawCombinationChart');
    return;
  }

  const container = d3.select(selector);
  container.selectAll("*").remove();
  
  // Create filter dropdown
  createFilterDropdown(container);
  
  const svg = container.append('svg');
  svg.attr('viewBox', [0, 0, COMBO_CONFIG.dimensions.width, COMBO_CONFIG.dimensions.height]);

  // Process and aggregate data by year and test type
  const processedData = processDataForCombination(conductedData, positiveData);
  
  // Draw the chart
  drawChart(svg, processedData);
}

// Create filter dropdown
function createFilterDropdown(container) {
  const filterDiv = container.insert('div', ':first-child')
    .attr('class', 'metric-filter')
    .style('margin-bottom', '20px');

  filterDiv.append('label')
    .text('Filter by Test Type: ')
    .style('margin-right', '10px');

  const select = filterDiv.append('select')
    .on('change', function() {
      CombinationChart.currentFilter = this.value;
      // Re-render chart with new filter
      if (window.combinationChartData) {
        const processed = processDataForCombination(
          window.combinationChartData.conducted, 
          window.combinationChartData.positive
        );
        drawChart(d3.select('#combination svg'), processed);
      }
    });

  select.selectAll('option')
    .data([
      { value: 'all', text: 'All Tests (Breath + Drug)' },
      { value: 'breath', text: 'Breath Tests Only' },
      { value: 'drug', text: 'Drug Tests Only' }
    ])
    .enter()
    .append('option')
    .attr('value', d => d.value)
    .text(d => d.text);
}

// Process data for combination chart
function processDataForCombination(conductedData, positiveData) {
  // Group conducted data by year and test type
  const conductedByYear = d3.rollup(conductedData, 
    v => d3.sum(v, d => d.count), 
    d => d.year, 
    d => d.testType
  );

  // Group positive data by year and test type
  const positiveByYear = d3.rollup(positiveData, 
    v => d3.sum(v, d => d.count), 
    d => d.year, 
    d => d.testType
  );

  // Get all years
  const years = Array.from(new Set([
    ...conductedData.map(d => d.year),
    ...positiveData.map(d => d.year)
  ])).sort();

  // Create combined dataset
  return years.map(year => {
    const conductedBreath = conductedByYear.get(year)?.get('breath') || 0;
    const conductedDrug = conductedByYear.get(year)?.get('drug') || 0;
    const positiveBreath = positiveByYear.get(year)?.get('breath') || 0;
    const positiveDrug = positiveByYear.get(year)?.get('drug') || 0;

    return {
      year: year,
      conductedBreath: conductedBreath,
      conductedDrug: conductedDrug,
      positiveBreath: positiveBreath,
      positiveDrug: positiveDrug,
      totalConducted: conductedBreath + conductedDrug,
      totalPositive: positiveBreath + positiveDrug
    };
  });
}

// Draw the actual chart
function drawChart(svg, data) {
  // Clear existing chart content but keep the SVG
  svg.selectAll('.chart-content').remove();
  
  const chart = svg.append('g')
    .attr('class', 'chart-content')
    .attr('transform', `translate(${COMBO_CONFIG.dimensions.margin.left}, ${COMBO_CONFIG.dimensions.margin.top})`);

  // Filter data based on current filter
  let filteredData = data.map(d => ({...d}));
  
  if (CombinationChart.currentFilter === 'breath') {
    filteredData = filteredData.map(d => ({
      ...d,
      conductedDrug: 0,
      positiveDrug: 0,
      totalConducted: d.conductedBreath,
      totalPositive: d.positiveBreath
    }));
  } else if (CombinationChart.currentFilter === 'drug') {
    filteredData = filteredData.map(d => ({
      ...d,
      conductedBreath: 0,
      positiveBreath: 0,
      totalConducted: d.conductedDrug,
      totalPositive: d.positiveDrug
    }));
  }

  // Define scales
  const xScale = d3.scaleBand()
    .domain(filteredData.map(d => d.year))
    .range([0, COMBO_CONFIG.dimensions.inner.width])
    .padding(0.2);

  const yScaleBar = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => Math.max(d.totalConducted, d.conductedBreath + d.conductedDrug))])
    .range([COMBO_CONFIG.dimensions.inner.height, 0])
    .nice();

  const yScaleLine = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => Math.max(d.totalPositive, d.positiveBreath + d.positiveDrug))])
    .range([COMBO_CONFIG.dimensions.inner.height, 0])
    .nice();

  // Draw bars for conducted tests
  if (CombinationChart.currentFilter === 'all') {
    // Stacked bars for breath and drug tests
    const breathBars = chart.selectAll('.breath-bar')
      .data(filteredData)
      .join('rect')
      .attr('class', 'breath-bar')
      .attr('x', d => xScale(d.year))
      .attr('y', d => yScaleBar(d.conductedBreath))
      .attr('width', xScale.bandwidth())
      .attr('height', d => yScaleBar(0) - yScaleBar(d.conductedBreath))
      .attr('fill', COMBO_CONFIG.colors.breathBar)
      .style('opacity', 0.8);

    const drugBars = chart.selectAll('.drug-bar')
      .data(filteredData)
      .join('rect')
      .attr('class', 'drug-bar')
      .attr('x', d => xScale(d.year))
      .attr('y', d => yScaleBar(d.conductedBreath + d.conductedDrug))
      .attr('width', xScale.bandwidth())
      .attr('height', d => yScaleBar(0) - yScaleBar(d.conductedDrug))
      .attr('fill', COMBO_CONFIG.colors.drugBar)
      .style('opacity', 0.8);

    // Add tooltips to bars
    breathBars.on('mouseover', function(event, d) {
      const content = `<strong>Year: ${d.year}</strong><br/>
                       Breath Tests Conducted: ${d.conductedBreath.toLocaleString()}<br/>
                       Positive Breath Tests: ${d.positiveBreath.toLocaleString()}`;
      showTooltip(CombinationChart.tooltip, content, event);
    }).on('mouseout', () => hideTooltip(CombinationChart.tooltip));

    drugBars.on('mouseover', function(event, d) {
      const content = `<strong>Year: ${d.year}</strong><br/>
                       Drug Tests Conducted: ${d.conductedDrug.toLocaleString()}<br/>
                       Positive Drug Tests: ${d.positiveDrug.toLocaleString()}`;
      showTooltip(CombinationChart.tooltip, content, event);
    }).on('mouseout', () => hideTooltip(CombinationChart.tooltip));

  } else {
    // Single bars for filtered view
    const bars = chart.selectAll('.conducted-bar')
      .data(filteredData)
      .join('rect')
      .attr('class', 'conducted-bar')
      .attr('x', d => xScale(d.year))
      .attr('y', d => yScaleBar(d.totalConducted))
      .attr('width', xScale.bandwidth())
      .attr('height', d => yScaleBar(0) - yScaleBar(d.totalConducted))
      .attr('fill', CombinationChart.currentFilter === 'breath' ? 
            COMBO_CONFIG.colors.breathBar : COMBO_CONFIG.colors.drugBar)
      .style('opacity', 0.8);

    bars.on('mouseover', function(event, d) {
      const testType = CombinationChart.currentFilter === 'breath' ? 'Breath' : 'Drug';
      const content = `<strong>Year: ${d.year}</strong><br/>
                       ${testType} Tests Conducted: ${d.totalConducted.toLocaleString()}<br/>
                       Positive ${testType} Tests: ${d.totalPositive.toLocaleString()}`;
      showTooltip(CombinationChart.tooltip, content, event);
    }).on('mouseout', () => hideTooltip(CombinationChart.tooltip));
  }

  // Draw lines for positive cases
  const line = d3.line()
    .x(d => xScale(d.year) + xScale.bandwidth() / 2)
    .y(d => yScaleLine(d.totalPositive))
    .curve(d3.curveLinear);

  if (CombinationChart.currentFilter === 'all') {
    // Separate lines for breath and drug positive cases
    const breathLine = d3.line()
      .x(d => xScale(d.year) + xScale.bandwidth() / 2)
      .y(d => yScaleLine(d.positiveBreath))
      .curve(d3.curveLinear);

    const drugLine = d3.line()
      .x(d => xScale(d.year) + xScale.bandwidth() / 2)
      .y(d => yScaleLine(d.positiveDrug))
      .curve(d3.curveLinear);

    // Draw breath positive line
    chart.append('path')
      .datum(filteredData)
      .attr('class', 'breath-line')
      .attr('fill', 'none')
      .attr('stroke', COMBO_CONFIG.colors.breathLine)
      .attr('stroke-width', 3)
      .attr('d', breathLine);

    // Draw drug positive line
    chart.append('path')
      .datum(filteredData)
      .attr('class', 'drug-line')
      .attr('fill', 'none')
      .attr('stroke', COMBO_CONFIG.colors.drugLine)
      .attr('stroke-width', 3)
      .attr('d', drugLine);

    // Add circles for data points
    chart.selectAll('.breath-circle')
      .data(filteredData)
      .join('circle')
      .attr('class', 'breath-circle')
      .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr('cy', d => yScaleLine(d.positiveBreath))
      .attr('r', 4)
      .attr('fill', COMBO_CONFIG.colors.breathLine)
      .on('mouseover', function(event, d) {
        const content = `<strong>Year: ${d.year}</strong><br/>
                         Positive Breath Tests: ${d.positiveBreath.toLocaleString()}`;
        showTooltip(CombinationChart.tooltip, content, event);
      }).on('mouseout', () => hideTooltip(CombinationChart.tooltip));

    chart.selectAll('.drug-circle')
      .data(filteredData)
      .join('circle')
      .attr('class', 'drug-circle')
      .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr('cy', d => yScaleLine(d.positiveDrug))
      .attr('r', 4)
      .attr('fill', COMBO_CONFIG.colors.drugLine)
      .on('mouseover', function(event, d) {
        const content = `<strong>Year: ${d.year}</strong><br/>
                         Positive Drug Tests: ${d.positiveDrug.toLocaleString()}`;
        showTooltip(CombinationChart.tooltip, content, event);
      }).on('mouseout', () => hideTooltip(CombinationChart.tooltip));

  } else {
    // Single line for filtered view
    chart.append('path')
      .datum(filteredData)
      .attr('class', 'positive-line')
      .attr('fill', 'none')
      .attr('stroke', CombinationChart.currentFilter === 'breath' ? 
            COMBO_CONFIG.colors.breathLine : COMBO_CONFIG.colors.drugLine)
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add circles for data points
    chart.selectAll('.positive-circle')
      .data(filteredData)
      .join('circle')
      .attr('class', 'positive-circle')
      .attr('cx', d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr('cy', d => yScaleLine(d.totalPositive))
      .attr('r', 4)
      .attr('fill', CombinationChart.currentFilter === 'breath' ? 
            COMBO_CONFIG.colors.breathLine : COMBO_CONFIG.colors.drugLine)
      .on('mouseover', function(event, d) {
        const testType = CombinationChart.currentFilter === 'breath' ? 'Breath' : 'Drug';
        const content = `<strong>Year: ${d.year}</strong><br/>
                         Positive ${testType} Tests: ${d.totalPositive.toLocaleString()}`;
        showTooltip(CombinationChart.tooltip, content, event);
      }).on('mouseout', () => hideTooltip(CombinationChart.tooltip));
  }

  // Draw axes
  drawAxes(chart, xScale, yScaleBar, yScaleLine);
  
  // Draw legend
  drawComboLegend(chart);
}

// Draw axes
function drawAxes(chart, xScale, yScaleBar, yScaleLine) {
  // X-axis
  chart.append('g')
    .attr('transform', `translate(0, ${COMBO_CONFIG.dimensions.inner.height})`)
    .attr('class', 'axis')
    .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
    .append('text')
    .attr('x', COMBO_CONFIG.dimensions.inner.width / 2)
    .attr('y', 40)
    .attr('fill', 'black')
    .style('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text('Year');

  // Left Y-axis (for bars - conducted tests)
  chart.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(yScaleBar))
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -COMBO_CONFIG.dimensions.inner.height / 2)
    .attr('fill', 'black')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text('Tests Conducted');

  // Right Y-axis (for lines - positive cases)
  chart.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(${COMBO_CONFIG.dimensions.inner.width}, 0)`)
    .call(d3.axisRight(yScaleLine))
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('y', 60)
    .attr('x', -COMBO_CONFIG.dimensions.inner.height / 2)
    .attr('fill', 'black')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text('Positive Cases');
}

// Draw legend
function drawComboLegend(chart) {
  const legend = chart.append('g')
    .attr('class', 'combo-legend')
    .attr('transform', `translate(10, -40)`);

  let legendData = [];
  
  if (CombinationChart.currentFilter === 'all') {
    legendData = [
      { label: 'Breath Tests Conducted', color: COMBO_CONFIG.colors.breathBar, type: 'bar' },
      { label: 'Drug Tests Conducted', color: COMBO_CONFIG.colors.drugBar, type: 'bar' },
      { label: 'Positive Breath Tests', color: COMBO_CONFIG.colors.breathLine, type: 'line' },
      { label: 'Positive Drug Tests', color: COMBO_CONFIG.colors.drugLine, type: 'line' }
    ];
  } else {
    const testType = CombinationChart.currentFilter === 'breath' ? 'Breath' : 'Drug';
    const barColor = CombinationChart.currentFilter === 'breath' ? 
                     COMBO_CONFIG.colors.breathBar : COMBO_CONFIG.colors.drugBar;
    const lineColor = CombinationChart.currentFilter === 'breath' ? 
                      COMBO_CONFIG.colors.breathLine : COMBO_CONFIG.colors.drugLine;
    
    legendData = [
      { label: `${testType} Tests Conducted`, color: barColor, type: 'bar' },
      { label: `Positive ${testType} Tests`, color: lineColor, type: 'line' }
    ];
  }

  const legendItems = legend.selectAll('.legend-item')
    .data(legendData)
    .join('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 25})`);

  legendItems.each(function(d) {
    const item = d3.select(this);
    
    if (d.type === 'bar') {
      item.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d.color)
        .style('opacity', 0.8);
    } else {
      item.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 7.5)
        .attr('y2', 7.5)
        .attr('stroke', d.color)
        .attr('stroke-width', 3);
      
      item.append('circle')
        .attr('cx', 7.5)
        .attr('cy', 7.5)
        .attr('r', 3)
        .attr('fill', d.color);
    }
    
    item.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', '#333')
      .text(d.label);
  });
}
