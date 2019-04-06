let tempdata=[]
let groupedWastingD=[]
let groupedStuntingD=[]
let groupedWeightD=[]
let groupedMortalityD=[]
let groupedUndernourishmentD=[]
let GLOBAL_YEAR=1992
let GLOBAL_REGION='SSAfrican'

let SSAfricanCountries = ["Burkina Faso","Burundi","Central African Republic","Djibouti","Guinea","Lesotho","Madagascar","Mali","Mauritania","Niger","Nigeria","Sierra Leone","Zambia"]

//All countries
// let SSAfricanCountries = ["Angola","Benin","Botswana","Burkina Faso","Burundi","Cameroon","Cape Verde","Central African Republic","Chad","Comoros","Congo","Djibouti","Equatorial Guinea","Eritrea","Ethiopia","Gabon","Gambia","Ghana","Guinea","Guinea-Bissau","Ivory Coast","Kenya","Lesotho","Liberia","Madagascar","Malawi","Mali","Mauritania","Mauritius","Mayotte","Mozambique","Namibia","Niger","Nigeria","Rwanda","Sao Tome and Principe","Senegal","Seychelles","Sierra Leone","Somalia","South Africa","South Sudan","St. Helena","Sudan","Swaziland","Tanzania","Togo","Uganda","Zambia","Zimbabwe"]

let SAsiaCountries=["Afghanistan","Bangladesh","Bhutan","India","Maldives","Nepal","Pakistan","Sri Lanka"]

const readCSV=(fileName)=>{
	let groupedtempdata=[]
	d3.csv(`data/${fileName}.csv`, function(d) {         
		tempdata= d;      
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
		
		let tempSimulatedData=simulateData(tempdata)
		// let tempdataFiltered=tempdata.filter((itm)=>{
		//   return parseInt(itm.Year) > 1990;
		// })
		// console.log("stuntingData",stuntingData)     
		groupedtempdata=groupDataByRegin(tempSimulatedData)
		// console.log("groupedStuntingD",fileName,groupedtempdata)
		// callback()

	}); 
	return groupedtempdata

}

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
const simulateData=(data)=>{
	let keys=Object.keys(data[0])
	// console.log("keys",keys)
	let countyName=[]

	data.forEach((i)=>{
		if(i.Regin == 'SSAfrican' || i.Regin == 'SAsia'){
			if (!countyName.includes(i.Entity)){
				countyName.push(i.Entity)
			}
		}
	})
	let simulatedAddon=[]
	countyName.forEach((cty)=>{

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
		// console.log("yearIncludedData",yearIncludedData)
		let linearRegressionR=linearRegression(yearsIncluded,yearIncludedData)

		for (let y=1991;y<=2017;y++){
			// y_minYear=y
			if(!yearsIncluded.includes(y)){

				let outputTemp={}
				outputTemp[keys[0]]=singleCountry[0][keys[0]]
				outputTemp[keys[1]]=singleCountry[0][keys[1]]
				outputTemp["Year"]=y
				outputTemp["Predict"]=true
				outputTemp[keys[5]]=singleCountry[0][keys[5]]
				// outputTemp[keys[3]]=minValue+((y-minYear)*yearGap)
				outputTemp[keys[3]]=y * linearRegressionR.gain + linearRegressionR.offset
				singleCountry.push(outputTemp)
			}
		
		}
		// console.log("singleCountry",singleCountry)
		simulatedAddon.push(...singleCountry)
		// console.log("simulatedAddon",simulatedAddon)
	})
	// console.log("simulatedAddon",simulatedAddon)
	return simulatedAddon

}
const updateRadarData=(results)=>{
	// groupedtempdata=groupDataByRegin(tempSimulatedData)
	groupedStuntingD=groupDataByRegin(results[0])
  	groupedWeightD=groupDataByRegin(results[1])
  	groupedWastingD=groupDataByRegin(results[2])
  	groupedMortalityD=groupDataByRegin(results[3])
  	groupedUndernourishmentD=groupDataByRegin(results[4])
}

const loadData=()=> {
	urls =  ['Stunting','Underweight','Wasting','Mortality','Undernourishment']

	Promise.all(//pass array of promises to Promise.all
	  urls//you have an array of urls
	  .map(//map urls to promises created with parse
	    fileName=>
	      new Promise((resolve,reject)=>{
	      	let groupedtempdata=[]
			d3.csv(`data/${fileName}.csv`, function(d) {         
				tempdata= d;      
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
				
				let tempSimulatedData=simulateData(tempdata)
				   
				// groupedtempdata=groupDataByRegin(tempSimulatedData)
				// console.log("tempdata",fileName,tempdata)
				// console.log("groupedStuntingD",fileName,groupedtempdata)
				
				resolve(tempSimulatedData)
			}); }
	      )
	  )
	)
	.then(
	  function (results) {
	  	updateRadarData(results)
	    drawRadarChart(GLOBAL_YEAR,GLOBAL_REGION)
	    addClickEffect()
	    // setTimeout(console.log("draw"),5000);
	  }
	)
	.catch(//log the error
	  err=>console.warn("Something went wrong:",err)
	)
}


const loadYearData=(year,region)=>{
	let radardata = [{ 
		name: 'Allocated budget',
		axes: [
			{axis: 'Stunting', value: 0},
			{axis: 'Mortality', value: 0},
			{axis: 'Wasting', value: 0},
			{axis: 'Undernourishment', value: 0},
			{axis: 'Underweight', value: 0},
			
		]
	}]
	let reginFocusStuntingD=groupedStuntingD.filter((d)=>{return d.key===region})[0].values.filter((i)=>{return parseInt(i.key)===year})[0].values.map(d=>d.values[0])
	let reginFocusWeightD=groupedWeightD.filter((d)=>{return d.key===region})[0].values.filter((i)=>{return parseInt(i.key)===year})[0].values.map(d=>d.values[0])
	let reginFocusWastingD=groupedWastingD.filter((d)=>{return d.key===region})[0].values.filter((i)=>{return parseInt(i.key)===year})[0].values.map(d=>d.values[0])
	let reginFocusMortalityD=groupedMortalityD.filter((d)=>{return d.key===region})[0].values.filter((i)=>{return parseInt(i.key)===year})[0].values.map(d=>d.values[0])
	let reginFocusUndernourishmentD=groupedUndernourishmentD.filter((d)=>{return d.key===region})[0].values.filter((i)=>{return parseInt(i.key)===year})[0].values.map(d=>d.values[0])

	let countriesST=reginFocusStuntingD.map(d=>d.Entity)
	let countriesUW=reginFocusWeightD.map(d=>d.Entity)
	let countriesWS=reginFocusWastingD.map(d=>d.Entity)
	let countriesM=reginFocusMortalityD.map(d=>d.Entity)
	let countriesUN=reginFocusUndernourishmentD.map(d=>d.Entity)
	let commonElements=[countriesST,countriesUW,countriesWS,countriesM,countriesUN].reduce((accumulator, currentValue)=>{
		return accumulator.filter(function(e) {
		  return currentValue.indexOf(e) > -1;
		});

	})
	radardata=commonElements.map((cntry)=>{
		let countryradarTemp={}
		countryradarTemp.name=cntry
		countryradarTemp.code=reginFocusStuntingD.filter(d=>d.Entity===cntry)[0].Code
		// console.log("reginFocusStuntingD.filter(d=>d.Entity===cntry)[0].values.Stunting",reginFocusStuntingD.filter(d=>d.Entity===cntry)[0].Stunting)
		countryradarTemp.axes=[
			{axis: 'Undernourishment', value: reginFocusUndernourishmentD.filter(d=>d.Entity===cntry)[0].Undernourishment, predict:reginFocusUndernourishmentD.filter(d=>d.Entity===cntry)[0].Predict },
			{axis: 'Stunting', value: reginFocusStuntingD.filter(d=>d.Entity===cntry)[0].Stunting, predict:reginFocusStuntingD.filter(d=>d.Entity===cntry)[0].Predict},
			{axis: 'Underweight', value: reginFocusWeightD.filter(d=>d.Entity===cntry)[0].Underweight, predict:reginFocusWeightD.filter(d=>d.Entity===cntry)[0].Predict},
			{axis: 'Wasting', value: reginFocusWastingD.filter(d=>d.Entity===cntry)[0].Wasting, predict:reginFocusWastingD.filter(d=>d.Entity===cntry)[0].Predict},
			{axis: 'Mortality', value: reginFocusMortalityD.filter(d=>d.Entity===cntry)[0].Mortality, predict:reginFocusMortalityD.filter(d=>d.Entity===cntry)[0].Predict},
			]

		return countryradarTemp

	})
	
	console.log("radardata",radardata)

	return radardata
}


const groupDataByRegin=(inputData)=> {
     //code for Q2 goes here
     var groupedReginData = d3.nest()         
     .key(function (d) { return d.Regin })   
     .key((d)=>d.Year)
     .key((d)=>d.Entity)                
     .entries(inputData);  

     return groupedReginData;
 
}

const drawRadarChart=(yearControl,regionControl)=>{
	var margin = { top: 40, right: 70, bottom: 40, left: 50 },
		width = Math.min(700, window.innerWidth / 4) - margin.left - margin.right,
		height = Math.min(width, window.innerHeight - margin.top - margin.bottom);



	var data = loadYearData(yearControl,regionControl)

	//////////////////////////////////////////////////////////////
	///// Second example /////////////////////////////////////////
	///// Chart legend, custom color, custom unit, etc. //////////
	//////////////////////////////////////////////////////////////
	var radarChartOptions2 = {
	  w: 164,
	  h: 250,
	  margin: margin,
	  maxValue: 100,
	  levels: 5,
	  roundStrokes: false,
	  color: d3.scaleOrdinal().range([ "#F7931E"]),
		format: '.0f',
		legend: { title: '', translateX: 10, translateY: 20 },
		unit: '%'
	};
	
	let chartsFrame=document.querySelector("#charts")
	data.forEach((d)=>{
		// console.log("d",d)
		let chartnode = document.createElement("DIV")
		chartnode.setAttribute('id', `chart_${d.code}`)
		chartnode.setAttribute('class', 'single-chart')
		// console.log("chartnode",chartnode)
		chartsFrame.appendChild(chartnode)
		let svg_radar2 = RadarChart(`#chart_${d.code}`, [d], radarChartOptions2);
	})


}
const addClickEffect=()=>{
	let clickableChart=document.querySelectorAll('.single-chart')
	clickableChart.forEach((c)=>{
		c.addEventListener("click",()=>{
			clickableChart.forEach((cc)=>{cc.classList.remove("single-chart-active")})
			c.classList.toggle('single-chart-active')
		})
	})
}
document.addEventListener("DOMContentLoaded", function(event) {

	loadData();
});
