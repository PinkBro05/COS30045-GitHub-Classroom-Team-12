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
    // Filter data for map (single year)
    const mapData = data.filter(d => d.year === year && d.metric === metric);
    
    // Filter data for stacked area (all years for selected metric)
    const stackedData = data.filter(d => d.metric === metric);
    
    // Update both charts
    drawMapAndBar('#australia-map', mapData);
    drawStackedArea('#stacked-area', stackedData);
  }
  
  // Register the update function as a callback
  addFilterCallback(updateCharts);
  
  // Initial chart rendering with default filters
  updateCharts(SharedFilter.currentMetric, SharedFilter.currentYear);
});