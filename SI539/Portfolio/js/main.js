
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
		var w = window.innerWidth;
		console.log("windows"+w)

	    console.log( window.pageYOffset);
	    // var nar=document.getElementsByClassName("navbar");
		var nar=document.getElementById("nav_bar");
		var scroll_y=window.pageYOffset;
		// document.querySelector(".example");
		if (w >= 650){
			if (scroll_y>window.innerHeight){
		    	console.log('scrolled down');
		    	nar.style.backgroundColor="rgba(0,0,0,0.5)";
		    }
		    else if (scroll_y<window.innerHeight){
		    	nar.style.backgroundColor="rgba(255,255,255,0)";
		    }

		}
		else if(w < 650){
			console.log("dark");
			nar.style.backgroundColor="rgba(0,0,0,0.5)";
		}
	    
	    
    };

    $('.project_box').hover(
    	function(){
    		$(this).find('img').css("filter", "saturate(0%) blur(3px) brightness(0.7)");
    		// $(this).css("filter", "blur(100px)");
    		$(this).find('img').css("-webkit-filter", "saturate(0%) blur(3px) brightness(0.70)");
    		console.log('hover img');
    		$(this).find(".project_intro").css({"animation-name":"proj_intro_hover_in",
    			"animation-duration":"0s", "background-color":"rgba(0,242,226,0.6)"});
    		$(this).find(".project_intro").css({"-webkit-animation-name":"proj_intro_hover_in",
    "-webkit-animation-duration":"0s","background": "linear-gradient(130deg, rgba(119,200,192,0.6) 0%, rgba(199,170,255,0.5) 100%)"}); // "background-color":"rgba(0,242,226,0.3)",
    		$(this).find(".project_intro").css("visibility","visible");
    	},
    	function(){
    		$(this).find('img').css("-webkit-filter", "saturate(100%) blur(0px)");
    		$(this).find('img').css("filter", "saturate(100%) blur(0px)");
    		// $(this).find(".project_intro").css({"background-color":"rgba(0,242,226,0)","visibility": "hidden;"});
    		$(this).find(".project_intro").css({"background":"linear-gradient(130deg, rgba(119,200,192,0.6) 0%, rgba(199,170,255,0.5) 100%)","visibility": "hidden;"});
    		$(this).find(".project_intro").css("visibility","hidden");
    	})
		  // $(this).find(".project_intro").css({"animation-name":"proj_intro_hover_out",
    // "animation-duration":"0.2s", "background-color":""})
    // 		$(this).find(".project_intro").css({"-webkit-animation-name":"proj_intro_hover_out",
    // "-webkit-animation-duration":"0.2s", "background-color":""})
		    
});	

//Window Load
jQuery(window).load(function($) {
    
    /*Init Portfolio*/
    var container = jQuery("#work-grid");
    if (container.length > 0) {
        container.isotope({
            layoutMode: 'masonry',
            transitionDuration: '0.7s',
            columnWidth: 60
        });
    };

    //Filter Portfolio
    jQuery('a.filter').on('click', function() {
        var to_filter = jQuery(this).attr('data-filter');
        if (to_filter == 'all') {
            container.isotope({
                filter: '.mix'
            });
        } else {
            container.isotope({
                filter: '.' + to_filter
            });
        }
    });

    //Switch Classes portfolio
    jQuery('.filter').on('click', function() {
        jQuery('a.filter').removeClass('active');
        jQuery(this).addClass('active');
    });
});