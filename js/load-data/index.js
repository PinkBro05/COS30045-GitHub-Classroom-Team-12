d3.csv('data/annual_metrics_data.csv', d => ({
  year: +d.year,
  state: d.state,
  metric: d.metric,
  data: +d.data
})).then(data => {
  console.log('Loaded data:', data.length, 'records');
  
  // Store data globally for filtering
  window.fullData = data;
  
  // Create shared filter UI
  createSharedMetricFilter(data);
  
  // Function to update both charts when filter changes
  function updateCharts(metric, year) {
    let mapData, stackedData;
    
    if (metric === 'ALL') {
      // For "ALL" metrics: aggregate data by state and year
      const mapDataByState = {};
      const stackedDataByStateYear = {};
      
      // Aggregate map data for selected year across all metrics
      data.filter(d => d.year === year).forEach(d => {
        if (!mapDataByState[d.state]) {
          mapDataByState[d.state] = { state: d.state, data: 0, year: d.year, metric: 'ALL' };
        }
        mapDataByState[d.state].data += d.data;
      });
      mapData = Object.values(mapDataByState);
      
      // Aggregate stacked data across all years and metrics
      data.forEach(d => {
        const key = `${d.state}_${d.year}`;
        if (!stackedDataByStateYear[key]) {
          stackedDataByStateYear[key] = { state: d.state, year: d.year, data: 0, metric: 'ALL' };
        }
        stackedDataByStateYear[key].data += d.data;
      });
      stackedData = Object.values(stackedDataByStateYear);
      
    } else {
      // Filter data for map (single year and specific metric)
      mapData = data.filter(d => d.year === year && d.metric === metric);
      
      // Filter data for stacked area (all years for selected metric)
      stackedData = data.filter(d => d.metric === metric);
    }
    
    // Update both charts
    drawMapAndBar('#australia-map', mapData);
    drawStackedArea('#stacked-area', stackedData);
  }
  
  // Register the update function as a callback
  addFilterCallback(updateCharts);
  
  // Initial chart rendering with default filters
  updateCharts(SharedFilter.currentMetric, SharedFilter.currentYear);
});