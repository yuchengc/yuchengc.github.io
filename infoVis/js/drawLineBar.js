
var GLOBAL_FILTERED_YEAR_LARGER_THAN = 1990
var xScale
var yScale_left
var yScale_right
let wastingData=[]
let stuntingData=[]
let weightData=[]
let mortalityData=[]
let undernourishmentData=[]
let povertyData=[]
let gdpData=[]
var GLOBAL_COUNTRY = 'Djibouti';
var YEAR = 1992;
// console.log("drawLineBar")
// let GLOBAL_YEAR=1995
// let GLOBAL_REGION='SSAfrican'


// let SSAfricanCountries = ["Angola","Benin","Botswana","Burkina Faso","Burundi","Cameroon","Cape Verde","Central African Republic","Chad","Comoros","Congo","Djibouti","Equatorial Guinea","Eritrea","Ethiopia","Gabon","Gambia","Ghana","Guinea","Guinea-Bissau","Ivory Coast","Kenya","Lesotho","Liberia","Madagascar","Malawi","Mali","Mauritania","Mauritius","Mayotte","Mozambique","Namibia","Niger","Nigeria","Rwanda","Sao Tome and Principe","Senegal","Seychelles","Sierra Leone","Somalia","South Africa","South Sudan","St. Helena","Sudan","Swaziland","Tanzania","Togo","Uganda","Zambia","Zimbabwe"]
// let SAsiaCountries=["Afghanistan","Bangladesh","Bhutan","India","Maldives","Nepal","Pakistan","Sri Lanka"]

var margin = { top: 70, right: 30, bottom: 35, left: 30 },
    width =  $(window).width() * 0.8 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("#bar-and-line-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', "translate(" + margin.left + "," + margin.top + ")")


$(document).ready(function () {
    //150 countries
        d3.csv(`data/Undernourishment.csv`, function(d) {
            buildFinalFilter(d, GLOBAL_COUNTRY);
        })
        loadLineBarData(YEAR, GLOBAL_COUNTRY);
        // loadData();
    //169 countries
        // d3.csv(`assets/data/Underweight.csv`, function(d) {
        //     buildFinalFilter(d);
        // })
        // d3.csv(`assets/data/Stunting.csv`, function(d) {
        //     buildFinalFilter(d);
        // })
        // d3.csv(`assets/data/Wasting.csv`, function(d) {
        //     buildFinalFilter(d);
        // })

    //204 countries
        // d3.csv(`assets/data/Mortality.csv`, function(d) {
        //     buildFinalFilter(d);
        // })

    //264 countries
        // d3.csv(`assets/data/GDP.csv`, function(d) {
        //     buildFinalFilter(d);
        // })
});



function linearRegression(x, y)
{
    var xs = 0;  // sum(x)
    var ys = 0;  // sum(y)
    var xxs = 0; // sum(x*x)
    var xys = 0; // sum(x*y)
    var yys = 0; // sum(y*y)

    var n = 0;
    for (; n < x.length && n < y.length; n++)
    {
        xs += x[n];
        ys += y[n];
        xxs += x[n] * x[n];
        xys += x[n] * y[n];
        yys += y[n] * y[n];
    }

    var div = n * xxs - xs * xs;
    var gain = (n * xys - xs * ys) / div;
    var offset = (ys * xxs - xs * xys) / div;
    var correlation = Math.abs((xys * n - xs * ys) / Math.sqrt((xxs * n - xs * xs) * (yys * n - ys * ys)));

    return { gain: gain, offset: offset, correlation: correlation };
}

const simulateBarLineData=(data)=>{
	let keys=Object.keys(data[0])
	let countryName=[]


	data.forEach((i)=>{
		// if(i.Regin == 'SSAfrican' || i.Regin == 'SAsia'){
			if (!countryName.includes(i.Entity)){
				countryName.push(i.Entity)
			}
		// }
	})
    // console.log(data)



	let simulatedAddon=[]
	countryName.forEach((cty)=>{
		let singleCountry=data.filter((item)=>{

			return item.Entity===cty
		})
		let yearsIncluded=[]
		singleCountry.forEach((sc)=>{
			if (!yearsIncluded.includes(sc.Year)){
				yearsIncluded.push(sc.Year)
			}
		})

		let yearIncludedData=yearsIncluded.map((yr)=>{
			return singleCountry.filter((d)=>{return d.Year===yr})[0][keys[3]]
		})


		let linearRegressionR=linearRegression(yearsIncluded,yearIncludedData)
		for (let y=1991;y<=2017;y++){
			if(!yearsIncluded.includes(y)){

				let outputTemp={}
				outputTemp[keys[0]]=singleCountry[0][keys[0]]
				outputTemp[keys[1]]=singleCountry[0][keys[1]]
				outputTemp["Year"]=y
				outputTemp["Predict"]=true
				outputTemp[keys[5]]=singleCountry[0][keys[5]]
				outputTemp[keys[3]]=y * linearRegressionR.gain + linearRegressionR.offset
				singleCountry.push(outputTemp)
			}
		}
		simulatedAddon.push(...singleCountry)
	})

	return simulatedAddon
}

const loadLineBarData=(selectedYear, selectedCountry = GLOBAL_COUNTRY)=> {
	var line_bar_urls =  ['Stunting','Underweight','Wasting','Mortality','Undernourishment','Poverty','GDP'],
      urls_for_economy = ['Poverty','GDP'];

	Promise.all(
	  line_bar_urls.map(fileName => new Promise((resolve,reject)=>{
                if(!(urls_for_economy.includes(fileName))){
                    d3.csv(`data/${fileName}.csv`, function(d) {
                        let tempdata= d;
                        tempdata.forEach(function (item) {
                            item.Entity = item.Entity;
                            if(SSAfricanCountries.includes(item.Entity)){
                                item.Regin = 'SSAfrican';
                            }else if (SAsiaCountries.includes(item.Entity)){
                                item.Regin = 'SAsia';
                            }else{
                                item.Regin = 'Other'
                            }
                            item.Code = item.Code;
                            item.Year = parseInt(item.Year);

                            item[fileName] = parseFloat(item[fileName]);
                            item.Predict = false;
                        });
                        let tempSimulatedData=simulateBarLineData(tempdata)
                        resolve(tempSimulatedData)
		            });
                }else{
                    d3.csv(`data/${fileName}.csv`, function(d) {
                        resolve(d)
                    })
                }
            }))
	).then(
	  function (results) {
        console.log("loaded data")
        updateData(results, selectedCountry)

        //draw
        drawAxis()
        drawBarChart(filterDataByYearByCountry(gdpData,GLOBAL_FILTERED_YEAR_LARGER_THAN, selectedCountry), 'GDP')
        drawLineChart(sortDataByYear(filterDataByYearByCountry(undernourishmentData,GLOBAL_FILTERED_YEAR_LARGER_THAN, selectedCountry)), 'Undernourishment')
        drawLineChart(sortDataByYear(filterDataByYearByCountry(stuntingData,GLOBAL_FILTERED_YEAR_LARGER_THAN, selectedCountry)), 'Stunting')
        drawLineChart(sortDataByYear(filterDataByYearByCountry(wastingData,GLOBAL_FILTERED_YEAR_LARGER_THAN, selectedCountry)), 'Wasting')
        drawLineChart(sortDataByYear(filterDataByYearByCountry(mortalityData,GLOBAL_FILTERED_YEAR_LARGER_THAN, selectedCountry)), 'Mortality')
        //drawLineChart(sortDataByYear(filterDataByYearByCountry(weightData,GLOBAL_FILTERED_YEAR_LARGER_THAN, selectedCountry)), 'Underweight')

        drawYearLine(selectedYear)
        addFilterControl()
	  }
	)
	.catch(
	  err=>console.warn("Something went wrong:",err)
	)
}

const groupDataByCountry = (dataSet) => {
    return groupedData = d3.nest()
                        .key(d=>d.Entity)
                        .object(dataSet);
}

const filterDataByYearByCountry = (dataSet, year, country) => {
    return filteredData = dataSet.filter(d=> d.Year>=year && d.Entity===country)
}

const updateData = (results, selectedCountry) =>{
    stuntingData=results[0]
    weightData=results[1]
    wastingData=results[2]
    mortalityData=results[3]
    undernourishmentData=results[4]
    povertyData=results[5]
    gdpData=processGDPdata(results[6])

    xScale = d3.scaleBand()
        .domain(filterDataByYearByCountry(gdpData,GLOBAL_FILTERED_YEAR_LARGER_THAN, selectedCountry).map((d)=>d.Year))
        .rangeRound([0, width])
        .padding(0.1);

    yScale_left = d3.scaleLinear()
        .domain([0, d3.max(filterDataByYearByCountry(gdpData,GLOBAL_FILTERED_YEAR_LARGER_THAN, selectedCountry), function (d) { return parseInt(d.GDP)})])
        .rangeRound([height, 0]);

    yScale_right = d3.scaleLinear()
        .domain([0, d3.max(filterDataByYearByCountry(stuntingData,GLOBAL_FILTERED_YEAR_LARGER_THAN, selectedCountry), function (d) { return parseInt(d.Stunting)})])
        .rangeRound([height, 0]);
}

const processGDPdata=(dataset)=>{
    processedData = []
    dataset.forEach(d=>{
        for(i=1990;i<2018;i++){
            processedData.push({
                "Entity": d.Entity,
                "Year":i,
                "GDP": d[i]
            })
        }
    })
    return processedData
}

const sortDataByYear=(data) =>{
    let sortedData = data.sort(function(a, b) {
                        return a.Year - b.Year;
                    });

    return sortedData
}

drawAxis = () =>{
    d3.selectAll('.line_bar_axis').remove();

    //x-axis
     svg.append("g")
        .attr('class', 'line_bar_axis')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    //y-left-axis
    svg.append("g")
       .attr('class', 'line_bar_axis')
       .call(d3.axisLeft(yScale_left).ticks(5).tickFormat(d3.format(".2s")))


    //y-right-axis
    svg.append("g")
       .attr('class', 'line_bar_axis')
       .attr("transform", "translate( " + width + ", 0 )")
       .call(d3.axisRight(yScale_right).ticks(5).tickFormat(d=>d+'%'))

}

drawBarChart = (dataset, type) => {
    d3.selectAll('.bar').remove();

    var bar = svg.selectAll('rect')
                .data(dataset)
                .enter()
                .append('g')

    bar.append('rect')
        .attr('class', 'bar')
        .attr('x', d=>xScale(d.Year)+xScale.bandwidth()*0.1)
        .attr('y', d=>height)
        .attr('width', xScale.bandwidth()*0.8)
        .attr('height', 0)
        .merge(bar)
        .transition()
        .duration(500)
        .attr('height', d=>height-yScale_left(d[type]))
        .attr('y', d=>yScale_left(d[type]))


    bar.exit().remove()

}


drawLineChart = (dataset, type) => {
    d3.select('#' + `${type}-line`).remove();

    let line = d3.line()
                .x(d=>xScale(d.Year)+ xScale.bandwidth()/2)
                .y(d=>yScale_right(d[type]))
                .curve(d3.curveCatmullRom)

    let path = svg.append('path')
                .datum(dataset)
                .attr('class', 'line')
                .attr('id', `${type}-line`)
                .attr('d', line)
                .style('stroke', colorScale(type))
                .style('stroke-width', 2)
                .attr('fill', 'none')

    let totalLength = path.node().getTotalLength();

    path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0)

}

const colorScale = (type) =>{
     switch (type){
        case 'Undernourishment':
            return '#BF4158'
        case 'Stunting':
            return '#95AB5B'
        case 'Wasting':
            return '#FFC321'
        case 'Mortality':
            return '#6DBFF2'
        case 'Underweight':
            return '#B8E986'
        default:
            return '#00000'
    }
}

const drawYearLine = (year) =>{
    // console.log(year)
    d3.select('.dash-line').remove()
    svg.append('line')
        .attr('class', 'dash-line')
        .attr('x1', xScale(year) + xScale.bandwidth()/2)
        .attr('y1', -10)
        .attr('x2', xScale(year) + xScale.bandwidth()/2)
        .attr('y2', height)
        .style('stroke', '#7F7F7F')
        .style('stroke-width', 1)
        .style('stroke-dasharray','3 2')
}

const buildFinalFilter= (data, country) => {
    var finalDropdown = document.querySelector("#myFinaldropdown");


    // console.log(finalDropdown.children)
    while(finalDropdown.firstChild){
        finalDropdown.removeChild(finalDropdown.firstChild);
    }


    let countryName=[];

	data.forEach((i)=>{
		if (!countryName.includes(i.Entity)){
			countryName.push(i.Entity)
		}
	})

    countryName.forEach((cty) => {
        let countryOption = document.createElement("OPTION");
        countryOption.innerHTML = cty;
        countryOption.setAttribute("value", cty);

        if(cty === country){
            countryOption.setAttribute("selected", "selected")
        }

        finalDropdown.appendChild(countryOption);
    })

    finalDropdown.addEventListener("change", function() {
        let selectedCountryName = $(this).val();
        loadLineBarData(YEAR, selectedCountryName);
    })

}

const addFilterControl=()=>{
    let filterBtns = document.querySelectorAll(".filterBtn");
    filterBtns.forEach(btn=>{
        btn.addEventListener('click', ()=>{
            btn.classList.toggle("clicked-btn")
            let btnName = btn.innerText
            let line = document.querySelector(`#${btnName}-line`)
            line.classList.toggle("line-disappear")
        })
    })
}
