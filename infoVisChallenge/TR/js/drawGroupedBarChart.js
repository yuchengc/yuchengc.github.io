//render grouped bar chart
const drawGroupedBarChart=(data)=>{
	const tip = d3.tip().html(d=> d.value);
	const margin = {
			top: 50,
			right: 80,
			bottom: 20,
			left: 60
		},
		width = 660,
		height = 300,
		innerWidth = width - margin.left - margin.right,
		innerHeight = height - margin.top - margin.bottom,
		svg = d3.select('#travelExpenseSvg').append('svg').attr('width', width).attr('height', height)
		g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
		
	svg.call(tip)
	//X scale - year
	const x0 = d3.scaleBand()
		.rangeRound([0, innerWidth])
		.paddingInner(.1);
	//X scale - quarter
	const x1 = d3.scaleBand()
		.padding(.05);

	const y = d3.scaleLinear()
		.rangeRound([innerHeight, 0]);
	let color = d3.scaleOrdinal()
			.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b"]);
	let categoriesNames = data.map(function(d) { return d.key; });
	let rateNames = data[1].values.map(function(d) { return d.quarter; });

	x0.domain(categoriesNames);
	x1.domain(rateNames).rangeRound([0, x0.bandwidth()]);
	y.domain([0, d3.max(data, (categorie)=>{ return d3.max(categorie.values, (d)=>{ return d.amount; }); })]);
	
	//appenf grouped bars
	g.append('g')
		.selectAll('g')
		.data(data)
		.enter()
		.append('g')
		.attr('transform', d => 'translate(' + x0(d.key) + ',0)')
		.selectAll('rect')
		.data(d => d.values.map((quarterD) => {
			return {key: quarterD.quarter, value: quarterD.amount}
		}))
		.enter().append('rect')
		.attr('x', d => x1(d.key))
		.attr('y', d => y(d.value))
		.attr('width', x1.bandwidth())
		.attr('height', d => innerHeight - y(d.value))
		.attr('fill', d =>  color(d.key))
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide)

	//appenf x axis
	g.append('g')
		.attr('class', 'axis-bottom')
		.attr('transform', 'translate(0,' + innerHeight + ')')
		.call(d3.axisBottom(x0));

	//appenf y axis
	g.append('g')
		.attr('class', 'axis-left')
		.call(d3.axisLeft(y).ticks(null, 's'))
		.append('text')
		.attr('x', 10)
		.attr('y', y(y.ticks().pop()) + 10)
		.attr('dy', '0.32em')
		.attr('fill', '#000')
		.style('transform', 'rotate(-90deg)')
		.attr('font-weight', 'bold')
		.attr('text-anchor', 'end')
		.text('Amount');
		
	//add legend
	const legend = g.append('g')
		 .attr('font-family', 'sans-serif')
		 .attr('font-size', 10)
		 .attr('text-anchor', 'end')
		 .selectAll('g')
		 .data(rateNames.slice().reverse())
		 .enter().append('g')
		 .attr('transform', (d, i) => 'translate(60,' + i * 20 + ')');

	legend.append('rect')
		.attr('x', innerWidth - 19)
		.attr('width', 10)
		.attr('height', 10)
		.attr('fill', color);

	legend.append('text')
		.attr('x', innerWidth - 32)
		.attr('y', 6)
		.attr('dy', '0.32em')
		.text(d => 'Q'+d);
}