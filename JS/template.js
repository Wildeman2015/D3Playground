    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", 500)
        .attr("height", 300)
        .attr("class", "chart");

    svg.append("circle")
        .attr("cx", 250)
        .attr("cy", 150)
        .attr("r", 50)
        .attr("fill", "steelblue");