//render the statement list based on the length of data
const drawStatement=(data)=>{
	let statementPanel=document.querySelector("#statementsList")
	while (statementPanel.firstChild) {
	  statementPanel.firstChild.remove();     
	}
	data.forEach((statement)=>{
		let statementListItem = document.createElement('div')
		statementListItem.setAttribute("class", "statement-card")
		statementListItem.innerHTML = `<span "statement-title"><a  href="${statement.url}">${statement.title}</a></span><span class="statement-time">${statement.date}</span>`
		statementPanel.appendChild(statementListItem);
	})
	
}