// Load and process data for nightingale rose chart
d3.csv('data/2023/2023_drug_types.csv').then(data => {
  console.log('Loaded drug types data:', data.length, 'rows');
  
  // Filter for positive drug tests only
  const drugTypesData = data.filter(d => d.METRIC === 'positive_drug_tests');
  
  console.log('Filtered drug types data:', drugTypesData.length, 'rows');
  
  if (drugTypesData.length === 0) {
    console.warn('No drug types data found');
    // Show message to user
    const container = d3.select('#nightingale-rose');
    container.selectAll('*').remove();
    container.append('div')
      .style('text-align', 'center')
      .style('padding', '50px')
      .style('color', '#666')
      .html(`
        <h3>No Data Available</h3>
        <p>Unable to load drug types data for 2023.</p>
        <p>Please check that the following file exists:</p>
        <ul style="text-align: left; display: inline-block;">
          <li>data/2023/2023_drug_types.csv</li>
        </ul>
      `);
    return;
  }

  // Store data globally for potential updates
  window.nightingaleRoseData = drugTypesData;

  // Create and draw the chart
  window.nightingaleRoseChart = new NightingaleRoseChart('#nightingale-rose');
  window.nightingaleRoseChart.draw(drugTypesData);

}).catch(error => {
  console.error('Error loading drug types data:', error);
  
  // Show error message to user
  const container = d3.select('#nightingale-rose');
  container.selectAll('*').remove();
  container.append('div')
    .style('text-align', 'center')
    .style('padding', '50px')
    .style('color', '#666')
    .html(`
      <h3>Error Loading Data</h3>
      <p>Unable to load the drug types data file.</p>
      <p>Please check that the following file exists:</p>
      <ul style="text-align: left; display: inline-block;">
        <li>data/2023/2023_drug_types.csv</li>
      </ul>
      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        Error: ${error.message}
      </p>
    `);
});
