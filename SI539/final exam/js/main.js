$( document ).ready(function() {
	$("#btn1").click(function(){
		$("#img_1").css("display", "none");
		$("#img_2").css("margin-left","25vw");
		$("#img_2").css("margin-right","25vw");

	});
	$("#btn2").click(function(){
		$("#img_1").css("display", "inline-block");
		$("#img_2").css("margin-left","0vw");
		$("#img_2").css("margin-right","0vw");


	});
});