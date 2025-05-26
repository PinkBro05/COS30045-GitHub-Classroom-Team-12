d3.csv('data/annual_metrics_data.csv', d => ({
  year: +d.year,
  state: d.state,
  metric: d.metric,
  data: +d.data
})).then(data => {
  console.log(data);

  filterData = data.filter(d => d.year === 2023 && d.metric === 'speed_fines').sort((a, b) => b.data - a.data);

  drawMapAndBar('#australia-map', filterData);
});