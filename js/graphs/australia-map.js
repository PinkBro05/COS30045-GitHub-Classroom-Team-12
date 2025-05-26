// Australia Map Visualization

// State management
const AustraliaMap = {
    data: [],
    svg: null,
    
    // Initialize map
    init(selector, data) {
        this.data = data;
        this.draw(selector);
    },
    
    // Main drawing function
    draw(selector) {
        this.svg = d3.select(selector).append('svg');
        this.svg.selectAll("*").remove();
        this.svg.attr('viewBox', `0 0 ${MAP_CONFIG.width} ${MAP_CONFIG.height}`);
        
        this.drawMap();
        this.drawBarChart();
    }
};

// Configuration
const MAP_CONFIG = {
    width: 800,
    height: 750,
    barChart: {
        width: 250,
        height: 150,
        marginBottom: 10
    },
    projection: {
        center: [138, -23],
        scale: 1000
    }
};

// State ID to name mapping
const mapIdToState = {
    0: 'NSW', 1: 'VIC', 2: 'QLD', 3: 'SA',
    4: 'WA', 5: 'TAS', 6: 'NT', 7: 'ACT'
};

// Map drawing methods
AustraliaMap.drawMap = function() {
    const projection = d3.geoMercator()
        .center(MAP_CONFIG.projection.center)
        .scale(MAP_CONFIG.projection.scale);

    const path = d3.geoPath().projection(projection);
    
    if (typeof mapColorScale !== 'undefined') {
        mapColorScale.domain([0, d3.max(this.data, d => d.data)]);
    }

    const innerMap = this.svg.append('g').attr('class', 'australia-map');

    // Add legend
    if (typeof mapColorScale !== 'undefined' && typeof Legend !== 'undefined') {
        innerMap.append('g')
            .attr('class', 'australia-map-legend')
            .attr('transform', `translate(${MAP_CONFIG.width - 350}, ${MAP_CONFIG.height - 50})`)
            .append(() => Legend(mapColorScale));
    }

    // Load and draw map data
    fetch('data/ausMapData.json')
        .then(response => response.json())
        .then(dataAusTopoJson => {
            const ausTopology = topojson.feature(dataAusTopoJson, dataAusTopoJson.objects.austates).features;

            innerMap.selectAll('path')
                .data(ausTopology)
                .join('path')
                .attr('d', path)
                .attr('fill', d => {
                    const value = this.data.find(item => item.state === mapIdToState[d.id]);
                    return value && typeof mapColorScale !== 'undefined' ? mapColorScale(value.data) : '#ccc';
                })
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.5);
        })
        .catch(error => console.error('Error loading map data:', error));
};

// Bar chart drawing method
AustraliaMap.drawBarChart = function() {
    const { width: graphWidth, height: graphHeight, marginBottom } = MAP_CONFIG.barChart;
    
    const innerBar = this.svg.append('g')
        .attr('class', 'australia-map-bar')
        .attr('transform', `translate(50, ${MAP_CONFIG.height - graphHeight - marginBottom})`);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(this.data, d => d.data)])
        .range([0, graphWidth])
        .nice();

    const yScale = d3.scaleBand()
        .domain(this.data.map(d => d.state))
        .range([0, graphHeight])
        .padding(0.1);

    const barAndLabel = innerBar.selectAll('g')
        .data(this.data)
        .join('g')
        .attr('transform', d => `translate(0, ${yScale(d.state)})`);

    // Draw bars
    barAndLabel.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', d => xScale(d.data))
        .attr('height', yScale.bandwidth())
        .attr('fill', typeof barColor !== 'undefined' ? barColor : 'steelblue');

    // State labels
    barAndLabel.append('text')
        .text(d => d.state)
        .attr('x', -5)
        .attr('y', yScale.bandwidth() / 2)
        .attr('text-anchor', 'end')
        .attr('fill', 'black')
        .attr('class', 'bar-label name');

    // Value labels
    barAndLabel.append('text')
        .text(d => formatNumber(d.data))
        .attr('x', d => xScale(d.data) + 5)
        .attr('y', yScale.bandwidth() / 2)
        .attr('text-anchor', 'start')
        .attr('fill', 'black')
        .attr('class', 'bar-label figure');

    // Title
    innerBar.append('text')
        .text('Total Data by State')
        .attr('x', graphWidth / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('class', 'bar-title');
};

// Public interface function
function drawMapAndBar(selector, data) {
    AustraliaMap.init(selector, data);
}

