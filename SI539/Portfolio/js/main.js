
$( document ).ready(function() {


	$(window).on('load', function() {
	$(".loader").delay(7000).hide();
	$(".container").delay(2000).fadeIn(1);
	});

	/*Pruebas*/

	var parallax = document.querySelectorAll(".parallax");
	var	speed = -0.25;

	// window.onscroll = function() {
	// 	[].slice.call(parallax).forEach(function(el, i) {

	// 		var windowYOffset = window.pageYOffset,
	// 			elBackgrounPos = "50% " + (windowYOffset * speed + i * 200) + "px";

	// 		el.style.backgroundPosition = elBackgrounPos;

	// 	});
	// };



	window.onscroll = function() {

		[].slice.call(parallax).forEach(function(el, i) {

			var windowYOffset = window.pageYOffset,
				elBackgrounPos = "50% " + (windowYOffset * speed + i * 200) + "px";

			el.style.backgroundPosition = elBackgrounPos;

		});


	    console.log( window.pageYOffset);
	    // var nar=document.getElementsByClassName("navbar");
		var nar=document.getElementById("nav_bar");
		// document.querySelector(".example");

	    var scroll_y=window.pageYOffset;
	    if (scroll_y>window.innerHeight){
	    	console.log('scrolled down');
	    	nar.style.backgroundColor="rgba(0,0,0,0.5)";
	    }
	    else if (scroll_y<window.innerHeight){
	    	nar.style.backgroundColor="rgba(255,255,255,0)";
	    }
    };

    $('.project_box').children("img").hover(
    	function(){
    		$(this).css("filter", "saturate(0%) blur(3px)");
    		// $(this).css("filter", "blur(100px)");
    		$(this).css("-webkit-filter", "saturate(0%) blur(3px)");
    		console.log('hover img');
    	},
    	function(){
    		$(this).css("-webkit-filter", "saturate(100%) blur(0px)");
    		$(this).css("filter", "saturate(100%) blur(0px)");})
});	