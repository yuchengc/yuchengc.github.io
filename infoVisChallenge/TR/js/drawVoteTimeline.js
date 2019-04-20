//render the horizontal line with dots in vote panel
const drawVoteLine=(votePositionData,selectPosition)=>{

	let listPanel=document.querySelector("#voteList")
	const linetip = d3.tip().html(d=> d.result);
	const [voteListData]=votePositionData.filter((item)=>{
			return item.key==selectPosition
	})
	
	d3.select("#voteLine").selectAll('svg').remove()
	const margin = {
    top: 30,
    right: 50,
    bottom: 20,
    left: 15
    },
  	width = 800,
  	height = 100,
  	innerWidth = width - margin.left - margin.right,
  	innerHeight = height - margin.top - margin.bottom,
  	svgTimeline = d3.select('#voteLine').append('svg').attr('width', width).attr('height', height)
  	g = svgTimeline.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
  	
  	let x =  d3.scaleLinear().domain([0, voteListData.values.length ]).range([0, width - (margin.left + margin.right)])
	let y = d3.scaleLinear()
	    .domain([0]) 
	    .range([0]); 
    let color = d3.scaleOrdinal().domain(["No","Yes","Not Voting"])
	    .range(["#666699","#FF3333","#7F7F7F"]); 
  	 
	g.append('line')
		.attr('x1',x(0))
		.attr('y1',y(0))
		.attr('x2',x(voteListData.values.length)-20)
		.attr('y2',y(0))
		.style("stroke",color(selectPosition))

	g.selectAll(".dot")
        .data(voteListData.values)
      	.enter().append("circle")
        .attr("class", "dot")
        .attr("r", 10) // radius size, could map to another data dimension
        .attr("cx", function(d,i) { return x(i);})     // x position
        .attr("cy", function(d) { return y( 0); })  // y position
        .attr("fill", color(selectPosition))
        .on("mouseover", function (d) {
        	d3.selectAll('.dot').style("fill", color(selectPosition))
	        d3.select(this).style("fill", "#FBB100").attr("r",12)
        	drawVoteDetail(d)
        })
        .on("mouseout", function(d) {	
        	d3.select(this).attr("r",10)
    	})
    drawVoteDetail(voteListData.values[0])

}

//render vote description and results
const drawVoteDetail=(d)=>{
	
	let voteDescription=document.querySelector("#voteDescription")

	while (voteDescription.firstChild) {
	  	voteDescription.firstChild.remove();     
	}
	let voteListItem = document.createElement('div')
	voteListItem.innerHTML = `<div class="vote-timeline-description">${d.description?d.description:'Null'}</div><br><div>Representative's Position:${d.position}</div><div><span class="vote-timeline-result">Result:${d.result}</span><span class="vote-timeline-date">${d.date}</span></div>` 
	voteDescription.appendChild(voteListItem);
	drawTotalBarCart(d.total)
}

//render the small total bar chart 
const drawTotalBarCart=(data)=>{
	d3.select("#voteTotal").selectAll('svg').remove()
	let singleVoteData=Object.entries(data).map((d)=>{
		return {key:d[0],value:d[1]}
	})
	
	let margin = {top: 40, right: 10, bottom: 20, left: 20},
    width = 200 - margin.left - margin.right,
    height = 190 - margin.top - margin.bottom;

    // set the ranges
	let x = d3.scaleBand()
	          .range([0, width])
	          .padding(0.1);
	let y = d3.scaleLinear()
	          .range([height, 0]);
    let color = d3.scaleOrdinal()
	    .range(["#FF3333","#666699","#7F7F7F","#663333"])
	let svg = d3.select("#voteTotal").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

	x.domain(Object.keys(data));
  	y.domain([0, d3.max(Object.values(data))]);
	svg.append('text')
		.text("Total")
		.attr("x",-15)
		.attr("y",-10)

	//add bar
  	svg.selectAll(".bar")
      .data(singleVoteData)
	  .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d)=> { return x(d.key); })
      .attr("width", x.bandwidth())
      .attr("y", (d)=> { return y(d.value); })
      .attr("height", (d)=> { return height - y(d.value); })
      .attr('fill', (d,i) => color(i))

  // add the x Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // add the y Axis
  svg.append("g")
      .call(d3.axisLeft(y));
}
