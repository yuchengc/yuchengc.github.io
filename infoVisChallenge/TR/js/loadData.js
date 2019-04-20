console.log("load data")
let CA_MEMBER_DATA
let MEMBER_VOTE_DATA
let MEMBER_STATEMENT_DATA
let MEMBER_TRAVEL_DATA
const chambers=['house','senate']
const filePath="cache/data.json"

//function : get CA's members' data
async function getCArepresentativesDataAsync() {
  try {
	const responses = chambers.map(async chamber=>
	{
		const response=await fetch(
				`https://api.propublica.org/congress/v1/members/${chamber}/CA/current.json`, {
				method: 'GET',
				withCredentials: true,
				headers: {
					'X-API-Key': '8nxiD771T6MQtkLhd1YBsgcmSskeYhfouvan6R1v', 
					}
				}
			)
			let data = response.json()
			return data;
	})
	let queryResponses={}
	for (const [index, element] of responses.entries()) {
		let temp=await element
		if (index==0){
			queryResponses.house=temp.results
		}else{
			queryResponses.senate=temp.results
		}
	}
	  return queryResponses
  }
  catch (err) {
	console.log('fetch failed', err);
  }
}

//function : get specific member's data
async function getMemberDataAsync(memberId) {
	let dataUrl=[`https://api.propublica.org/congress/v1/members/${memberId}/votes.json`,
	`https://api.propublica.org/congress/v1/members/${memberId}/statements/115.json`,
	`https://api.propublica.org/congress/v1/members/${memberId}/office_expenses/category/travel.json`]
  	try {
		const [votes, statements, travelExpenses] = dataUrl.map(async url=>
		{
			const response=await fetch(
				url, {
				method: 'GET',
				withCredentials: true,
				headers: {
					'X-API-Key': '8nxiD771T6MQtkLhd1YBsgcmSskeYhfouvan6R1v', 
					}
				}

			)
			let memberdata = response.json()
			// console.log(memberdata)
			return memberdata;
		})
		let votesTemp=await votes
		let statementsTemp=await statements
		let travelExpensesTemp=await travelExpenses
		return {votes: votesTemp.results, statements: statementsTemp.results, travel:travelExpensesTemp.results }
  	}
  	catch (err) {
		console.log('fetch failed', err);
  	}
}

//get data
getCArepresentativesDataAsync().then(data => {
	CA_MEMBER_DATA = JSON.parse(JSON.stringify(data));
	Object.keys(CA_MEMBER_DATA).forEach((chamber)=>{renderCAMembers(CA_MEMBER_DATA[chamber])})
	// renderMemberData("H001048")
	getMemberDataAsync("H001048").then(data => {
		MEMBER_VOTE_DATA = JSON.parse(JSON.stringify(data.votes));
		MEMBER_STATEMENT_DATA = JSON.parse(JSON.stringify(data.statements));
		MEMBER_TRAVEL_DATA = JSON.parse(JSON.stringify(data.travel));
		// console.log(event.target.id,MEMBER_VOTE_DATA)
		renderMemberData(MEMBER_VOTE_DATA,MEMBER_STATEMENT_DATA,MEMBER_TRAVEL_DATA)
		let defaultCard=document.querySelector("#H001048").classList.add('member-card-selected')
	});
	let memberCards=document.querySelectorAll(".member-card")
	memberCards.forEach((card)=>{
		card.addEventListener('click', (event)=>{
			memberCards.forEach(card=>{
				card.classList.remove('member-card-selected')
			}) 
			event.target.classList.add('member-card-selected')
			getMemberDataAsync(event.target.id).then(data => {
				MEMBER_VOTE_DATA = JSON.parse(JSON.stringify(data.votes));
				MEMBER_STATEMENT_DATA = JSON.parse(JSON.stringify(data.statements));
				MEMBER_TRAVEL_DATA = JSON.parse(JSON.stringify(data.travel));
				renderMemberData(MEMBER_VOTE_DATA,MEMBER_STATEMENT_DATA,MEMBER_TRAVEL_DATA)
			});
		})
	})
});

