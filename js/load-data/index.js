const fakeData = []
for (let year = 2018; year <= 2023; year++) {
    for (let state of ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']) {
        fakeData.push({
            state: state,
            year: year,
            speedFines: Math.floor(Math.random() * 10000),
            mobileFines: Math.floor(Math.random() * 5000),
            noSeatbeltFines: Math.floor(Math.random() * 2000),
            unlicensedFines: Math.floor(Math.random() * 1000),
            positiveBreathFines: Math.floor(Math.random() * 3000),
            positiveDrugFines: Math.floor(Math.random() * 2000),
        });
    }
}

console.log(fakeData.filter(d => d.year === 2023));

fakeData.map(d => {
    d.data = d.speedFines
    return d;
});

drawAustraliaMap('#australia-map', fakeData.filter(d => d.year === 2023));