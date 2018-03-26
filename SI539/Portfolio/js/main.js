$(window).on('load', function() {
	$(".loader").delay(7000).hide();
	$(".container").delay(2000).fadeIn(1);
});

/*Pruebas*/

var parallax = document.querySelectorAll(".parallax");
var	speed = -0.25;

window.onscroll = function() {
	[].slice.call(parallax).forEach(function(el, i) {

		var windowYOffset = window.pageYOffset,
			elBackgrounPos = "50% " + (windowYOffset * speed + i * 200) + "px";

		el.style.backgroundPosition = elBackgrounPos;

	});
};