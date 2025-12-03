
d3.select('#D3andME')
    .selectAll('p')
    .data([1, 2, 3])
    .join('p')
    .style('color', 'blue')
    .text(d => d);


