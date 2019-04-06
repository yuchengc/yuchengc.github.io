
// The svg
var svgMap = d3.select("#svgMap"),
    width = +svgMap.attr("width"),
    height = +svgMap.attr("height");

// Map and projection
var path = d3.geoPath();
var projection = d3.geoNaturalEarth()
    .scale(width / 2 / Math.PI)
    .translate([width / 2, height / 2])
var path = d3.geoPath()
    .projection(projection);

// Data and color scale
var dataMap = d3.map();
var colorScheme = d3.schemeReds[6];
colorScheme.unshift("#eee")
// var colorScale = d3.scaleThreshold()
//     .domain([1, 6, 11, 26, 101, 1001])
//     .range(colorScheme);
let svgFrame=document.querySelector("#globalMap")
let svgOffsetY=svgFrame.offsetTop;
let svgOffsetX=svgFrame.offsetLeft;
console.log("svgOffsetX,svgOffsetY",svgOffsetX,svgOffsetY)
// Legend
// var g = svg.append("g")
//     .attr("class", "legendThreshold")
//     .attr("transform", "translate(20,20)");
// g.append("text")
//     .attr("class", "caption")
//     .attr("x", 0)
//     .attr("y", -6)
//     .text("Students");
// var labels = ['0', '1-5', '6-10', '11-25', '26-100', '101-1000', '> 1000'];
// var legend = d3.legendColor()
//     .labels(function (d) { return labels[d.i]; })
//     .shapePadding(4)
//     .scale(colorScale);
// svg.select(".legendThreshold")
//     .call(legend);

// Load external data and boot
d3.queue()
    .defer(d3.json, "http://enjalot.github.io/wwsd/data/world/world-110m.geojson")
    // .defer(d3.csv, "mooc-countries.csv", function(d) { data.set(d.code, +d.total); })
    .await(ready);

function ready(error, topo) {
    if (error) throw error;

    // Draw the map
    svgMap.append("g")
        .attr("class", "countries")
        .attr("transform","scale(1.3,1.3) translate(-180, 0)" )
        .selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
        .attr("fill", '#522737'

        )
        .attr("d", path);

    loadMapData();

}

function visulizeCountryDots(mydata){
      var locations = mydata

      var hue = 0;

      var g = svgMap.append("g")
                    .attr("id", "countryDots")
                    .attr("transform","scale(1.3,1.3) translate(-180, 0)" )
                    .style("z-index","10");

      // console.log( locations)

      locations.map(function(d) {
        hue += 0.36
        d.color = "#FFB533"
        // d.color = "#E7540D"
        // d.color = 'hsl(' + hue + ', 100%, 50%)';
      });

      g.selectAll('circle')

        .data(locations)
        .enter()
        .append('circle') //show the circles
        .attr('cx', function(d) {
          // console.log(projection([d.Latitude,d.Longtitude]))
          if ( projection([d.Longtitude, d.Latitude])) {
             // console.log([d.Latitude, d.Longtitude])
            return projection([d.Longtitude, d.Latitude])[0];
          }
        })
        .attr('cy', function(d) {
          if (projection([d.Longtitude, d.Latitude])) {

            return projection([d.Longtitude, d.Latitude])[1];
          }
        })
         .attr('r',
          function(d) {
          if (d["Global Hunger Index"]) {
            return Math.pow(parseInt(d["Global Hunger Index"]), 1 /1.5);
          }
        }
        )
        // .attr('r', d["Duration (Seconds)"]/10)
        .style('fill', function(d) {
          return d.color;
        })
         .style('opacity', 0.6)



      //mouseover

        .on('mouseover', function(d) {

          // console.log(d3.select(this).node().cx.baseVal.value)
          // console.log(d["Global Hunger Index"])

          d3.select(this)
            .transition()
            .duration(200)
            .style('fill', 'red');
          d3.select('#country').text(d.Entity);
          d3.select('#ghi').text(d["Global Hunger Index"]);

          d3.select('#mapTooltip')
            .style('left', () => {
              if(d3.event.pageX <= $(window).width()){
                console.log("cx",d3.select(this).node().cx.baseVal.value)
                return (((d3.select(this).node().cx.baseVal.value + svgOffsetX) - 240) * 1.3 ) + 'px';
              } else{
                return (((d3.select(this).node().cx.baseVal.value +svgOffsetX - 160) - 240)  * 1.3) + 'px'
              }
            })
            .style('top', (d3.select(this).node().cy.baseVal.value + svgOffsetY + 30) + 'px')
            .transition()
            .duration(200)
            .style('opacity', 0.8);
        })

        //Add Event Listeners | mouseout
        .on('mouseout', function(d) {
          d3.select(this)
            .transition()
            .duration(100)
            .style('fill', d.color);
          d3.select('#mapTooltip')
            .transition()
            .duration(100)
            .style('opacity', 0)
        });
}

function loadMapData(){
    d3.json('data/map.json', function(error, data) {
        if (error) console.error(error);

        loadedMapData = data
        // console.log(loadedMapData)

        filteredItem = loadedMapData.filter(function (d) {
              if (d.Year==1992) {return d}
        })

        visulizeCountryDots(filteredItem);

    })
}
// $(document).ready(function() {
//   loadMapData();
// });
