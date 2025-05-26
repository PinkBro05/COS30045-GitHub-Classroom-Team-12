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

const drawAustraliaMap = (selector, data) => {

  svg = d3.select(selector);
  svg.selectAll("*").remove(); // Clear existing content
  svg.attr('viewBox', [0, 0, width, height]);

  innerChart = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const projection = d3.geoMercator()
    .center([133, -25]) // Center on Australia
    .scale(1000) // Adjust scale for better fit
    .translate([inner.width / 2, inner.height / 2]);

  const path = d3.geoPath().projection(projection);

  mapColorScale.domain(d3.extent(data, d => d.data))

  ausTopology = fetch('data/ausMapData.json')
    .then(response => response.json())
    .then(dataAusTopoJson => {
      const ausTopology = topojson.feature(dataAusTopoJson, dataAusTopoJson.objects.austates).features;

      innerChart.selectAll('path')
        .data(ausTopology)
        .join('path')
        .attr('d', path)
        .attr('fill', d => {
          console.log(d);
          const value = data.find(item => item.state === mapIdToState[d.id]);
          return value ? mapColorScale(value.data) : '#ccc';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5);
    });
}