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
        .attr('stroke-width', 0.5);
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

  innerBar.append('text')
    .text('Total Data by State')
    .attr('x', graphWidth / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .attr('class', 'bar-title');

}

function drawMapAndBar(selector, data) {

  data = data.sort((a, b) => d3.ascending(a.data, b.data));

  const svg = d3.select(selector).append('svg');
  svg.selectAll("*").remove(); // Clear existing content
  svg.attr('viewBox', [0, 0, 800, 750]); // Different viewBox for better fit for map

  drawAustraliaMap(svg, data);

  drawBarChart(svg, data);
}