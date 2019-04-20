//render the vote list in vote pattern panel
const drawVoteList=(votePositionData,selectPosition)=>{
	let listPanel=document.querySelector("#voteList")
	while (listPanel.firstChild) {
	  listPanel.firstChild.remove();     
	}
	const [voteListData]=votePositionData.filter((item)=>{
			return item.key==selectPosition
	})
	// console.log(voteListData.values)
	voteListData.values.forEach((vote)=>{
		let voteListItem = document.createElement('div')
		voteListItem.setAttribute("id", "")
		voteListItem.setAttribute("class", "vote-list")
		voteListItem.innerHTML = `<span class="vote-description">${vote.description}</span><span class="vote-result">${vote.result}</span><span class="vote-date">${vote.date}</span>` 
		listPanel.appendChild(voteListItem);
	})

}
