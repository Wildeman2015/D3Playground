const covidDataURL = '../Data/covidDeaths.csv'

const collectTheDead = (deadYear) => {
  if (typeof deadYear !== 'number') {
    console.log('A specific year must be called.');
    return Promise.reject('Invalid year');
  }

  return fetch('../Data/covidDeaths.csv')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      const dataRows = data.split('\r\n');
      const annualDead = dataRows.filter(row => row.split(',')[0] == deadYear);
      const tbDead = annualDead.map((record) => record.split(','))

      return tbDead;
    });
};

//let's make a button

let test_timer = 1;

let myLabel = document.getElementById('clock_count');

let myButton = document.getElementById('clock_start');

myLabel.textContent = `Counter is set to ${test_timer}`;

myButton.addEventListener('click', () => {
  if (test_timer < 12) {
    test_timer++;
  } else if (test_timer === 12) {
    test_timer = 1
  };
  
  myLabel.textContent = `Counter is set to ${test_timer}`;
  }
)


let test_switch_value = false;

let switchLabel = document.getElementById('switch_label');

let switchButton = document.getElementById('ze_switch');

switchLabel.textContent = `Ze switch is ${(test_switch_value ? 'on' : 'off')}`

switchButton.addEventListener('click', () => {
  test_switch_value = !test_switch_value;
  switchLabel.textContent = `Ze switch is ${(test_switch_value ? 'on' : 'off')}`;
  !test_switch_value ? window.circleToBars() : window.barsToCircle();
});

let sqaureLayout = document.getElementById('squareChartContainer')
let roundLayout = document.getElementById('roundChartContainer')
let comboLayout = document.getElementById('comboChartContainer')

let testMargins = [];
let testWidth = 0;
let testHeight = 0;

const frameWork = () => {
    testMargins = {top: 10, right: 10, bottom: 10, left: 10};
    testWidth = sqaureLayout.clientWidth - testMargins.left - testMargins.right;
    testHeight = sqaureLayout.clientHeight - testMargins.top - testMargins.bottom;
}

//so far it looks like all the data manipulation needs to happen INSIDE this function
async function init() {
  const year0Covid = await collectTheDead(2020);

  // now the data is safe to use

frameWork();

//first we'll dynamically generate a bar chart
//this part adds an svg container
const svg = d3.select("#squareChartContainer")
    .append("svg")
    .attr("width", testWidth + testMargins.left + testMargins.right)
    .attr("height", testHeight + testMargins.top + testMargins.bottom)
    .append("g")
    .attr("transform", `translate(${testMargins.left},${testMargins.top})`);

//then we define scales
    const x = d3.scaleBand()
        .range([0, testWidth])
        .padding(0.1)
        .domain(year0Covid.map(d => d[1]));

    const y = d3.scaleLinear()
        .range([testHeight, 0])
        .domain([0, d3.max(year0Covid, d => d[2])]);

//this is where the data is actually linked to the drawing
    svg.selectAll(".bar")
        .data(year0Covid)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d[1]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[2]))
        .attr("height", d => testHeight - y(d[2]));


//a radial chart is harder. we have to calculate a bunch of stuff manually

const roundBounds = roundLayout.getBoundingClientRect();
const roundDiameter = Math.min(roundBounds.width, roundBounds.height);

const polarRadius = roundDiameter/2;
const polarDepth = roundDiameter/10;
const outerSVGDiameter = roundDiameter + polarDepth * 2

//this connects the svg to the pseudo element in the middle of our actual element
const arcSVG = d3.select("#roundChartContainer")
    .append("svg")
    .style("position", "absolute")
    .style("overflow", "visible")
    .style("left", "50%")
    .style("top", "50%")
    .style("transform", "translate(-50%, -50%)")
    .attr("width", outerSVGDiameter)
    .attr("height", outerSVGDiameter)
    .append("g")
    .attr("transform", `translate(${outerSVGDiameter/2},${outerSVGDiameter/2})`);

//then we define scales
    const angle = d3.scaleBand()
      .range([0, 2 * Math.PI])
      .domain(year0Covid.map(d => d[1]))
      .padding(0.1);   

    const r = d3.scaleLinear()
      .range([polarRadius, polarRadius + polarDepth])
      .domain([0, d3.max(year0Covid, d => d[2])]);

//this is where the data is actually linked to the drawing
arcSVG.selectAll("path")
        .data(year0Covid)
        .enter().append("path")
        .attr('fill','steelblue')
        .attr("d", d3.arc()
          .innerRadius(polarRadius)
          .outerRadius(d => r(d[2]))
          .startAngle(d => angle(d[1]))
          .endAngle(d => angle(d[1]) + angle.bandwidth())
        );


        
//now we're going to make a single svg that morphs from one shape to the other when the user flips the switch
const comboSVG = d3.select("#comboChartContainer")
    .append("svg")
    .style("position", "absolute")
    .style("overflow", "visible")
    .style("left", "50%")
    .style("top", "50%")
    .style("transform", "translate(-50%, -50%)")
    .attr("width", outerSVGDiameter)
    .attr("height", outerSVGDiameter)
    .append("g")
    .attr("transform", `translate(${outerSVGDiameter/2},${outerSVGDiameter/2})`);

/*
const cartesianG = comboSVG.append("g")
  .attr("class", "cartesian-layer")
  .attr("transform", `translate(${-testWidth/2}, ${testHeight/2})`);
*/
  
//we need to define two sets of scales for two orthographies
//first the radial scales
const combo_angle = d3.scaleBand()
      .range([2 * Math.PI,0])
      .domain(year0Covid.map(d => d[1]))
      .padding(0.1);   

const combo_r = d3.scaleLinear()
      .range([polarRadius, polarRadius + polarDepth])
      .domain([0, d3.max(year0Covid, d => d[2])]);

//then the cartesian scales
const combo_x = d3.scaleBand()
  .range([0, testWidth])
  .padding(0.1)
  .domain(year0Covid.map(d => d[1]));

const combo_y = d3.scaleLinear()
  .range([0, testHeight])  // 0 at bottom, testHeight at top
  .domain([0, d3.max(year0Covid, d => d[2])]);

function cartesianPath(d) {
  const w = combo_x.bandwidth();
  const x0 = combo_x(d[1]) - testWidth/2;  // shift left so chart is centered
  const x1 = x0 + w;
  const y0 = 0 + testHeight/2;                          // baseline at bottom
  const y1 = -combo_y(d[2]) + testHeight/2;             // negative because SVG y grows down

  return `
    M ${x0},${y0}
    L ${x0},${y1}
    L ${x1},${y1}
    L ${x1},${y0}
    Z
  `;
}

function cartesianPoints(d) {
  const w = combo_x.bandwidth();
  const x0 = combo_x(d[1]) - testWidth/2; // - testWidth/2;
  const x1 = x0 + w;
  const y0 = 0 + testHeight/2;
  const y1 = -combo_y(d[2]) + testHeight/2;

  return [
    [x0, y0],
    [x0, y1],
    [x1, y1],
    [x1, y0],
    [x0, y0],
  ];
  
}


function radialPoints(d) {
  const r0 = polarRadius;
  const r1 = combo_r(d[2]);
  const a0 = combo_angle(d[1]);
  const a1 = a0 + combo_angle.bandwidth();

  return [
    toXY(r0, a0), // A inner start
    toXY(r1, a0), // B outer start
    toXY(r1, a1), // C outer end
    toXY(r0, a1), // D inner end
    toXY(r0, a0), // A again
  ];
}

function toXY(r, angle) {
  return [ r * Math.cos(angle - Math.PI/2), 
           r * Math.sin(angle - Math.PI/2) ];
}

function pointsToPath(pts) {
  const p = d3.path();
  p.moveTo(...pts[0]);
  pts.slice(1).forEach(pt => p.lineTo(...pt));
  p.closePath();
  return p.toString();
}

/*
const radialArc = d3.arc()
  .innerRadius(polarRadius)
  .outerRadius(d => combo_r(d[2]))
  .startAngle(d => combo_angle(d[1]))
  .endAngle(d => combo_angle(d[1]) + combo_angle.bandwidth());
*/

//const comboPaths = cartesianG.selectAll("path")
const bars = comboSVG.selectAll("rect")
  .data(year0Covid)
  .enter()
    .append("rect")
    .attr("x", d => combo_x(d[1]) - testWidth/2)
    .attr("y", d => -combo_y(d[2]) + testHeight/2)
    .attr("width", combo_x.bandwidth())
    .attr("height", d => combo_y(d[2]))
    .attr("fill", "steelblue")
    //.attr("d", cartesianPath);


function collapseBars() {
  return new Promise(resolve => {
    bars.transition().duration(1500)
      .attr("y", testHeight/2)
      .attr("height", 4)
      .filter((d, i, nodes) => i === nodes.length - 1)
      .on("end", resolve)
  
  d3.select(".y-axis").transition().duration(500).style("opacity", 0);
  });
}

function expandBars() {
  return new Promise(resolve => {
    bars.transition().duration(1500)
      .attr("y", d => -combo_y(d[2]) + testHeight/2)
      .attr("height", d => combo_y(d[2]))
      .filter((d, i, nodes) => i === nodes.length - 1)
      .on("end", resolve)
  
  d3.select(".y-axis").transition().duration(500).style("opacity", 1);
  });
}

function collapseToPoints () {
  bars.transition().duration(1500)
    .style("opacity",0)
    .attr("width", 0)
    .attr("x", d => combo_x(d[1]) - testWidth/2 + combo_x.bandwidth() / 2)
    .remove();

  comboSVG.selectAll(".point")
    .data(year0Covid)
    .enter()
    .append("circle")
    .attr("class", "point")
    .attr("cx", d => combo_x(d[1]) - testWidth/2 + combo_x.bandwidth() / 2)
    .attr("cy", testHeight/2)
    .attr("r",0)
    .transition().duration(1000)
    .attr("r",3);
}

function pointsToBars () {
  return new Promise( resolve => {
    comboSVG.selectAll("rect")

  })
}

window.updateComboChart = function () {
  comboPaths.transition().duration(2000)
    .attrTween("d", function(d) {
      const start = test_switch_value ? cartesianPoints(d) : radialPoints(d);
      const end   = test_switch_value ? radialPoints(d) : cartesianPoints(d);

      const interp = d3.interpolateArray(start, end);

      return t => pointsToPath(interp(t));
    });
};

window.barsToCircle = async function () {
  //to transition the chart from bar to circle,
  
  //collapse the bars to lines
  await collapseBars();

  //collapse the lines into points
  collapseToPoints();

  //fly the points to the x axis of the radial chart

  //replace the points with arcs

  //expand the arcs into pie slices
};

window.circleToBars = async function () {
  //to transition the circle to a bar chart,

  //collapse the pie slices to arcs

  //collapse the arcs to points

  //fly the points to the bar chart x axis

  //expand the points out to lines

  //grow the lines into bars
  expandBars();
}
};

init();