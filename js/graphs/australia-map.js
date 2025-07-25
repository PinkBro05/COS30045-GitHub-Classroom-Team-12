const mapIdToState = {
  0: 'NSW',
  1: 'VIC',
  2: 'QLD',
  3: 'SA',
  4: 'WA',
  5: 'TAS',
  6: 'NT',
  7: 'ACT',
};

function drawAustraliaMap(svg, data) {
  const width = 800;
  const height = 750;

  const innerMap = svg.append('g')
    .attr('class', 'australia-map');

  const projection = d3.geoMercator()
    .center([138, -23]) // Center on Australia
    .scale(1000); // Adjust scale for better fit;

  const path = d3.geoPath().projection(projection);

  mapColorScale.domain([0, d3.max(data, d => d.data)]);

  // Create tooltip for map
  const mapTooltip = d3.select('body').selectAll('.map-tooltip').data([null]);
  const tooltip = mapTooltip.enter()
    .append('div')
    .attr('class', 'map-tooltip global-tooltip')
    .merge(mapTooltip)
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background', 'rgba(0, 0, 0, 0.8)')
    .style('color', 'white')
    .style('padding', '10px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('z-index', '1000');

  innerMap.append('g')
    .attr('class', 'australia-map-legend')
    .attr('transform', `translate(${width - 350}, ${height - 50})`)
    .append(() => Legend(mapColorScale));

  fetch('data/ausMapData.json')
    .then(response => response.json())
    .then(dataAusTopoJson => {
      const ausTopology = topojson.feature(dataAusTopoJson, dataAusTopoJson.objects.austates).features;

      innerMap.selectAll('path')
        .data(ausTopology)
        .join('path')
        .attr('d', path)
        .attr('fill', d => {
          const value = data.find(item => item.state === mapIdToState[d.id]);
          return value ? mapColorScale(value.data) : '#ccc';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          const stateData = data.find(item => item.state === mapIdToState[d.id]);
          if (stateData) {
            d3.select(this).style('opacity', 0.8);
            const metricText = stateData.metric === 'ALL' 
              ? 'Combined Metrics Data' 
              : 'Metric Data';
            const content = `<strong>${stateData.state}</strong><br/>${metricText}: ${Math.round(stateData.data * 100) / 100}`;
            showTooltip(tooltip, content, event);
          }
        })
        .on('mousemove', function(event, d) {
          const stateData = data.find(item => item.state === mapIdToState[d.id]);
          if (stateData) {
            const metricText = stateData.metric === 'ALL' 
              ? 'Combined Metrics Data' 
              : 'Metric Data';
            const content = `<strong>${stateData.state}</strong><br/>${metricText}: ${Math.round(stateData.data * 100) / 100}`;
            tooltip.html(content)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          }
        })
        .on('mouseout', function(event, d) {
          d3.select(this).style('opacity', 1);
          hideTooltip(tooltip);
        });
    });
}

function drawBarChart(svg, data) {
  const width = 800;
  const height = 750;
  const graphWidth = 250;
  const graphHeight = 150;
  const marginBottom = 10;

  const innerBar = svg.append('g')
    .attr('class', 'australia-map-bar')
    .attr('transform', `translate(50, ${height - graphHeight - marginBottom})`);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.data)])
    .range([0, graphWidth])
    .nice();

  const yScale = d3.scaleBand()
    .domain(data.map(d => d.state))
    .range([0, graphHeight])
    .padding(0.1);

  const barAndLabel = innerBar.selectAll('g')
    .data(data)
    .join('g')
    .attr('transform', d => `translate(0, ${yScale(d.state)})`);

  barAndLabel.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', d => xScale(d.data))
    .attr('height', yScale.bandwidth())
    .attr('fill', barColor);

  barAndLabel.append('text')
    .text(d => d.state)
    .attr('x', -5)
    .attr('y', yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('fill', 'black')
    .attr('class', 'bar-label name');

  barAndLabel.append('text')
    .text(d => Math.round(d.data * 100) / 100)
    .attr('x', d => xScale(d.data) + 5)
    .attr('y', yScale.bandwidth() / 2)
    .attr('text-anchor', 'start')
    .attr('fill', 'black')
    .attr('class', 'bar-label figure');

  // Dynamic title based on metric type
  const titleText = data.length > 0 && data[0].metric === 'ALL' 
    ? 'Combined Data by State' 
    : 'Total Data by State';

  innerBar.append('text')
    .text(titleText)
    .attr('x', graphWidth / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .attr('class', 'bar-title');

}

function drawMapAndBar(selector, data) {
  if (!data || data.length === 0) {
    console.warn('No data provided to drawMapAndBar');
    return;
  }

  data = data.sort((a, b) => d3.ascending(a.data, b.data));

  const container = d3.select(selector);
  container.selectAll("*").remove(); // Clear existing content
  
  const svg = container.append('svg');
  svg.attr('viewBox', [0, 0, 800, 750]); // Different viewBox for better fit for map

  drawAustraliaMap(svg, data);

  drawBarChart(svg, data);
}