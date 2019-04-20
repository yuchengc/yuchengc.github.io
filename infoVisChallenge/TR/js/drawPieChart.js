//draw pie chart
const drawPieChart=(data,votePositionData)=>{
	let totalVote=0
	data.forEach((d)=>{
		totalVote=totalVote+d.value
	})
	var width = 280;
	var height = 280;
	var thickness = 40;
	var duration = 750;
	var padding = 40;
	var opacity = .8;
	var opacityHover = 1;
	var otherOpacityOnHover = .8;
	var tooltipMargin = 13;

	var thickness = 40;
	var radius = Math.min(width-padding, height-padding) / 2;
	let color={"No":"#666699","Yes":"#FF3333","Not Voting":"#7F7F7F"}
	var arc = d3.arc()
		.innerRadius(radius-thickness)
		.outerRadius(radius);

	d3.selectAll('svg').remove();
	d3.select(".legend").remove();

	var svg = d3.select("#pieChart")
		.append('svg')
		.attr('class', 'pie')
		.attr('width', width)
		.attr('height', height);

	let g = svg.append('g')
		.attr('transform', 'translate(' + (width/2) + ',' + (height/2) + ')');

	let pie = d3.pie()
		.value(function(d) { return d.value; })
		.sort(null);

	//append path to g tag
	let path = g.selectAll('path')
	  	.data(pie(data))
	  	.enter()
	  	.append("g")  
	  	.append('path')
	  	.attr('d', arc)
	  	.attr('fill', (d,i) => {
			// console.log(d.data.position)
	  		return color[d.data.position]})
	  	.style('opacity', opacity)
	  	.style('stroke', 'white')
	  	.on("mouseover", function(d) {

	      	d3.selectAll('path')
	          .style("opacity", otherOpacityOnHover);
	      	d3.select(this) 
	          .style("opacity", opacityHover);

	        let g = d3.select("svg")
		        .style("cursor", "pointer")
		        .append("g")
		        .attr("class", "tooltip")
		        .style("opacity", 0);
		 
		    g.append("text")
		        .attr("class", "name-text")
		        .text(`${d.data.position} (${d.data.value})`)
		        .attr('text-anchor', 'middle');
		    
		    let text = g.select("text");
		    let bbox = text.node().getBBox();
		    let padding = 2;
		    g.insert("rect", "text")
		        .attr("x", bbox.x - padding)
		        .attr("y", bbox.y - padding)
		        .attr("width", bbox.width + (padding*2))
		        .attr("height", bbox.height + (padding*2))
		        .style("fill", "white")
		        .style("opacity", 0.75);
	    })
	  	.on("mousemove", function(d) {
	  		//mouse event - move in
	        let mousePosition = d3.mouse(this);
	        let x = mousePosition[0] + width/2;
	        let y = mousePosition[1] + height/2 - tooltipMargin;
	    
	        let text = d3.select('.tooltip text');
	        let bbox = text.node().getBBox();
	        if(x - bbox.width/2 < 0) {
	          x = bbox.width/2;
	        }
	        else if(width - x - bbox.width/2 < 0) {
	          x = width - bbox.width/2;
	        }
	    
	        if(y - bbox.height/2 < 0) {
	          y = bbox.height + tooltipMargin * 2;
	        }
	        else if(height - y - bbox.height/2 < 0) {
	          y = height - bbox.height/2;
	        }
	    
	        d3.select('.tooltip')
	          .style("opacity", 1)
	          .attr('transform',`translate(${x}, ${y})`);
	    })
	  	.on("mouseout", function(d) {   
	  		//mouse event - move out
	        d3.select("svg")
		        .style("cursor", "none")  
		        .select(".tooltip").remove();
	        d3.selectAll('path')
		        .style("opacity", opacity);
	    })
	  	.on("touchstart", function(d) {
	      	d3.select("svg")
	          	.style("cursor", "none");    
	  	})
	  	.on("click", (d)=>{
	  		// console.log("click",d.data.position)
	  		// drawVoteList(votePositionData,d.data.position);
	  		drawVoteLine(votePositionData,d.data.position);
	  	})
	  	.each(function(d, i) { this._current = i; });

  	// add tooltip
	let gText = svg.append("g")
        .attr("class", "text-group")
        .attr('transform', 'translate(' + (width/2) + ',' + (height/2) + ')');
 
    gText.append("text")
        .attr("class", "name-text")
        .text('Vote')
        .attr('text-anchor', 'middle')
        .attr('dy', '-2.2em');
  
    gText.append("text")
        .attr("class", "value-text")
        .text(totalVote)
        .attr('text-anchor', 'middle')
        .attr('dy', '.3em')
        .style("font-size", "46px");

    gText.append("text")
        .attr("class", "name-text")
        .text('times')
        .attr('text-anchor', 'middle')
        .attr('dy', '3.0em');

    // add legend
	let legend = d3.select("#pieChart").append('div')
			.attr('class', 'legend')
			.style('margin-left', '20px');

	let keys = legend.selectAll('.key')
			.data(data)
			.enter().append('span')
			.attr('class', 'key')
			.style('display', 'inline-flex')
			.style('align-items', 'center')
			.style('margin-right', '20px');

		keys.append('div')
			.attr('class', 'symbol')
			.style('height', '10px')
			.style('width', '10px')
			.style('margin', '5px 5px')
			.style('background-color', (d, i) => {return color[d.position]});

		keys.append('div')
			.attr('class', 'name')
			.text(d => `${d.position} (${d.value})`)
			.style("font-size", "12px");

		keys.exit().remove();

}
