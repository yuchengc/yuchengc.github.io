console.log("linked")
const chart2Width = 920
const chart2Height = 500
let inputdata={
	coffee : 0,
	meat: 0,
	car: 0,
	// bike: 0,
	bus: 0,
	elevator: 0,
	lamp:0,
	computer:0,
	phone:0,
	tv: 0,
	ac:0,
	ht:0,
	clothes:0, 
}
const conversionRate = {
	coffee : 0.011, //per cup
	meat: 1.3, // per 100g
	car: 0.322, // per mile by wiki
	// bike: 0, //
	bus: 0.289, // per mile by FTA
	elevator: 0.218, // per floor
	lamp:0.011,
	computer:0.0189, // per hour
	phone:3.424, // per hour
	tv: 0.096,
	ac:0.572,
	ht:0.795,
	clothes:4.2, 
}
let dataCarbonEmission = {
	coffee : 0,
	meat: 0,
	car: 0,
	// bike: 0,
	bus: 0,
	elevator: 0,
	lamp:0,
	computer:0,
	phone:0,
	tv: 0,
	ac:0,
	ht:0,
	clothes:0, 
}

let dataBubbleBarCenter=[]
const colorRange = { coffee :"#662D91",meat:"#BF6AC4",car:"#DA1C5C",bus:"#F5A0C5",elevator:"#A01D21",lamp:"#F26522",
					computer:"#FFDE17",phone:"#58595B",tv:"#8DC63F",ac:"#006838",ht:"#42BFB4",clothes:"#1B75BC"}
const treeAbsort = 0.03 //per day
// let input = document.querySelector("#inputCoffee");
let inputBox = document.querySelectorAll('.inputNum');
// const $coins = document.querySelectorAll('.coins')
let plusButton = document.querySelectorAll('.plus');
let minusButton = document.querySelectorAll('.minus');
let totalAmount = 0;

var bbtooltip = d3.select("body").append("div").attr("class", "bbtoolTip"); //tooltip for bubble

let showChange = (e) => {
	// console.log(e)
	if(parseInt(e.target.value)){
		console.log(e.target.value, e.target.id)
		inputdata[e.target.id.slice(5).toLowerCase()]=parseInt(e.target.value)
	}	
	console.log(inputdata)
	calculateEmission()
	// console.log(parseInt(e.target.value))
}
let addNum = (e) =>{
	// console.log(e.target.previousElementSibling.value)
	e.target.previousElementSibling.value=parseInt(e.target.previousElementSibling.value)+1
	inputdata[e.target.previousElementSibling.id.slice(5).toLowerCase()]=parseInt(e.target.previousElementSibling.value)
	// console.log(inputdata)
	calculateEmission()
}
let minusNum = (e) =>{
	// console.log(e.target.nextElementSibling.value)
	if (parseInt(e.target.nextElementSibling.value)>0){
		e.target.nextElementSibling.value=parseInt(e.target.nextElementSibling.value)-1
		inputdata[e.target.nextElementSibling.id.slice(5).toLowerCase()]=parseInt(e.target.nextElementSibling.value)
		// console.log(inputdata)
		calculateEmission()
	}
	
}

// add event listerer on all text input
let checkingInput= () =>{
	[...inputBox].forEach(inputBox => inputBox.addEventListener('input', showChange));
}
let checkAddMinus = () =>{
	[...plusButton].forEach(plusButton => plusButton.addEventListener('click', addNum));
	[...minusButton].forEach(minusButton => minusButton.addEventListener('click', minusNum));
}

let calculateEmission = () =>{
	totalAmount=0
	Object.keys(dataCarbonEmission).forEach((key)=>{
		dataCarbonEmission[key]=inputdata[key]*conversionRate[key]
		totalAmount+=dataCarbonEmission[key]
	})
	// console.log(dataCarbonEmission)
	displayData()
}

let displayData=()=>{
	let dataview=document.querySelector(".dataview")
	let totalTree=totalAmount===0?0:parseInt(totalAmount/treeAbsort)+1
	dataview.innerHTML="<div class='amountLine'>Your total CO2 emission: <span class='totalAmount'>"+totalAmount.toFixed(4)+"</span> kgCO2</div><div>You need to plant:<br> <span class='totalTree'>"+totalTree+"</span> tree</div>"

	drawDistribution()
	drawtrees()
	drawBubbleBar()
}

let margin = { top: 140, right: 0, bottom: 30, left: 50 },
    width = chart2Width - margin.left - margin.right,
    height = chart2Height - margin.top - margin.bottom;

let x = d3.scaleLinear()
	    // .range([width, 0])
	    .domain([0, 100])
    	

let y = d3.scaleBand()
    .range([0, height])
    .domain(["total"])

var color = d3.scaleBand().range(colorRange).domain(["coffee","meat","car","bike","bus","elevator","computer","phone","tv","ac","ht","clothes"]);
let svg = d3.select("#chart2").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom )
    .append("g")
let createPattern=()=>{
	let patternSet = svg.append("defs")
	Object.keys(colorRange).forEach((c,i)=>{
		let pattern = patternSet.append("pattern")
			.attr("id","pattern"+c)
			.attr("x","0")
			.attr("y","0")
			.attr("width","28")
			.attr("height","28")
			// patternUnits="objectBoundingBox"
			.attr("patternContentUnits","userSpaceOnUse")
		// let pattern1 = svg.selectAll("pattern1");
		pattern.append("circle")
			.attr("cx",14)
			.attr("cy",0)
			.attr("r",14)
			.attr("stroke", colorRange[c])
			.attr("fill", colorRange[c])
		// )
	})
	
}

    // .attr("transform","translate(" + margin.left + "," + margin.top + ")");
let BGGroup=d3.select("#chart2 svg g").append("g")
	.attr("class","disGroup")
	.attr("transform","translate(" + margin.left + "," + margin.top + ")")
let disGroup=d3.select("#chart2 svg g").append("g")
	.attr("class","disGroup")
	.attr("transform","translate(" + margin.left + "," + margin.top + ")")
let treeGroup=d3.select("#chart2 svg g").append("g")
	.attr("class","treeGroup")
	.attr("transform","translate(" + margin.left + "," + "30" + ")")
let bubbleBarGroup=d3.select("#chart2 svg g").append("g")
	.attr("class","bubbleBarGroup")
	.attr("transform","translate(" + margin.left + "," + "170" + ")")

// draw the distribution bar
let drawDistribution=()=>{
	dataBubbleBarCenter=[]
	// if (totalAmount * 300 < 800 &&  totalAmount > 0){
	// 	width = (300 * totalAmount) - margin.left - margin.right
	// }else{
	// 	width = chart2Width - margin.left - margin.right
	// }
	// width = chart2Width - margin.left - margin.right
	// console.log("width",width)
	x.range([width, 0])

    let colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0,width])
    let dataDis = Object.keys(dataCarbonEmission).map((k)=>{
    	if (dataCarbonEmission[k]>0){
    		return {item: k, disValue: dataCarbonEmission[k]/totalAmount*100}
    	}
    	else{
    		return {item: k, disValue: 0}
    	}
    })
    // console.log("dataDis", dataDis)
    let previousPoint = 0;
    let previousPointT = 0;
    let bar = disGroup.selectAll(".disbar")
	    .data(dataDis)
    let bartext = disGroup.selectAll(".disbartext")
	    .data(dataDis,d=>d.disValue)

    bar.exit().remove();
    bar.enter()
	    .append("rect")
        .attr("class", "disbar")
        .merge(bar) 
        .attr("y", 0)
        .attr("x", function(d) { 
        	// console.log("d for x",d)
        	let temp=width-x(previousPoint)
        	previousPoint=previousPoint+d.disValue;
			if(d.disValue){
        		//find the center 
	        	dataBubbleBarCenter.push({type:d.item, position:temp+parseInt(width-x(d.disValue))/2})
	        	console.log("dataBubbleBarCenter",dataBubbleBarCenter)
        	}
        	return parseInt(temp)})
        .attr("width", 
        	function(d) { 
        	let subwidth=x(d.disValue);

        	// console.log("d",d.disValue)
        	return parseInt(width-subwidth)
        	// return 10
        })
        .attr("height", 30)
        .attr("fill",(d)=>{
        	return colorRange[d.item]
        })
    bartext.exit().remove();
    bartext.enter()
	    .append("text")
	    .attr("class", "disbartext")
	    .text((d)=>{
	    	console.log("d.disValue",d.disValue)
	    	return d.disValue.toFixed(2)+'%'})
	    .merge(bartext)
	    .attr("y", 20)
        .attr("x", function(d) { 
        	// console.log("d for x",d)
        	let tempT=width-x(previousPointT)
        	previousPointT=previousPointT+d.disValue;
			// if(d.disValue){
   //      		//find the center 
	  //       	dataBubbleBarCenterT.push({type:d.item, position:temp+parseInt(width-x(d.disValue))/2})
	  //       	// console.log("dataBubbleBarCenter",dataBubbleBarCenter)
   //      	}
   	// console.log("tempT+parseInt(width-x(d.disValue))/2",tempT+parseInt(width-x(d.disValue))/2)
        	return tempT+parseInt(width-x(d.disValue))/2-15
        })
        .attr("fill-opacity",(d)=>{
        	if (d.disValue<=0){return 0}
        		else{
        			return 1
        		}
        })
        .attr("fill","white")
        .attr("font-size","12")

}
let drawtrees=()=>{
	let datatrees = []
	let totalTree=totalAmount===0?0:parseInt(totalAmount/treeAbsort)+1
	let oneTree=Math.floor((totalTree%50)%10)
	let tenTree = Math.floor((totalTree%50)/10)
	let fiftyTree = Math.floor(totalTree/50)
	// console.log("oneTree",oneTree)
	for(let i=0; i<fiftyTree ;i++){
		datatrees.push( {type: "50",treeHeight:Math.floor(Math.random() * 10) + 45, treeindex: i})
	}
	for(let i=0; i<tenTree ;i++){
		datatrees.push( {type: "10",treeHeight:Math.floor(Math.random() * 8) + 30,treeindex: i})
	}
	for(let i=0; i<oneTree ;i++){
		datatrees.push( {type: "1",treeHeight:Math.floor(Math.random() * 5) + 20,treeindex: i})
	}

	let treeX = d3.scaleLinear()
	    .range([width, 0])
	    
    if(fiftyTree>9){
	    treeX.domain([0, fiftyTree])
    }else{
    	treeX.domain([0, 10])
    }
	let treeY = d3.scaleBand()
	    .range([0, height])
	    .domain(["total"])
 	let removeTrees=treeGroup.selectAll("g").remove()

	let tree = treeGroup.selectAll("g")
	    .data(datatrees)
	    console.log("tree data", datatrees)
	    
	    var test = tree.enter()
	    .append("g")
	    .attr('class','treeItem')
	    .merge(tree);

		tree.exit().remove()
		test.exit().remove()
	    test.append('circle')
	    .attr("r", (d)=>{
	    	if(d.type=="50"){return 50}
    		if(d.type=="10"){return 35}
			if(d.type=="1"){return 20}
	    })
		.attr("cx",
			function(d){
        	if(d.type=="50"){return width+55-treeX(d.treeindex)+7}
    		if(d.type=="10"){return width+30-treeX(d.treeindex)+6}
			if(d.type=="1"){return width+15-treeX(d.treeindex)+4}
		})
		.attr("cy",d=>100-d.treeHeight)
		.attr("fill",(d)=>{
        	if(d.type=="50"){return "#48721A"}
    		if(d.type=="10"){return "#659C35"}
			if(d.type=="1"){return "#8EC15D"}
    	})

	    test
	    .append('rect')
        .attr("width", (d)=>{
        	if(d.type=="50"){return 14}
    		if(d.type=="10"){return 12}
			if(d.type=="1"){return 8}
    	})
        .attr("height", d=>d.treeHeight)
        .attr("fill", (d)=>{
        	if(d.type=="50"){return "#663300"}
    		if(d.type=="10"){return "#993300"}
			if(d.type=="1"){return "#996633"}
    	})
        .attr("y",d=>110-d.treeHeight)
        .attr("x", function(d){
        	if(d.type=="50"){return width+55-treeX(d.treeindex)}
    		if(d.type=="10"){return width+30-treeX(d.treeindex)}
			if(d.type=="1"){return width+15-treeX(d.treeindex)}
        	// if(d.type == "50"){
        		return width-treeX(d.treeindex)

        	// }
        });
}
// let bbY = d3.scaleLinear()
//     .range([height,(height/3)*2,height/3, 0])
//     .domain([15,1.5,0.15,0]) //[15,5,1,0.1,0] //[0,0.1,1,5,15]
let bbY = d3.scaleLog()
	// .base(Math.E)
    .range([height, 0])
    .domain([18,Number('1e-2')])

const make_y_gridlines=()=>{		
    return d3.axisLeft(bbY).ticks(20)}

// var yAxis = d3.svg.axis()
//     .scale(bbY)
//     .orient("left")
//     .tickFormat(function(d) { return "(e" + formatPower(Math.round(Math.log(d)))+")"; });

bubbleBarGroup.append("g")
.attr("transform", "translate(0, 0)")
    .call(d3.axisLeft(bbY).ticks(20)
        .tickFormat(d3.format(".2f")));   


bubbleBarGroup.append("g")			
    .attr("class", "grid-y")
    .attr("transform", "translate(0, 0)")
    .call(make_y_gridlines()
        .tickSize(-width)
        .tickFormat("")
	) 
	.selectAll("line")
    .attr("stroke","#ccc")
    .attr("stroke-dasharray","1")
bubbleBarGroup.selectAll(".grid-y")
    .selectAll("path")
    .attr("opacity","0")


// let bubbleBarTooltip=bubbleBarGroup
// 	.append("g")
// 	.attr("class","bbtooltip")
// bubbleBarTooltip.append("line")
// 	.attr("class","tootltipLine")
// 	.attr("x1",0)
// 	.attr("y1",0)
// 	.attr("x2",0)
// 	.attr("y2",0)
// bubbleBarTooltip.append("text")
// 	.attr("class","tootltipLine")
let drawBubbleBar=()=>{
	let generateBubbleArr=(name)=>{
		let bbY = d3.scaleLinear()
		    .range([height,(height/4)*3,height/2,height/4, 0])
		    .domain([0,0.5,1,8,15])//[15,5,1,0.1,0]

		let outArr=[]
		let total=(height-bbY(dataCarbonEmission[name]))%15>0?parseInt((height-bbY(dataCarbonEmission[name]))/15)+1:parseInt((height-bbY(dataCarbonEmission[name]))/15)
		let lastOne=parseInt((height-bbY(dataCarbonEmission[name]))%15)
		for(let i=0;i<total;i++){
			if(i===total-1){
				outArr.push({key:'last',size:lastOne})
			}if(i===0){
				outArr.push({key:'start',size:20})
			}else{
				outArr.push({key:'normal',size:15})
			}
			
		}
		return outArr
	}
	// bubbleBarTooltip=bubbleBarGroup
	// 	.append("g")
	// 	.attr("class","bbtooltip")


    let bubbleBar=bubbleBarGroup.selectAll(".bubblebar")
	    .data(dataBubbleBarCenter, d=>d.type)

	 bubbleBar.exit().remove(); 

    // bubbleSet.remove()
    bubbleBar.enter()
	    .append("g")
	    .attr("class",(d)=>{return "bubblebar "+d.type})
	    .merge(bubbleBar)

    dataBubbleBarCenter.forEach((bb)=>{
    	let bubbleChain=generateBubbleArr(bb.type)
    	console.log("bubbleChain",bubbleChain)
    	let bubbles=bubbleBarGroup.selectAll(`.${bb.type}`).data(bubbleChain)
    	// bubbles.exit().remove()
    	
	    bubbles.append("rect")
		    .attr("y",0)
	        .attr("x", bb.position-2)
	        .attr("height", bbY(dataCarbonEmission[bb.type]))
	        .attr("width", 4)
	        .attr("fill","#636B5B")
        bubbles.append("circle")
		    // .merge(bubbles)
		    .attr("cx",bb.position)
		    .attr("cy", bbY(dataCarbonEmission[bb.type]))
		    .attr("r",10)
		    .attr("fill","#636B5B")
		    .on("mousemove", function(d){
	        	d3.select(this)
	        	.transition()           // apply a transition
			    .duration(100) 
			    .attr("fill","#454C3C")
			    .attr("r",15)
			    


			    bbtooltip.style("left", d3.event.pageX - 80 + "px")                 
	            .style("top", d3.event.pageY -30 + "px")
	            .style("display", "inline-block")
	            .html("<b>" +(bb.type) + "</b>  : " + (dataCarbonEmission[bb.type])+" kgCO2");
	        })
	        .on("mouseout", function (d){
	        	d3.select(this)
	        	.transition()           // apply a transition
			    .duration(100) 
	        	.attr("fill","#636B5B")
	        	.attr("r",10)

	        	bbtooltip.style("display", "none"); 
	        })

    })
   
}

// without jQuery (doesn't work in older IEs)
document.addEventListener('DOMContentLoaded', function(){ 
	createPattern()
	checkingInput()
	checkAddMinus()
	displayData()
    
}, false);
