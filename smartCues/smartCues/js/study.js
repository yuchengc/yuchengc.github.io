var count = 0;
var data = null;
var log = [];
var participantId = "default";
$(document).ready(function () {
    $(".container").height($(window).height());
    $("#Vis").height($(window).height() - $("#Question").height() - $("#Title").height() - $("#Action").height() - 100);
    d3.csv("studydata/coffee.csv" ,function(d){
        data = d;
    });
});


questions = {
    "1": "1. How many units of Coffee did <span class='hqtext'>Washington (WA)</span> sell?",
    "2": "2. Among all states, what is <span class='hqtext'>Washington's(WA) rank</span> in terms of sales?",
    "3": "3. Which <span class='hqtext'>three</span> states have the <span class='hqtext'>highest</span> coffee sales ?",
    "4": "4. Which <span class='hqtext'>three</span> states have the <span class='hqtext'>lowest</span> sales?",
    "5": "5. How many states sold <span class='hqtext'>more than 40,000 </span> units of coffee?",
    "6": "6. What is the <span class='hqtext'>average</span> coffee sales across all states?",
    "7": "7. What is the <span class='hqtext'>difference<span/> in Sales between <span class='hqtext'>Decaf Espresso</span> and <span class='hqtext'>Regular Espresso</span>?",
    "8": "8. What is the total <span class='hqtext'>difference<span/> in sales between the <span class='hqtext'>highest selling product</span> and the <span class='hqtext'>lowest selling product</span>?",
    "9": "9. How many products have <span class='hqtext'>higher sales</span> when compared to <span class='hqtext'>Chamomile</span>, and how many have lower sales?",
    "10": "10. What is the <span class='hqtext'>difference</span> in sales between <span class='hqtext'>West</span> and <span class='hqtext'>all other regions</span>?",
    "11": "11. How many observations have an <span class='hqtext'>accuracy</span> over 70 ?",
    "12": "12. How many observations are <span class='hqtext'>between 30 - 40</span> on the time axis?",
    "13": "13. How many observations are <span class='hqtext'>between 60 and 70</span> on the time axis ?",
    "14": "14. Which <span class='hqtext'>time interval</span> has the <span class='hqtext'>highest</span> number of observations?",
    "15": "15. Based on the given observations, use linear regression to <span class='hqtext'>predict</span> the value of profit when <span class='hqtext'>sales = 50</span>",
    "16": "16. Which month has the <span class='hqtext'>highest profit</span>, and what is the value?",
    "17": "17. For the month with the <span class='hqtext'>highest drop in profit</span>, by how much did the profit <span class='hqtext'>decrease</span>?",
    "18": "18. Which two months have the <span class='hqtext'>highest increase</span> in profit when compared to previous months ? By what percentage did the profit increase?",
    "19": "19. How many months have <span class='hqtext'>above 70% profit</span> ?",
    "20": "20. What is the net <span class='hqtext'>change</span> in profit between June and August ?",
    "21": "Thank you. You have completed all tasks for this study.<br/><br/> Please <a target='_blank' href='https://goo.gl/forms/UzGcldrJ3MudfIkl2'>Click here</a> to fill out a post test questionnaire."
}


function btnNextClick() {
    if (count == 0) {
        participantId = $("#pid").val();
    }

    if (count == 21) {
        return;
    }
    count++;
    log.push({ "message": "-------TASK" + count + "-----------", "timestamp" : Date.now()});
    // refresh question
    $("#Question").empty();
    $("#Question").append("<h5 style='font-weight:500;'>" + questions[count.toString()] + "</h5>");
    $("#Vis").height($(window).height() - $("#Question").height() - $("#Title").height() - $("#Action").height() - 100);
    //update dataset if necessary
    switch (count) {
        case 1:          
            drawBarChart("State", "Sales", "Coffee Sales across different States in the US");
            break;
        case 7:
            drawBarChart("Product", "Sales", "Coffee Sales across different States in the US");
            break;
        case 10:
            drawBarChart("Region", "Sales", "Coffee Sales across different States in the US");
            break;
        case 11:
            drawScatterPlot("scattertasks.csv", "Time", "Accuracy", "Relationship between x and y");
            break;
        case 15:
            drawScatterPlot("regression.csv", "Sales", "Profit", "Relationship between x and y");
            break;
        case 16:
            drawLineChart();
            break;
        case 21:
            $("#Vis").empty();
            downloadCSV()
        default:
            break;
    }
}

function downloadCSV() {
    var csvContent = "data:text/csv;charset=utf-8,";
    log.forEach(function (response, index) {
        var infoArray = [];
        infoArray.push(response.message);
        infoArray.push(response.timestamp.toString());       
        dataString = infoArray.join(",");
        csvContent += index < log.length ? dataString + "\n" : dataString;
    });
    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri, participantId + ".csv");
}

function drawBarChart(x_label, y_label, title) {
    $("#Vis").empty();
    if (data == null)
    {
        return;
    }

    barData = d3.nest()
                  .key(function (d) { return d[x_label]; })
                  .rollup(function (v) { return d3.sum(v, function (d) { return d[y_label]; }); })
                  .entries(data);

    var margin = { top: 100, right: 200, bottom: 100, left: 70 },
                        width = $("#Vis").width() - margin.left - margin.right,
                        height = $("#Vis").height() - margin.top - margin.bottom;

    var x = d3.scaleBand().padding(0.2)
.domain(barData.map(function (d) { return d.key; }))
.rangeRound([0, width - 20], .1);
    var y = d3.scaleLinear()
        .domain([0, d3.max(barData, function (d) { return d.value; }) + 0.2])
        .range([height, 0]);

    var xAxis = d3.axisBottom(x);

    var yAxis = d3.axisLeft(y).ticks(10);

    var svg = d3.select("#Vis").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis)
       .selectAll("text")
       .style("text-anchor", "end")
       .attr("dx", "-.8em")
       .attr("dy", "-.55em")
       .attr("transform", "rotate(-50)");

    svg.append("g")
       .attr("class", "y axis")
       .call(yAxis)
       .append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 6)
       .attr("dy", ".71em")
       .style("text-anchor", "end")
       .text(y_label);

    svg.selectAll(".bar")
        .data(barData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function (d) { return x(d.key); })
        .attr("width", x.bandwidth())
        .attr("y", function (d) { return y(d.value); })
        .attr("height", function (d) { return height - y(d.value); })
        .style("fill", "steelblue");

    var barAnnotator = d3.annotator.touches('bar')
                        .attr("label", "key")
                        .attr("value", "value")
                        .attr("log",log)
                        .attr("autoClear", false);

    barAnnotator.settings('Diff', { style: { 'unit': 'units', "rounding": 2 } });
    barAnnotator.settings('Value', { measure: "Value Rank", style: { 'unit': ' units' } });

    svg.call(barAnnotator);
}

function drawScatterPlot(datafile, x_label, y_label, title) {
    $("#Vis").empty();
    d3.csv("studydata/" + datafile,
               function (dat) {
                   data = dat;
                   data.forEach(function (item) {
                       item.x = +item[x_label];
                       item.y = +item[y_label];
                   });
                  
                   var margin = { top: 100, right: 200, bottom: 100, left: 70 },
                       width = $("#Vis").width() - margin.left - margin.right,
                       height = $("#Vis").height() - margin.top - margin.bottom;

                   var x = d3.scaleLinear()
            .domain([0, d3.max(data, function (da) { return da.x; })]).nice()
            .range([0, width]);
                   var y = d3.scaleLinear()
                       .domain([0, d3.max(data, function (da) { return da.y; })]).nice()
                       .range([height, 0]);

                   var xAxis = d3.axisBottom(x);

                   var yAxis = d3.axisLeft(y);

                   var svg = d3.select("#Vis")
                       .append("svg")
                       .attr("width", width + margin.left + margin.right)
                       .attr("height", height + margin.top + margin.bottom)
                       .append("g")
                       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                   svg.append("g")
                       .attr("class", "x axis")
                       .attr("transform", "translate(0," + height + ")")
                       .call(xAxis)
                       .append("text")
                       .attr("class", "label")
                       .attr("x", width)
                       .attr("y", -6)
                       .style("text-anchor", "end")
                       .text(x_label);

                   svg.append("g")
                       .attr("class", "y axis")
                       .call(yAxis)
                       .append("text")
                       .attr("transform", "rotate(-90)")
                       .attr("y", 6)
                       .attr("dy", ".71em")
                       .style("text-anchor", "end")
                       .text(y_label);

                   svg.selectAll(".dot")
                       .data(data)
                       .enter()
                       .append("circle")
                       .attr("class", "dot")
                       .attr("r", 5)
                       .attr("cx", function (d) { return x(d.x); })
                       .attr("cy", function (d) { return y(d.y); })
                       .style("fill", "steelblue")
                       .style("stroke", "black")
                       .style("stroke-thickness", "0.5");


                   var scatterAnnotator = d3.annotator.touches('scatter')
                      .attr("value", y_label)
                      .attr("label", x_label)
                   .attr("log", log);

                   scatterAnnotator.settings('Regress', { style: { "rounding": 2 } });

                   svg.call(scatterAnnotator);

               });
}

function drawLineChart() {
    $("#Vis").empty();
    data = [{ "Month": "Jan", "Value": 24 },
                   { "Month": "Feb", "Value": 27 },
                   { "Month": "March", "Value": 35 },
                   { "Month": "April", "Value": 19 },
                   { "Month": "May", "Value": 60 },
                   { "Month": "June", "Value": 43 },
                   { "Month": "July", "Value": 54 },
                   { "Month": "August", "Value": 78 },
                   { "Month": "Sept", "Value": 21 },
                   { "Month": "Oct", "Value": 51 },
                   { "Month": "Nov", "Value": 92 },
                   { "Month": "Dec", "Value": 85 }];
    var margin = { top: 100, right: 200, bottom: 100, left: 70 },
                        width = $("#Vis").width() - margin.left - margin.right,
                        height = $("#Vis").height() - margin.top - margin.bottom;

    var x = d3.scaleBand().padding(0.2)
 .domain(data.map(function (d) { return d.Month; }))
 .rangeRound([0, width - 20], .1);
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.Value; }) + 0.2])
        .range([height, 0]);

    var xAxis = d3.axisBottom(x);

    var yAxis = d3.axisLeft(y).ticks(20);

    var svg = d3.select("#Vis").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis)
       .selectAll("text")
       .style("text-anchor", "end")
       .attr("dx", "-.8em")
       .attr("dy", "-.55em")
       .attr("transform", "rotate(-90)");

    svg.append("g")
       .attr("class", "y axis")
       .call(yAxis)
       .append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 6)
       .attr("dy", ".71em")
       .style("text-anchor", "end")
       .text("Profit (%)");

    var lineFunc = d3.line()
        .x(function (d) {
            return x(d.Month) + x.bandwidth()/2;
        })
        .y(function (d) {
            return y(d.Value);
        });

    svg.append('path')
        .data([data]) // NEED TO REFACTOR THIS LATER
        .attr('d', lineFunc(data))
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 3)
        .attr('fill', 'none');

    var lineAnnotator = d3.annotator.touches('line')
         .attr("value", "Value")
         .attr("label", "Month")
    .attr("log", log);

    svg.call(lineAnnotator);

}




