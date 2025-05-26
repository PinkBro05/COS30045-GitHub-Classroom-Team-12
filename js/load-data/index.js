d3.csv('data/annual_metrics_data.csv', d => ({
  year: +d.year,
  state: d.state,
  metric: d.metric,
  data: +d.data
})).then(data => {
  console.log(data);

  drawMapAndBar('#australia-map', data.filter(d => d.year === 2023 && d.metric === 'speed_fines'));

  drawStackedArea('#stacked-area', data.filter(d => d.metric === 'speed_fines'));
  // createMetricFilter();
});