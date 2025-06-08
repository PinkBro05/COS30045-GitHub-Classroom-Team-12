// Nightingale Rose Chart for Drug Types by State
// Configuration for the chart
const NIGHTINGALE_CONFIG = {
  dimensions: {
    width: 800,
    height: 600,
    radius: 250
  },
  colors: {
    amphetamine: '#E69F00',
    cannabis: '#56B4E9', 
    cocaine: '#009E73',
    ecstasy: '#F0E442',
    methylamphetamine: '#0072B2',
    other: '#D55E00',
    unknown: '#CC79A7'
  },
  transitions: {
    duration: 750
  }
};

// Approximate licensed drivers per state (2023 estimates in thousands)
const LICENSE_HOLDERS_BY_STATE = {
  'NSW': 5200,
  'VIC': 4100,
  'QLD': 3400,
  'SA': 1200,
  'WA': 1800,
  'TAS': 380,
  'NT': 160,
  'ACT': 280
};

class NightingaleRoseChart {
  constructor(containerId) {
    this.containerId = containerId;
    this.data = null;
    this.svg = null;
    this.chartGroup = null;
    this.tooltip = null;
    this.activeDrugTypes = new Set(Object.keys(NIGHTINGALE_CONFIG.colors));
    this.init();
  }

  init() {
    // Create tooltip
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'global-tooltip')
      .style('opacity', 0);

    // Set up SVG
    const container = d3.select(this.containerId);
    container.selectAll('*').remove();

    this.svg = container
      .append('svg')
      .attr('viewBox', `0 0 ${NIGHTINGALE_CONFIG.dimensions.width} ${NIGHTINGALE_CONFIG.dimensions.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Create main chart group centered
    this.chartGroup = this.svg
      .append('g')
      .attr('transform', `translate(${NIGHTINGALE_CONFIG.dimensions.width / 2}, ${NIGHTINGALE_CONFIG.dimensions.height / 2})`);
  }

  processData(rawData) {
    const drugTypes = ['AMPHETAMINE', 'CANNABIS', 'COCAINE', 'ECSTASY', 'METHYLAMPHETAMINE', 'OTHER', 'UNKNOWN'];
    const processedData = [];

    rawData.forEach(row => {
      const state = row.JURISDICTION;
      const licenseHolders = LICENSE_HOLDERS_BY_STATE[state];
      
      if (licenseHolders) {
        drugTypes.forEach(drugType => {
          const count = +row[`Sum(${drugType})`] || 0;
          if (count > 0) {
            const per10k = (count / licenseHolders) * 10;
            processedData.push({
              state: state,
              drugType: drugType.toLowerCase(),
              count: count,
              per10k: per10k,
              licenseHolders: licenseHolders
            });
          }
        });
      }
    });

    return processedData;
  }

  draw(data) {
    this.data = this.processData(data);
    
    if (!this.data || this.data.length === 0) {
      console.warn('No data available for nightingale rose chart');
      return;
    }

    this.redraw();
  }

  redraw() {
    // Clear existing chart elements
    this.chartGroup.selectAll('*').remove();
    this.svg.select('.legend').remove();

    // Filter data based on active drug types
    const filteredData = this.data.filter(d => this.activeDrugTypes.has(d.drugType));

    if (filteredData.length === 0) {
      // Show message when no data is visible
      this.chartGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '16px')
        .style('fill', '#666')
        .text('No data visible. Click legend items to show drug types.');
      
      this.drawLegend();
      return;
    }

    // Group data by state and calculate maximum total per state for proper scaling
    const dataByState = d3.group(filteredData, d => d.state);
    
    // Calculate the maximum total value per state for scaling
    let maxTotalValue = 0;
    dataByState.forEach((stateData) => {
      const totalValue = d3.sum(stateData, d => d.per10k);
      if (totalValue > maxTotalValue) {
        maxTotalValue = totalValue;
      }
    });
    
    // Calculate angles for each state
    const states = Array.from(dataByState.keys());
    const angleStep = (2 * Math.PI) / states.length;
    
    // Create scales using the maximum total value
    const radiusScale = d3.scaleLinear()
      .domain([0, maxTotalValue])
      .range([20, NIGHTINGALE_CONFIG.dimensions.radius]);

    // Draw petals for each state
    states.forEach((state, stateIndex) => {
      const stateData = dataByState.get(state);
      const startAngle = stateIndex * angleStep;
      const endAngle = (stateIndex + 1) * angleStep;
      
      // Sort drugs by frequency for better visual layering (smallest to largest for proper stacking)
      const sortedDrugs = stateData.sort((a, b) => a.per10k - b.per10k);
      
      // Calculate cumulative values for proper stacking
      let cumulativeValue = 0;
      
      // Draw each drug type as a stacked petal segment
      sortedDrugs.forEach((drugData, drugIndex) => {
        const innerRadius = cumulativeValue === 0 ? 0 : radiusScale(cumulativeValue);
        cumulativeValue += drugData.per10k;
        const outerRadius = radiusScale(cumulativeValue);
        
        // Create arc generator
        const arc = d3.arc()
          .innerRadius(innerRadius)
          .outerRadius(outerRadius)
          .startAngle(startAngle)
          .endAngle(endAngle)
          .padAngle(0.01);

        // Add petal
        const petal = this.chartGroup
          .append('path')
          .datum(drugData)
          .attr('d', arc)
          .attr('fill', NIGHTINGALE_CONFIG.colors[drugData.drugType])
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .style('opacity', 0)
          .transition()
          .duration(NIGHTINGALE_CONFIG.transitions.duration)
          .style('opacity', 0.8);

        // Add hover effects (need to reselect the path after transition)
        this.chartGroup.selectAll('path').filter(function(d) {
          return d === drugData;
        })
          .on('mouseover', (event, d) => {
            d3.select(event.target).style('opacity', 1);
            this.showTooltip(event, d);
          })
          .on('mouseout', (event, d) => {
            d3.select(event.target).style('opacity', 0.8);
            this.hideTooltip();
          });
      });

      // Add state labels
      const labelAngle = startAngle + (endAngle - startAngle) / 2;
      const labelRadius = NIGHTINGALE_CONFIG.dimensions.radius + 30;
      const labelX = Math.cos(labelAngle - Math.PI / 2) * labelRadius;
      const labelY = Math.sin(labelAngle - Math.PI / 2) * labelRadius;

      this.chartGroup
        .append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .style('opacity', 0)
        .text(state)
        .transition()
        .duration(NIGHTINGALE_CONFIG.transitions.duration)
        .style('opacity', 1);
    });

    // Add legend
    this.drawLegend();
  }

  drawLegend() {
    const legend = this.svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, ${NIGHTINGALE_CONFIG.dimensions.height - 200})`);

    const drugTypes = Object.keys(NIGHTINGALE_CONFIG.colors);
    
    legend
      .append('text')
      .attr('x', 0)
      .attr('y', -10)
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Drug Types (Click to filter):');

    drugTypes.forEach((drugType, index) => {
      const legendItem = legend
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', `translate(0, ${index * 25})`)
        .style('cursor', 'pointer');

      const isActive = this.activeDrugTypes.has(drugType);

      legendItem
        .append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', NIGHTINGALE_CONFIG.colors[drugType])
        .attr('stroke', isActive ? 'none' : '#ccc')
        .attr('stroke-width', isActive ? 0 : 2)
        .style('opacity', isActive ? 1 : 0.3);

      legendItem
        .append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '12px')
        .style('fill', isActive ? '#333' : '#999')
        .style('font-weight', isActive ? 'normal' : '300')
        .text(drugType.charAt(0).toUpperCase() + drugType.slice(1));

      // Add click handler
      legendItem.on('click', (event, d) => {
        this.toggleDrugType(drugType);
      });

      // Add hover effects
      legendItem
        .on('mouseover', function() {
          d3.select(this).style('opacity', 0.7);
        })
        .on('mouseout', function() {
          d3.select(this).style('opacity', 1);
        });
    });

    // Add "Show All" / "Hide All" buttons
    const controlsGroup = legend
      .append('g')
      .attr('transform', `translate(0, ${drugTypes.length * 25})`);

    const showAllBtn = controlsGroup
      .append('g')
      .attr('class', 'control-button')
      .style('cursor', 'pointer');

    showAllBtn
      .append('rect')
      .attr('width', 70)
      .attr('height', 20)
      .attr('fill', '#e8f4fd')
      .attr('stroke', '#2196F3')
      .attr('rx', 3);

    showAllBtn
      .append('text')
      .attr('x', 35)
      .attr('y', 13)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#2196F3')
      .text('Show All');

    showAllBtn.on('click', () => {
      this.activeDrugTypes = new Set(Object.keys(NIGHTINGALE_CONFIG.colors));
      this.redraw();
    });

    const hideAllBtn = controlsGroup
      .append('g')
      .attr('class', 'control-button')
      .attr('transform', 'translate(80, 0)')
      .style('cursor', 'pointer');

    hideAllBtn
      .append('rect')
      .attr('width', 70)
      .attr('height', 20)
      .attr('fill', '#ffebee')
      .attr('stroke', '#f44336')
      .attr('rx', 3);

    hideAllBtn
      .append('text')
      .attr('x', 35)
      .attr('y', 13)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#f44336')
      .text('Hide All');

    hideAllBtn.on('click', () => {
      this.activeDrugTypes.clear();
      this.redraw();
    });
  }

  toggleDrugType(drugType) {
    if (this.activeDrugTypes.has(drugType)) {
      this.activeDrugTypes.delete(drugType);
    } else {
      this.activeDrugTypes.add(drugType);
    }
    this.redraw();
  }

  showTooltip(event, data) {
    this.tooltip
      .style('opacity', 1)
      .html(`
        <div style="font-weight: bold; margin-bottom: 5px;">${data.state} - ${data.drugType.charAt(0).toUpperCase() + data.drugType.slice(1)}</div>
        <div>Total Cases: ${data.count.toLocaleString()}</div>
        <div>Per 10,000 Licenses: ${data.per10k.toFixed(2)}</div>
        <div style="font-size: 11px; color: #ccc; margin-top: 3px;">
          Est. License Holders: ${(data.licenseHolders * 1000).toLocaleString()}
        </div>
      `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  }

  hideTooltip() {
    this.tooltip.style('opacity', 0);
  }
}

// Function to draw the nightingale rose chart
function drawNightingaleRose(containerId, data) {
  const chart = new NightingaleRoseChart(containerId);
  chart.draw(data);
}

// Global reference for potential updates
window.nightingaleRoseChart = null;
