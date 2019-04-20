//// load cahced data
// const readcachedData=()=>{
// 	let cachedData =caData;
// 	console.log(cachedData)
// 	return cachedData
// }
// const readvoteData=(mamberID)=>{
// 	let votesData =votes;
// 	console.log(votesData)
// 	return votesData.results[0]
// }
// const readtravelData=(mamberID)=>{
// 	let travelData =travelData_c;
// 	console.log(travelData)
// 	return travelData
// }
// const readstatementData=(mamberID)=>{
// 	let statementsData =statementsData_c;
// 	console.log(statementsData)
// 	return statementsData
// }

//render hte member list
const renderCAMembers=(memebrsObject)=>{
	let membersPanel=document.querySelector("#caMembers")
	let memberListItem = document.createElement('div')
	memberListItem.innerHTML = 'name' 

	memebrsObject.forEach((member)=>{
		let memberListItem = document.createElement('div')
		memberListItem.setAttribute("id", member.id)
		memberListItem.setAttribute("class", "member-card")
		let partClass='party-n'
		if(member.party == "D"){
			partClass="party-d"
		}else if(member.party == "R")
		{	partClass="party-r"
		}else{partClass='party-n'}

		memberListItem.innerHTML = `<span class="member-avator"><i class="fas fa-user-circle ${partClass}"></i>${member.name}</span>`
		membersPanel.appendChild(memberListItem);
	})
	
}

//data grouping
const groupDataByVotePosition=(inputData)=> {
     var groupedVoteData = d3.nest()         
     .key((d)=>d.position)           
     .entries(inputData);  
     return groupedVoteData;
}
const groupDataByYear=(inputData)=> {
     var groupedData = d3.nest()         
     .key((d)=>d.year)    
     .sortKeys(d3.ascending)       
     .entries(inputData);  
     return groupedData;
 
}
//render voting pattern panel
const renderVotePattern=(memberData)=>{
	let votePositionData=groupDataByVotePosition(memberData)
	let pieData=votePositionData.map((d)=>{
		let position=d.key
		let amount=d.values.length
		return {position:position,value:amount}
	})
	drawPieChart(pieData,votePositionData)
	drawVoteLine(votePositionData,'No')
}
//render travel expense panel
const renderTravelExpenseData=(memberData)=>{
	let travelGroupData=groupDataByYear(memberData)
	drawGroupedBarChart(travelGroupData)

}
//render statement panel
const renderStatementsData=(memberData)=>{
	drawStatement(memberData)	
}
//render member's detailed information, after selecting a memeber 
const renderMemberData=(memberVoteData,mamberStatement,memberTravelData)=>{
	renderVotePattern(memberVoteData[0].votes)
	renderTravelExpenseData(memberTravelData)
	renderStatementsData(mamberStatement)


}
