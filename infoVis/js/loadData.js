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
