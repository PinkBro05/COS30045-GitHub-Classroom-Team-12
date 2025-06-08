// Load and process data for combination chart
Promise.all([
  d3.csv('data/annual_drug_breath_conducted.csv'),
  d3.csv('data/annual_pos_breath.csv'),
  d3.csv('data/annual_pos_drug.csv')
]).then(([conductedData, posBreathData, posDrugData]) => {
  console.log('Loaded combination chart data:', {
    conducted: conductedData.length,
    posBreath: posBreathData.length,
    posDrug: posDrugData.length
  });

  // Process conducted tests data
  const processedConductedData = [];
  
  conductedData.forEach(row => {
    const year = +row.YEAR;
    const jurisdiction = row.JURISDICTION;
    const count = +row['Sum(COUNT)'];
    const metric = row.METRIC;
    
    if (count && !isNaN(count) && !isNaN(year)) {
      let testType = '';
      if (metric === 'breath_tests_conducted') {
        testType = 'breath';
      } else if (metric === 'drug_tests_conducted') {
        testType = 'drug';
      }
      
      if (testType) {
        processedConductedData.push({
          year: year,
          jurisdiction: jurisdiction,
          testType: testType,
          count: count
        });
      }
    }
  });

  // Process positive breath tests data
  const processedPosBreathData = [];
  
  posBreathData.forEach(row => {
    const year = +row.YEAR;
    const jurisdiction = row.JURISDICTION;
    const count = +row['Sum(COUNT)'];
    
    if (count && !isNaN(count) && !isNaN(year)) {
      processedPosBreathData.push({
        year: year,
        jurisdiction: jurisdiction,
        testType: 'breath',
        count: count
      });
    }
  });

  // Process positive drug tests data
  const processedPosDrugData = [];
  
  posDrugData.forEach(row => {
    const year = +row.YEAR;
    const jurisdiction = row.JURISDICTION;
    const count = +row['Sum(COUNT)'];
    
    if (count && !isNaN(count) && !isNaN(year)) {
      processedPosDrugData.push({
        year: year,
        jurisdiction: jurisdiction,
        testType: 'drug',
        count: count
      });
    }
  });

  // Combine positive data
  const processedPositiveData = [...processedPosBreathData, ...processedPosDrugData];

  // Store data globally for chart updates
  window.combinationChartData = {
    conducted: processedConductedData,
    positive: processedPositiveData
  };

  // Draw the initial chart
  drawCombinationChart('#combination', processedConductedData, processedPositiveData);

}).catch(error => {
  console.error('Error loading combination chart data:', error);
  
  // Show error message to user
  const container = d3.select('#combination');
  container.selectAll('*').remove();
  container.append('div')
    .style('text-align', 'center')
    .style('padding', '50px')
    .style('color', '#666')
    .html(`
      <h3>Error Loading Data</h3>
      <p>Unable to load the required data files for the combination chart.</p>
      <p>Please check that the following files exist:</p>
      <ul style="text-align: left; display: inline-block;">
        <li>data/annual_drug_breath_conducted.csv</li>
        <li>data/annual_pos_breath.csv</li>
        <li>data/annual_pos_drug.csv</li>
      </ul>
    `);
});
