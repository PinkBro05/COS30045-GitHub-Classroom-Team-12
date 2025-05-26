const fakeData = []
for (let year = 2018; year <= 2023; year++) {
    for (let state of ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']) {
      for (let metric of ['speedFines', 'mobileFines', 'noSeatbeltFines', 'unlicensedFines', 'positiveBreathFines', 'positiveDrugFines']) {
        fakeData.push({
            state: state,
            year: year,
            metric: metric,
            data: Math.floor(Math.random() * 10000) + 1000, // Random data between 1000 and 11000
        });
      }
    }
}

sortData = fakeData.filter(d => d.year === 2023 && d.metric === 'speedFines').sort((a, b) => b.data - a.data);

console.log(sortData);

drawMapAndBar('#australia-map', sortData);