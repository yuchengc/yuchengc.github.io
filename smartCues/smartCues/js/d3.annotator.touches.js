;
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
    } else if (typeof module === 'object' && module.exports) {
    } else {
    // Browser global.
    // eslint-disable-next-line no-param-reassign
    root.d3.annotator.touches = factory()
    }
}(this,
    function() {
        return function (target) {

            // INTERNAL PROPERTIES
            var annotator = null,
                annotations = "*",
                root = null,
                rootElement = null,
                svg = null,
                instance = null,
                attributes = [];

                touches.label = null;
                touches.value = null;
                touches.valueUp = null; // mark identifier attribute in data
                touches.valueDown = null
                touches.target = target;
                touches.log = null;
            //CONSTRUCTOR
            function touches(vis) {
                console.log("vis",vis)
                svg = getSVGNode(vis);
                svg = d3.select(svg);
                console.log("svg element",svg)
                annotator = d3.annotator(target).call(this, vis).rootElement(root);
                console.log("annotator",annotator)
                annotator.interaction = function(element, action) {
                    var hammertime = new Hammer(element, {
                        multiUser: true, dragLockToAxis: true,
                        dragBlockHorizontal: true, preventDefault: true
                    });
                    hammertime.on('tap', function (event) {
                        action.call(this,event.target);

                    });
                }
                attributes.forEach(function (item, index) {
                  console.log("attribute item",attributes)
                  annotator.attr(item.property, item.value) });
                if (target && instance == null) {
                    instance = touches[target].apply();
                    console.log("Instance Created")
                }
                instance['annotateFor'](annotations);

                window.oncontextmenu = function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                };
            }

            // PUBLIC PROPERTIES
            touches.rootElement = function(v) {
                root = v;
                rootElement = v == null ? v : functor(v);
                return touches;
            };

            touches.annotateFor = function (list) {
                annotations = list;
                return touches;
            };

            touches.settings = function (a, s) {
                if (target && instance == null) {
                    instance = touches[target].apply();

                    console.log("Instance Created")
                }
                return instance.settings(a,s);
            }

            touches.attr = function (p, v) {
                console.log("instance in attr func", instance)
                if (target && instance == null) {
                    instance = touches[target].call(this);
                    console.log("this",this)
                    console.log("target", target)
                    console.log("touches[target]", touches[target])
                    console.log("p",p)
                    console.log("Instance Created")
                    console.log("Instance after created",instance)
                }
                if (touches.hasOwnProperty(p)) {
                    console.log("touches hasOwnProperty",p)
                    touches[p] = v ;
                }
                if (instance.hasOwnProperty(p)) {
                    console.log("instance hasOwnProperty",p)
                    instance[p] = v;
                }
                attributes.push({ property: p, value: v });
                console.log("p",p)
                console.log("attributes",attributes)
                return touches;
            }

            touches.clearAnnotations = function() {
                if (target && instance == null) {
                    instance = touches[target].apply();
                    console.log("Instance Created")
                }
                instance.clear();
                return touches;
            }

            function functor(v) {
                return typeof v === 'function' ? v : function () {
                    return v
                }
            }

            //PRIVATE METHODS
            function getSVGNode(element) {
                var svgNode = element.node()
                console.log("svgNode element",element)

                console.log("svgNode",element.node())
                if (!svgNode) return null
                if (svgNode.tagName.toLowerCase() === 'svg') return svgNode
                return svgNode.ownerSVGElement
            }

            //http://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4
            function getTransformation(transform) {
                // Create a dummy g for calculation purposes only. This will never
                // be appended to the DOM and will be discarded once this function
                // returns.
                var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

                // Set the transform attribute to the provided string value.
                g.setAttributeNS(null, "transform", transform);

                // consolidate the SVGTransformList containing all transformations
                // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
                // its SVGMatrix.
                var matrix = g.transform.baseVal.consolidate().matrix;

                // Below calculations are taken and adapted from the private function
                // transform/decompose.js of D3's module d3-interpolate.
                //var {a, b, c, d, e, f} = matrix;   // ES6, if this doesn't work, use below assignment
                var a=matrix.a, b=matrix.b, c=matrix.c, d=matrix.d, e=matrix.e, f=matrix.f; // ES5
                var scaleX, scaleY, skewX;
                if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
                if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
                if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
                if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
                return {
                    translateX: e,
                    translateY: f,
                    rotate: Math.atan2(b, a) * Math.PI/180,
                    skewX: Math.atan(skewX) * Math.PI/180,
                    scaleX: scaleX,
                    scaleY: scaleY
                };
            }

            function annotate(marks, constraints, measure, style,x,y) {
                // console.log("marks, constraints, measure, style,x,y",marks, constraints, measure, style,x,y)
                if (measure && measure.split(" ").length > 1) {
                    // console.log("show two buttons")
                    d3.selectAll(".buttonM").remove();
                    d3.selectAll(".buttonT").remove();
                    annotator.clear();
                    buttons = measure.split(" ");
                    buttons.sort(function (a, b) { return b.length - a.length; });
                    let marksTouched
                    if(Array.isArray(marks)){
                      marksTouched=marks
                    }else{
                      marksTouched=marks[Object.keys(marks)[0]]
                    }
                    d3.select(marksTouched[0].parentNode)
                        .selectAll(".buttonM")
                        .data(buttons)
                        .enter()
                        .append("rect")
                        .attr("class", "annotation buttonM")
                        .attr("width", buttons[0].length * 30)
                        .attr("height", 50)
                        .attr("rx", 6)
                        .attr("ry", 6)
                        .attr("x", x - buttons[0].length * 15)
                        .attr("y", function(d, i) { return y - 70 - 55 * i })
                        .attr("stroke", "#7a7a7d")
                        .attr("fill", "white")
                        .on("click",
                            function (d) {
                                d3.selectAll(".buttonM").remove();
                                d3.selectAll(".buttonT").remove();
                                console.log("d",d)
                                annotator.annotate(marks, constraints, d, style,y)
                            }
                        );

                    d3.select(marksTouched[0].parentNode).selectAll(".buttonT")
                      .data(buttons)
                      .enter()
                      .append("text")
                      .attr("class", "annotation buttonT")
                      .attr("font-size", "20px")
                      .attr("x", function (d, i) { return x - buttons[0].length * 10 + 20 })
                      .attr("y", function (d, i) { return y - 40 - 55 * i })
                      .text(function(d) { return d; });
                } else {
                    annotator.annotate(marks, constraints, measure, style, y);
                }

            }

    // Touch Interactions for bubble Chart
    touches.bubble = function(){
            var config = {
                "Diff": { measure: "Diff", style: {} },
                "Value": { measure: "Value", style: {} },
                "Rank": { measure: "Rank", style: {} },
                // "Threshold": { measure: "Threshold", style: {} },
                // "Above": { measure: "Above", style: {} },
                // "Below": { measure: "Below", style: {} },
                // "Mean" : {measure:"Mean", style: {} }
            };
            // CONSTRUCTOR
            function bubble() {

            }

            bubble.label = null;
            // method for configuring individual annotation actions.
            bubble.settings = function(a,setting) {
                console.log("bubble setting's setting",setting)
                if (a && setting && config.hasOwnProperty(a)) {
                    if (setting.hasOwnProperty("measure")) {
                        console.log("setting have property measure", setting.measure)
                        config[a].measure = setting.measure;
                    }
                    if (setting.hasOwnProperty("style")) {
                        console.log("setting have property style", setting.style)
                        config[a].style = setting.style;
                    }
                }
                return bubble;
            }

            // method to configure what annotations to apply
            bubble.annotateFor = function(an) {
                if (an == "*") {
                    annotateAll();
                    return bubble;
                } else {
                    a = an.split(" ");
                    a.forEach(function(item, index) {
                        bubble[item].apply();
                    })
                }
                return bubble;
            }

            bubble.clear = function() {
                annotator.clear();
                return bubble;
            }

            //TOUCH INTERACTIONS FOR BAR ANNOTATIONS

            // tooltip
            bubble.Value = function() {
                console.log("Adding Event Handlers for Value Annotation");
                svg.selectAll("circle")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this, {
                            multiUser: true, dragLockToAxis: true,
                            dragBlockHorizontal: true, preventDefault: true
                        });
                        hammertime.on('tap', function (event) {
                            touches.log.push({ "message": "tap -bar", "timestamp": Date.now() });
                            annotate([event.target], null, config["Value"].measure, config["Value"].style,
                                parseFloat(event.target.getAttribute("x")), parseFloat(event.target.getAttribute("y")));
                        });
                    });
            }

            // difference between two bars
            bubble.Diff = function () {
                var items = [];
                console.log("Adding Event Handlers for Diff Annotation");
                svg.selectAll("circle")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this,
                        {
                            multiUser: true,
                            dragLockToAxis: true,
                            dragBlockHorizontal: true,
                            preventDefault: true
                        });
                        hammertime.get('press')
                            .set({
                                time: 200,
                                pointers: 1,
                                threshold: 20
                            });
                        hammertime.on("press",
                            function(event) {
                                var args = Array.prototype.slice.call(arguments);
                                event.preventDefault();
                                console.log("Firing press for " + getLabel(event.target));
                                items.push(event.target);
                                if (items.length == 2) {
                                    touches.log.push({ "message": "press 2 bars -bar", "timestamp": Date.now() });
                                    annotator.annotate(items, null, config["Diff"].measure, config["Diff"].style);
                                    items = [];
                                    console.log("clearing items");
                                }
                            });
                        hammertime.on("pressup",
                            function(event) {
                                event.preventDefault();
                                index = items.findIndex(x => getLabel(x) == getLabel(event.target));
                                items.splice(index, 1);
                                if (items.length == 0) {
                                    console.log("clearing items");
                                    //annotator.clear();
                                }
                            });
                    }
                );
                svg.selectAll("circle")
                    .on("mouseup touchend",
                        function() {
                            index = items.findIndex(x => getLabel(x) == getLabel(this))
                            items.splice(index, 1);
                        });
            };

            //INTERNAL METHODS
            function annotateAll(parameters) {
                bubble.Value();
                bubble.Diff();
                // bubble.Rank();
                // bubble.Threshold();
                // bubble.Above();
                // bubble.Below();
                // bubble.Mean();
            }

            function getLabel(m) {
                return d3.select(m).data()[0][bar.label];
            }

            function getDataMarks() {
                var marks = [];
                svg.selectAll("circle")
                    .nodes()
                    .forEach(function(item, index) {
                        if (item.hasOwnProperty("__data__") && !d3.select(item).classed("annotation")) {
                            marks.push(item);
                        }
                    });
                return marks;

            }
            return bubble;
    }

        // Touch Interactions for Bar Chart
    touches.pyramid = function () {

            // configuration dictionary for different annotations for bar chart
            var config = {
                "Diff": { measure: "Diff", style: {} },
                "Value": { measure: "Value", style: {} },
                "Rank": { measure: "Rank", style: {} },
                "Threshold": { measure: "Threshold", style: {} },
                "Above": { measure: "Above", style: {} },
                "Below": { measure: "Below", style: {} },
                "Mean" : {measure:"Mean", style: {} }
            };

            // CONSTRUCTOR
            function pyramid() {

            }

            pyramid.label = null;
            // method for configuring individual annotation actions.
            pyramid.settings = function(a,setting) {
                console.log("bar setting setting:", setting)
                if (a && setting && config.hasOwnProperty(a)) {
                    if (setting.hasOwnProperty("measure")) {
                        config[a].measure = setting.measure;
                    }
                    if (setting.hasOwnProperty("style")) {
                        config[a].style = setting.style;
                    }
                }
                return pyramid;
            }

            // method to configure what annotations to apply
            pyramid.annotateFor = function(an) {
                if (an == "*") {
                    annotateAll();
                    return pyramid;
                } else {
                    a = an.split(" ");
                    a.forEach(function(item, index) {
                        pyramid[item].apply();
                    })
                }
                return pyramid;
            }

            pyramid.clear = function() {
                annotator.clear();
                return pyramid;
            }

            //TOUCH INTERACTIONS FOR BAR ANNOTATIONS

            // tooltip
            pyramid.Value = function() {
                console.log("Adding Event Handlers for Value Annotation");
                console.log("svg in value",svg)
                // console.log("svg selectAllc rect",svg.selectAll('rect'))
                svg.selectAll('rect')
                    .each(function(d, i) {
                        // console.log("svg select", d)
                        var hammertime = new Hammer(this, {
                            multiUser: true, dragLockToAxis: true,
                            dragBlockHorizontal: true, preventDefault: true
                        });
                        hammertime.on('tap', function (event) {
                            console.log("tap value")
                            console.log("event.target", event.target)

                            touches.log.push({ "message": "tap -bar", "timestamp": Date.now() });
                            console.log("data to annotate",[event.target], null, config["Value"].measure, config["Value"].style,
                                parseFloat(event.target.getAttribute("x")), parseFloat(event.target.getAttribute("y")))
                            annotate([event.target], null, config["Value"].measure, config["Value"].style,
                                parseFloat(event.target.getAttribute("x")), parseFloat(event.target.getAttribute("y")));
                        });
                    });
            }

            // difference between two bars
            pyramid.Diff = function () {
                var items = [];
                console.log("Adding Event Handlers for Diff Annotation");
                svg.selectAll("rect")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this,
                        {
                            multiUser: true,
                            dragLockToAxis: true,
                            dragBlockHorizontal: true,
                            preventDefault: true
                        });
                        hammertime.get('press')
                            .set({
                                time: 200,
                                pointers: 1,
                                threshold: 20
                            });
                        hammertime.on("press",
                            function(event) {
                                var args = Array.prototype.slice.call(arguments);
                                event.preventDefault();
                                console.log("Firing press for " + getLabel(event.target));
                                items.push(event.target);
                                // if pressed item == 2 but are up and down
                                // if pressed item == 2 and both are up rect or down rect
                                if (items.length == 2) {
                                  console.log("items[0].className",items[0].className.baseVal)
                                  console.log("items[1].className",items[1].className.baseVal)
                                    if(items[0].className.baseVal === items[1].className.baseVal){
                                        touches.log.push({ "message": "press 2 bars -bar", "timestamp": Date.now() });
                                        annotator.annotate(items, null, config["Diff"].measure, config["Diff"].style);
                                        items = [];
                                        console.log("clearing items");
                                    }if(items[0].className.baseVal !== items[1].className.baseVal){
                                        touches.log.push({ "message": "press 2 bars -bar up and down", "timestamp": Date.now() });
                                        annotator.annotate(items, null, config["Diff"].measure, config["Diff"].style);
                                        items = [];
                                        console.log("clearing items");
                                    }

                                }
                            });
                        hammertime.on("pressup",
                            function(event) {
                                event.preventDefault();
                                index = items.findIndex(x => getLabel(x) == getLabel(event.target));
                                items.splice(index, 1);
                                if (items.length == 0) {
                                    console.log("clearing items");
                                    //annotator.clear();
                                }
                            });
                    }
                );
                svg.selectAll("rect")
                    .on("mouseup touchend",
                        function() {
                            index = items.findIndex(x => getLabel(x) == getLabel(this))
                            items.splice(index, 1);
                        });
            };

            // sort bar in ascending/descending order
            pyramid.Rank = function () {
                console.log("Adding Event Handlers for Rank Annotation");
                if (rootElement == null || typeof(element) == "undefined") {
                    rootElement = document.querySelector("svg").parentNode;
                }

                var hammertime = new Hammer(rootElement, {
                    multiUser: true, dragLockToAxis: true,
                    dragBlockHorizontal: true, preventDefault: true, domEvents: true
                });
                hammertime.get('pan').set({ enable: true, threshold:300 });
                hammertime.on("panend",
                    function(event) {
                        //DIRECTION_RIGHT   4
                        if (event.offsetDirection == 4 && Math.abs(event.angle) > 10) {
                            if (event.angle > 0) {
                                touches.log.push({ "message": "swipe down -bar", "timestamp": Date.now() });
                                annotator.annotate(getDataMarks(), null, "RankDescending", config["Rank"].style);

                            } else {
                                touches.log.push({ "message": "swipe up -bar", "timestamp": Date.now() });
                                annotator.annotate(getDataMarks(), null, "RankAscending", config["Rank"].style);
                            }
                        }
                    });
            }

            // highight values above a certain threshold
            pyramid.Threshold = function() {
                console.log("Adding Event Handlers for Threshold Annotation");
                svg.selectAll(".y .tick")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this,
                        {
                            multiUser: true,
                            dragLockToAxis: true,
                            dragBlockHorizontal: true,
                            preventDefault: true
                        });
                        hammertime.get('press')
                            .set({
                                time: 200,
                                pointers: 1,
                                threshold: 20
                            });
                        hammertime.on("press",
                           function (event) {
                               touches.log.push({ "message": "press y axis -bar", "timestamp": Date.now() });
                               annotator.annotate(getDataMarks(), [event.target], config["Threshold"].measure, config["Threshold"].style)
                           });
                    });

            }

            // highlight all values above a certain value
            pyramid.Above = function() {
                console.log("Adding Event Handlers for Above Annotation");
                svg.selectAll("rect")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this, {
                            multiUser: true, dragLockToAxis: true,
                            dragBlockHorizontal: true, preventDefault: true, domEvents: true
                        });
                        hammertime.get('pan').set({ enable: true, threshold: 30 });
                        hammertime.on("panend",
                            function(event) {
                                //DIRECTION_UP  8
                                if (event.offsetDirection == 8) {
                                    touches.log.push({ "message": "pan up -bar", "timestamp": Date.now() });
                                    annotator.annotate(getDataMarks(), [event.target], "Threshold", config["Above"].style);
                                }
                            });
                    });
            }

            // highlight all values below a certain value
            pyramid.Below = function() {
                console.log("Adding Event Handlers for Above Annotation");
                svg.selectAll("rect")
                    .each(function (d, i) {
                        var hammertime = new Hammer(this, {
                            multiUser: true, dragLockToAxis: true,
                            dragBlockHorizontal: true, preventDefault: true, domEvents: true
                        });
                        hammertime.get('pan').set({ enable: true, threshold: 30 });
                        hammertime.on("panend",
                            function (event) {
                                //DIRECTION_DOWN    16
                                if (event.offsetDirection == 16) {
                                    touches.log.push({ "message": "pan down -bar", "timestamp": Date.now() });
                                    annotator.annotate(getDataMarks(), [event.target], "ThresholdBelow", config["Above"].style);
                                }
                            });
                    });
            }


            pyramid.Mean = function() {

                console.log("Adding Event Handlers for Mean Annotation");
                if (rootElement == null || typeof (element) == "undefined") {
                    rootElement = document.querySelector("svg").parentNode;
                }
                var hammertime = new Hammer(rootElement, {
                    multiUser: true, dragLockToAxis: true,
                    dragBlockHorizontal: true, preventDefault: true, domEvents: true
                });
                hammertime.get('pan').set({ enable: true, threshold: 300 });
                hammertime.on("panend",
                    function (event) {
                      console.log("event.pointers[0].clientX",event.pointers[0].clientY)
                        //DIRECTION_RIGHT   4
                        if (event.offsetDirection == 4 && Math.abs(event.angle) < 8) {

                          touches.log.push({ "message": "swipe across -bar", "timestamp": Date.now() });
                          //pop up the button
                          // console.log("data to annotate",[event.target], null, config["Value"].measure, config["Value"].style,
                          //     parseFloat(event.target.getAttribute("x")), parseFloat(event.target.getAttribute("y")))
                          annotate([event.target], null, config["Value"].measure, config["Value"].style,
                              parseFloat(event.target.getAttribute("x")), parseFloat(event.target.getAttribute("y")));


                          // if (event.pointers[0].clientY > (height/2+margin.top)){
                            console.log( "config['Mean'].measure", config["Mean"].measure)
                            annotate(getDataMarks(),
                                null,
                                config["Mean"].measure,
                                config["Mean"].style,event.pointers[0].clientX,event.pointers[0].clientY);
                          // }

                        }
                    });
            }
            //INTERNAL METHODS
            function annotateAll(parameters) {
                pyramid.Value();
                pyramid.Diff();
                pyramid.Rank();
                pyramid.Threshold();
                pyramid.Above();
                pyramid.Below();
                pyramid.Mean();
            }

            function getLabel(m) {
                return d3.select(m).data()[0][pyramid.label];
            }

            function getDataMarks() {
                var marks = {"up":[],"down":[]};
                svg.selectAll(".bar-down")
                    .nodes()
                    .forEach(function(item, index) {
                        if (item.hasOwnProperty("__data__") && !d3.select(item).classed("annotation")) {
                            // console.log("get data mark item",item)
                            marks.down.push(item);
                        }
                    });
                svg.selectAll(".bar-up")
                    .nodes()
                    .forEach(function(item, index) {
                        if (item.hasOwnProperty("__data__") && !d3.select(item).classed("annotation")) {
                            // console.log("get data mark item",item)
                            marks.up.push(item);
                        }
                    });
                return marks;

            }

            return pyramid;

    };


    // Touch Interactions for Bar Chart
    touches.bar = function () {

            // configuration dictionary for different annotations for bar chart
            var config = {
                "Diff": { measure: "Diff", style: {} },
                "Value": { measure: "Value", style: {} },
                "Rank": { measure: "Rank", style: {} },
                "Threshold": { measure: "Threshold", style: {} },
                "Above": { measure: "Above", style: {} },
                "Below": { measure: "Below", style: {} },
                "Mean" : {measure:"Mean", style: {} }
            };

            // CONSTRUCTOR
            function bar() {

            }

            bar.label = null;
            // method for configuring individual annotation actions.
            bar.settings = function(a,setting) {
                console.log("bar setting setting:", setting)
                if (a && setting && config.hasOwnProperty(a)) {
                    if (setting.hasOwnProperty("measure")) {
                        config[a].measure = setting.measure;
                    }
                    if (setting.hasOwnProperty("style")) {
                        config[a].style = setting.style;
                    }
                }
                return bar;
            }

            // method to configure what annotations to apply
            bar.annotateFor = function(an) {
                if (an == "*") {
                    annotateAll();
                    return bar;
                } else {
                    a = an.split(" ");
                    a.forEach(function(item, index) {
                        bar[item].apply();
                    })
                }
                return bar;
            }

            bar.clear = function() {
                annotator.clear();
                return bar;
            }

            //TOUCH INTERACTIONS FOR BAR ANNOTATIONS

            // tooltip
            bar.Value = function() {
                console.log("Adding Event Handlers for Value Annotation");
                console.log("svg in value",svg)
                console.log("svg selectAllc rect",svg.selectAll('rect'))
                svg.selectAll('rect')
                    .each(function(d, i) {
                        console.log("svg select", d)
                        var hammertime = new Hammer(this, {
                            multiUser: true, dragLockToAxis: true,
                            dragBlockHorizontal: true, preventDefault: true
                        });
                        hammertime.on('tap', function (event) {
                            console.log("tap value")
                            console.log("event.target", event.target)

                            touches.log.push({ "message": "tap -bar", "timestamp": Date.now() });
                            annotate([event.target], null, config["Value"].measure, config["Value"].style,
                                parseFloat(event.target.getAttribute("x")), parseFloat(event.target.getAttribute("y")));
                        });
                    });
            }

            // difference between two bars
            bar.Diff = function () {
                var items = [];
                console.log("Adding Event Handlers for Diff Annotation");
                svg.selectAll("rect")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this,
                        {
                            multiUser: true,
                            dragLockToAxis: true,
                            dragBlockHorizontal: true,
                            preventDefault: true
                        });
                        hammertime.get('press')
                            .set({
                                time: 200,
                                pointers: 1,
                                threshold: 20
                            });
                        hammertime.on("press",
                            function(event) {
                                var args = Array.prototype.slice.call(arguments);
                                event.preventDefault();
                                console.log("Firing press for " + getLabel(event.target));
                                items.push(event.target);
                                if (items.length == 2) {
                                    touches.log.push({ "message": "press 2 bars -bar", "timestamp": Date.now() });
                                    annotator.annotate
                                    (items, null, config["Diff"].measure, config["Diff"].style);
                                    items = [];
                                    console.log("clearing items");
                                }
                            });
                        hammertime.on("pressup",
                            function(event) {
                                event.preventDefault();
                                index = items.findIndex(x => getLabel(x) == getLabel(event.target));
                                items.splice(index, 1);
                                if (items.length == 0) {
                                    console.log("clearing items");
                                    //annotator.clear();
                                }
                            });
                    }
                );
                svg.selectAll("rect")
                    .on("mouseup touchend",
                        function() {
                            index = items.findIndex(x => getLabel(x) == getLabel(this))
                            items.splice(index, 1);
                        });
            };

            // sort bar in ascending/descending order
            bar.Rank = function () {
                console.log("Adding Event Handlers for Rank Annotation");
                if (rootElement == null || typeof(element) == "undefined") {
                    rootElement = document.querySelector("svg").parentNode;
                }

                var hammertime = new Hammer(rootElement, {
                    multiUser: true, dragLockToAxis: true,
                    dragBlockHorizontal: true, preventDefault: true, domEvents: true
                });
                hammertime.get('pan').set({ enable: true, threshold:300 });
                hammertime.on("panend",
                    function(event) {
                        //DIRECTION_RIGHT	4
                        if (event.offsetDirection == 4 && Math.abs(event.angle) > 10) {
                            if (event.angle > 0) {
                                touches.log.push({ "message": "swipe down -bar", "timestamp": Date.now() });
                                annotator.annotate(getDataMarks(), null, "RankDescending", config["Rank"].style);

                            } else {
                                touches.log.push({ "message": "swipe up -bar", "timestamp": Date.now() });
                                annotator.annotate(getDataMarks(), null, "RankAscending", config["Rank"].style);
                            }
                        }
                    });
            }

            // highight values above a certain threshold
            bar.Threshold = function() {
                console.log("Adding Event Handlers for Threshold Annotation");
                svg.selectAll(".y .tick")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this,
                        {
                            multiUser: true,
                            dragLockToAxis: true,
                            dragBlockHorizontal: true,
                            preventDefault: true
                        });
                        hammertime.get('press')
                            .set({
                                time: 200,
                                pointers: 1,
                                threshold: 20
                            });
                        hammertime.on("press",
                           function (event) {
                               touches.log.push({ "message": "press y axis -bar", "timestamp": Date.now() });
                               annotator.annotate(getDataMarks(), [event.target], config["Threshold"].measure, config["Threshold"].style)
                           });
                    });

            }

            // highlight all values above a certain value
            bar.Above = function() {
                console.log("Adding Event Handlers for Above Annotation");
                svg.selectAll("rect")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this, {
                            multiUser: true, dragLockToAxis: true,
                            dragBlockHorizontal: true, preventDefault: true, domEvents: true
                        });
                        hammertime.get('pan').set({ enable: true, threshold: 30 });
                        hammertime.on("panend",
                            function(event) {
                                //DIRECTION_UP	8
                                if (event.offsetDirection == 8) {
                                    touches.log.push({ "message": "pan up -bar", "timestamp": Date.now() });
                                    annotator.annotate(getDataMarks(), [event.target], "Threshold", config["Above"].style);
                                }
                            });
                    });
            }

            // highlight all values below a certain value
            bar.Below = function() {
                console.log("Adding Event Handlers for Above Annotation");
                svg.selectAll("rect")
                    .each(function (d, i) {
                        var hammertime = new Hammer(this, {
                            multiUser: true, dragLockToAxis: true,
                            dragBlockHorizontal: true, preventDefault: true, domEvents: true
                        });
                        hammertime.get('pan').set({ enable: true, threshold: 30 });
                        hammertime.on("panend",
                            function (event) {
                                //DIRECTION_DOWN	16
                                if (event.offsetDirection == 16) {
                                    touches.log.push({ "message": "pan down -bar", "timestamp": Date.now() });
                                    annotator.annotate(getDataMarks(), [event.target], "ThresholdBelow", config["Above"].style);
                                }
                            });
                    });
            }

            bar.Mean = function() {
                console.log("Adding Event Handlers for Mean Annotation");
                if (rootElement == null || typeof (element) == "undefined") {
                    rootElement = document.querySelector("svg").parentNode;
                }
                var hammertime = new Hammer(rootElement, {
                    multiUser: true, dragLockToAxis: true,
                    dragBlockHorizontal: true, preventDefault: true, domEvents: true
                });
                hammertime.get('pan').set({ enable: true, threshold: 300 });
                hammertime.on("panend",
                    function (event) {
                        //DIRECTION_RIGHT	4
                        if (event.offsetDirection == 4 && Math.abs(event.angle) < 8) {
                            touches.log.push({ "message": "swipe across -bar", "timestamp": Date.now() });
                            annotate(getDataMarks(),
                                null,
                                config["Mean"].measure,
                                config["Mean"].style,event.pointers[0].clientX,event.pointers[0].clientY);
                        }
                    });
            }
            //INTERNAL METHODS
            function annotateAll(parameters) {
                bar.Value();
                bar.Diff();
                bar.Rank();
                bar.Threshold();
                bar.Above();
                bar.Below();
                bar.Mean();
            }

            function getLabel(m) {
                return d3.select(m).data()[0][bar.label];
            }

            function getDataMarks() {
                var marks = [];
                svg.selectAll("rect")
                    .nodes()
                    .forEach(function(item, index) {
                        if (item.hasOwnProperty("__data__") && !d3.select(item).classed("annotation")) {
                            marks.push(item);
                        }
                    });
                return marks;

            }

            return bar;

    };

    // Touch Interactions for Bar Chart
    touches.heatmap = function () {

            // configuration dictionary for different annotations for bar chart
            var config = {
                "Diff": { measure: "Diff", style: {} },
                "Value": { measure: "Value", style: {} },
                "Rank": { measure: "Rank", style: {} },
                "Threshold": { measure: "Threshold", style: {} },
                "Above": { measure: "Above", style: {} },
                "Below": { measure: "Below", style: {} },
                // "Mean" : {measure:"Mean", style: {} }
            };

            // CONSTRUCTOR
            function heatmap() {

            }

            heatmap.label = null;
            // method for configuring individual annotation actions.
            heatmap.settings = function(a,setting) {
                console.log("bar setting setting:", setting)
                if (a && setting && config.hasOwnProperty(a)) {
                    if (setting.hasOwnProperty("measure")) {
                        config[a].measure = setting.measure;
                    }
                    if (setting.hasOwnProperty("style")) {
                        config[a].style = setting.style;
                    }
                }
                return heatmap;
            }

            // method to configure what annotations to apply
            heatmap.annotateFor = function(an) {
                if (an == "*") {
                    annotateAll();
                    return heatmap;
                } else {
                    a = an.split(" ");
                    a.forEach(function(item, index) {
                        heatmap[item].apply();
                    })
                }
                return heatmap;
            }

            heatmap.clear = function() {
                annotator.clear();
                return heatmap;
            }

            //TOUCH INTERACTIONS FOR BAR ANNOTATIONS

            // tooltip
            heatmap.Value = function() {
                console.log("Adding Event Handlers for Value Annotation");
                console.log("svg in value",svg)
                console.log("svg selectAllc rect",svg.selectAll('rect'))
                svg.selectAll('rect')
                    .each(function(d, i) {
                        console.log("svg select", d)
                        var hammertime = new Hammer(this, {
                            multiUser: true, dragLockToAxis: true,
                            dragBlockHorizontal: true, preventDefault: true
                        });
                        hammertime.on('tap', function (event) {
                            console.log("tap value")
                            console.log("event.target", event.target)

                            touches.log.push({ "message": "tap -bar", "timestamp": Date.now() });
                            annotate([event.target], null, config["Value"].measure, config["Value"].style,
                                parseFloat(event.target.getAttribute("x")), parseFloat(event.target.getAttribute("y")));
                        });
                    });
            }

            // difference between two bars
            heatmap.Diff = function () {
                var items = [];
                console.log("Adding Event Handlers for Diff Annotation");
                svg.selectAll("rect")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this,
                        {
                            multiUser: true,
                            dragLockToAxis: true,
                            dragBlockHorizontal: true,
                            preventDefault: true
                        });
                        hammertime.get('press')
                            .set({
                                time: 200,
                                pointers: 1,
                                threshold: 20
                            });
                        hammertime.on("press",
                            function(event) {
                                var args = Array.prototype.slice.call(arguments);
                                event.preventDefault();
                                console.log("Firing press for " + getLabel(event.target));
                                items.push(event.target);
                                if (items.length == 2) {
                                    touches.log.push({ "message": "press 2 bars -bar", "timestamp": Date.now() });
                                    annotator.annotate
                                    (items, null, config["Diff"].measure, config["Diff"].style);
                                    items = [];
                                    console.log("clearing items");
                                }
                            });
                        hammertime.on("pressup",
                            function(event) {
                                event.preventDefault();
                                index = items.findIndex(x => getLabel(x) == getLabel(event.target));
                                items.splice(index, 1);
                                if (items.length == 0) {
                                    console.log("clearing items");
                                    //annotator.clear();
                                }
                            });
                    }
                );
                svg.selectAll("rect")
                    .on("mouseup touchend",
                        function() {
                            index = items.findIndex(x => getLabel(x) == getLabel(this))
                            items.splice(index, 1);
                        });
            };

            // sort bar in ascending/descending order
            heatmap.Rank = function () {
                console.log("Adding Event Handlers for Rank Annotation");
                if (rootElement == null || typeof(element) == "undefined") {
                    rootElement = document.querySelector("svg").parentNode;
                }

                var hammertime = new Hammer(rootElement, {
                    multiUser: true, dragLockToAxis: true,
                    dragBlockHorizontal: true, preventDefault: true, domEvents: true
                });
                hammertime.get('pan').set({ enable: true, threshold:300 });
                hammertime.on("panend",
                    function(event) {
                        //DIRECTION_RIGHT	4
                        if (event.offsetDirection == 4 && Math.abs(event.angle) > 10) {
                            if (event.angle > 0) {
                                touches.log.push({ "message": "swipe down -bar", "timestamp": Date.now() });
                                annotator.annotate(getDataMarks(), null, "RankDescending", config["Rank"].style);

                            } else {
                                touches.log.push({ "message": "swipe up -bar", "timestamp": Date.now() });
                                annotator.annotate(getDataMarks(), null, "RankAscending", config["Rank"].style);
                            }
                        }
                    });
            }

            // highight values above a certain threshold
            heatmap.Threshold = function() {
                console.log("Adding Event Handlers for Threshold Annotation");
                svg.selectAll(".y .tick")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this,
                        {
                            multiUser: true,
                            dragLockToAxis: true,
                            dragBlockHorizontal: true,
                            preventDefault: true
                        });
                        hammertime.get('press')
                            .set({
                                time: 200,
                                pointers: 1,
                                threshold: 20
                            });
                        hammertime.on("press",
                           function (event) {
                               touches.log.push({ "message": "press y axis -bar", "timestamp": Date.now() });
                               annotator.annotate(getDataMarks(), [event.target], config["Threshold"].measure, config["Threshold"].style)
                           });
                    });

            }

            // highlight all values above a certain value
            heatmap.Above = function() {
                console.log("Adding Event Handlers for Above Annotation");
                svg.selectAll("rect")
                    .each(function(d, i) {
                        var hammertime = new Hammer(this, {
                            multiUser: true, dragLockToAxis: true,
                            dragBlockHorizontal: true, preventDefault: true, domEvents: true
                        });
                        hammertime.get('pan').set({ enable: true, threshold: 30 });
                        hammertime.on("panend",
                            function(event) {
                                //DIRECTION_UP	8
                                if (event.offsetDirection == 8) {
                                    touches.log.push({ "message": "pan up -bar", "timestamp": Date.now() });
                                    annotator.annotate(getDataMarks(), [event.target], "Threshold", config["Above"].style);
                                }
                            });
                    });
            }

            // highlight all values below a certain value
            heatmap.Below = function() {
                console.log("Adding Event Handlers for Above Annotation");
                svg.selectAll("rect")
                    .each(function (d, i) {
                        var hammertime = new Hammer(this, {
                            multiUser: true, dragLockToAxis: true,
                            dragBlockHorizontal: true, preventDefault: true, domEvents: true
                        });
                        hammertime.get('pan').set({ enable: true, threshold: 30 });
                        hammertime.on("panend",
                            function (event) {
                                //DIRECTION_DOWN	16
                                if (event.offsetDirection == 16) {
                                    touches.log.push({ "message": "pan down -bar", "timestamp": Date.now() });
                                    annotator.annotate(getDataMarks(), [event.target], "ThresholdBelow", config["Above"].style);
                                }
                            });
                    });
            }

            heatmap.Mean = function() {
                console.log("Adding Event Handlers for Mean Annotation");
                if (rootElement == null || typeof (element) == "undefined") {
                    rootElement = document.querySelector("svg").parentNode;
                }
                var hammertime = new Hammer(rootElement, {
                    multiUser: true, dragLockToAxis: true,
                    dragBlockHorizontal: true, preventDefault: true, domEvents: true
                });
                hammertime.get('pan').set({ enable: true, threshold: 300 });
                hammertime.on("panend",
                    function (event) {
                        //DIRECTION_RIGHT	4
                        if (event.offsetDirection == 4 && Math.abs(event.angle) < 8) {
                            touches.log.push({ "message": "swipe across -bar", "timestamp": Date.now() });
                            annotate(getDataMarks(),
                                null,
                                config["Mean"].measure,
                                config["Mean"].style,event.pointers[0].clientX,event.pointers[0].clientY);
                        }
                    });
            }
            //INTERNAL METHODS
            function annotateAll(parameters) {
                heatmap.Value();
                heatmap.Diff();
                heatmap.Rank();
                heatmap.Threshold();
                heatmap.Above();
                heatmap.Below();
                heatmap.Mean();
            }

            function getLabel(m) {
                return d3.select(m).data()[0][heatmap.label];
            }

            function getDataMarks() {
                var marks = [];
                svg.selectAll("rect")
                    .nodes()
                    .forEach(function(item, index) {
                        if (item.hasOwnProperty("__data__") && !d3.select(item).classed("annotation")) {
                            marks.push(item);
                        }
                    });
                return marks;

            }

            return heatmap;

    };
    //// Touch Interactions for Scatter Plot

    touches.scatter = function() {

        var config = {
            "Dist": { measure: "Dist", style: {} },
            "Order": { measure: "Order", style: {} },
            "Regress": { measure: "Regress", style: {} },
            "Diff": {measure:"Diff", style:{}}
        };

        //CONSTRUCTOR
        function scatter() {

        }

        scatter.label = null;

        //method for configuring individual annotation actions
        scatter.settings = function (a, setting) {
            if (a && setting && config.hasOwnProperty(a)) {
                if (setting.hasOwnProperty("measure")) {
                    config[a].measure = setting.measure;
                }
                if (setting.hasOwnProperty("style")) {
                    config[a].style = setting.style;
                }
            }
            return scatter;
        }

        // method to configure what annotations to apply
        scatter.annotateFor = function (an) {
            if (an == "*") {
                annotateAll();
                return scatter;
            } else {
                a = an.split(" ");
                a.forEach(function (item, index) {
                    scatter[item].apply();
                })
            }
            return scatter;
        }

        scatter.clear = function () {
            annotator.clear();
            return scatter;
        }

        //TOUCH INTERACTIONS FOR SCATTER ANNOTATIONS

        //annotate number of observations in selected interval
        scatter.Dist = function () {
            console.log("Adding Event Handlers for Dist Annotation");
            var xItems = [];
            var yItems = [];

            //X- AXIS VALUES
            svg.selectAll(".x .tick")
                .each(function (d, i) {
                    var hammertime = new Hammer(this,
                           {
                               multiUser: true,
                               dragLockToAxis: true,
                               dragBlockHorizontal: true,
                               preventDefault: true,
                               stop_browser_behavior: true
                           });
                    hammertime.get('press')
                        .set({
                            time: 200,
                            pointers: 1,
                            threshold: 20
                        });
                    hammertime.on("press",
                               function (event) {
                                   var args = Array.prototype.slice.call(arguments);
                                   event.preventDefault();
                                   console.log("Firing press for " + d3.select(event.target).data()[0]);
                                   xItems.push(event.target);
                                   if (xItems.length > 0 && xItems.length <= 2) {
                                       touches.log.push({ "message": "press x -scatter", "timestamp": Date.now() });
                                       annotator.annotate(getDataMarks(), {"x": xItems}, "DistX", config["Dist"].style);
                                       xItems = [];
                                       console.log("clearing xItems");
                                   }
                               });
                    hammertime.on("pressup",
                        function (event) {
                            event.preventDefault();
                            index = xItems.findIndex(x => d3.select(x).data()[0] == d3.select(event.target).data()[0]);
                            xItems.splice(index, 1);
                            if (xItems.length == 0) {
                                console.log("clearing xItems");
                            }
                        });
                });

            //X-INTERVAL
            xTicks = [];
            var bbox;
            svg.selectAll(".x .tick").nodes().forEach(function (d, i) {
                xTicks.push({"transform":d.transform.baseVal[0].matrix.e, "data" : d3.select(d).data()[0]});
                bbox = d.getBBox();
            });
            if (xTicks && xTicks.length > 0) {
                t = xTicks[1].transform - xTicks[0].transform;
                xTicks.forEach(function (item, index) {
                    if (index == xTicks.length - 1) {
                        return
                    }
                    svg.select(".x")
                        .append("rect")
                        .attr("id", item.data + "-" + xTicks[index + 1].data)
                        .attr("height", bbox.height)
                        .attr("width", t - 2 * bbox.width)
                        .attr("fill", "transparent")
                        .attr("transform",
                            function(d) {
                                return "translate(" + (item.transform + bbox.width) + ",0)"
                            })
                        .each(function(d, i) {
                            var hammertime = new Hammer(this,
                            {
                                multiUser: true,
                                dragLockToAxis: true,
                                dragBlockHorizontal: true,
                                preventDefault: true
                            });
                            hammertime.get('press')
                                .set({
                                    time: 200,
                                    pointers: 1,
                                    threshold: 20
                                });
                            hammertime.on("press",
                               function (event) {
                                   touches.log.push({ "message": "press x interval -scatter", "timestamp": Date.now() });
                                   annotator.annotate(getDataMarks(), {"xInterval":event.target}, "DistXInterval", config["Dist"].style)
                               });
                        });

                });
            }

            //Y- INTERVAL
            yTicks = [];
            var bbox;
            svg.selectAll(".y .tick").nodes().forEach(function (d, i) {
                yTicks.push({ "transform": d.transform.baseVal[0].matrix.f, "data": d3.select(d).data()[0] });
                bbox = d.getBBox();
            });
            if (yTicks && yTicks.length > 0) {
                t = yTicks[0].transform - yTicks[1].transform;
                yTicks.forEach(function (item, index) {
                    if (index+1 >= yTicks.length) {
                        return
                    }
                    svg.select(".y")
                        .append("rect")
                        .attr("id", item.data + "-" + yTicks[index + 1].data)
                        .attr("height", bbox.width)
                        .attr("width", t - 2 * bbox.height)
                        .attr("fill", "transparent")
                        .attr("x", bbox.y)
                        .attr("transform",
                            function (d) {
                                return "translate(0," + (item.transform - 2 * bbox.height + bbox.y) + ")"
                            })
                        .each(function (d, i) {
                            var hammertime = new Hammer(this,
                            {
                                multiUser: true,
                                dragLockToAxis: true,
                                dragBlockHorizontal: true,
                                preventDefault: true
                            });
                            hammertime.get('press')
                                .set({
                                    time: 200,
                                    pointers: 1,
                                    threshold: 20
                                });
                            hammertime.on("press",
                               function (event) {
                                   touches.log.push({ "message": "press y interval -scatter", "timestamp": Date.now() });
                                   annotator.annotate(getDataMarks(), { "yInterval": event.target }, "DistYInterval", config["Dist"].style)
                               });
                        });

                });
            }

            // Y- AXIS VALUES
            svg.selectAll(".y .tick")
              .each(function (d, i) {
                  var hammertime = new Hammer(this,
                           {
                               multiUser: true,
                               dragLockToAxis: true,
                               dragBlockHorizontal: true,
                               preventDefault: true,
                               stop_browser_behavior: true
                           });
                  hammertime.get('press')
                      .set({
                          time: 200,
                          pointers: 1,
                          threshold: 20
                      });
                  hammertime.on("press",
                             function (event) {
                                 var args = Array.prototype.slice.call(arguments);
                                 event.preventDefault();
                                 console.log("Firing press for " + d3.select(event.target).data()[0]);
                                 yItems.push(event.target);
                                 if (yItems.length == 2) {
                                     touches.log.push({ "message": "press y -scatter", "timestamp": Date.now() });
                                     annotator.annotate(getDataMarks(), { "y": yItems }, "DistY", config["Dist"].style);
                                     yItems = [];
                                     console.log("clearing yItems");
                                 }
                             });
                  hammertime.on("pressup",
                      function (event) {
                          event.preventDefault();
                          index = yItems.findIndex(x => d3.select(x).data()[0] == d3.select(event.target).data()[0]);
                          yItems.splice(index, 1);
                          if (yItems.length == 0) {
                              console.log("clearing yItems");
                          }
                      });
              });

        }

        //Annotate difference between selected point and all other points
        scatter.Diff = function () {
            console.log("Adding Event Handlers for Diff Annotation");

            //svg.selectAll("circle")
            //    .each(function(d, i) {
            //        svg.select(this).append("circle")
            //    });
        }

        //Annotate order of points along x-axis
        scatter.Order = function () {
            console.log("Adding Event Handlers for Order Annotation");



        }

        //Annotate Regression Line
        scatter.Regress = function () {
            console.log("Adding Event Handlers for Regress Annotation");
            if (rootElement == null || typeof (element) == "undefined") {
                rootElement = document.querySelector("svg").parentNode;
            }
            var hammertime = new Hammer(rootElement, {
                multiUser: true, dragLockToAxis: true,
                dragBlockHorizontal: true, preventDefault: true, domEvents: true
            });
            hammertime.get('pan').set({ enable: true, threshold: 300 });
            hammertime.on("panend",
                function (event) {
                    //DIRECTION_RIGHT	4
                    if (event.offsetDirection == 4 && Math.abs(event.angle) > 10) {
                        touches.log.push({ "message": "swipe up -scatter", "timestamp": Date.now() });
                        annotator.annotate(getDataMarks(), null, config["Regress"].measure, config["Regress"].style);
                    }
                });
        }

        //INTERNAL METHODS
        function annotateAll(parameters) {
            scatter.Dist();
            scatter.Diff();
            scatter.Order();
            scatter.Regress();
        }

        function getLabel(m) {
            return d3.select(m).data()[0][scatter.label];
        }

        function getDataMarks() {
            var marks = [];
            svg.selectAll("circle")
                .nodes()
                .forEach(function (item, index) {
                    if (item.hasOwnProperty("__data__") && !d3.select(item).classed("annotation")) {
                        marks.push(item);
                    }
                });
            return marks;
        }

        return scatter;




    }

            //// Touch Interactions for Line Graph

    touches.line = function() {
        var config = {
            "Change": { measure: "Change", style: {} },
            "Threshold": { measure: "Threshold", style: {} }
        };

        function line() {

        }

        line.label = null;

        //method for configuring individual annotation actions
        line.settings = function (a, setting) {
            if (a && setting && config.hasOwnProperty(a)) {
                if (setting.hasOwnProperty("measure")) {
                    config[a].measure = setting.measure;
                }
                if (setting.hasOwnProperty("style")) {
                    config[a].style = setting.style;
                }
            }
            return line;
        }

        // method to configure what annotations to apply
        line.annotateFor = function (an) {
            if (an == "*") {
                annotateAll();
                return line;
            } else {
                a = an.split(" ");
                a.forEach(function (item, index) {
                    line[item].apply();
                })
            }
            return line;
        }

        line.clear = function () {
            annotator.clear();
            return line;
        }

        //TOUCH INTERACTIONS FOR LINE ANNOTATIONS

        //annotate change between two points on x-axis
        line.Change = function() {
            console.log("Adding Event Handlers for Change Annotation");
            var xItems = [];

            //X- AXIS VALUES
            svg.selectAll(".x .tick")
                .each(function (d, i) {
                    var hammertime = new Hammer(this,
                           {
                               multiUser: true,
                               dragLockToAxis: true,
                               dragBlockHorizontal: true,
                               preventDefault: true,
                               stop_browser_behavior: true
                           });
                    hammertime.get('press')
                        .set({
                            time: 200,
                            pointers: 1,
                            threshold: 20
                        });
                    hammertime.on("press",
                               function (event) {
                                   var args = Array.prototype.slice.call(arguments);
                                   event.preventDefault();
                                   xItems.push(event.target);
                                   if (xItems.length == 1) {
                                       touches.log.push({ "message": "press single x -line", "timestamp": Date.now() });
                                       annotator.annotate(null, { "x": xItems }, "Value", config["Change"].style);
                                   }
                                   else if (xItems.length == 2) {
                                       touches.log.push({ "message": "press x range -line", "timestamp": Date.now() });
                                       annotator.annotate(null, { "x": xItems }, "ChangeX", config["Change"].style);
                                       xItems = [];
                                       console.log("clearing xItems");
                                   }
                               });
                    hammertime.on("pressup",
                        function (event) {
                            event.preventDefault();
                            index = xItems.findIndex(x => d3.select(x).data()[0] == d3.select(event.target).data()[0]);
                            xItems.splice(index, 1);
                            if (xItems.length == 0) {
                                console.log("clearing xItems");
                            }
                        });
                });

            //X-INTERVAL
            xTicks = [];
            var bbox;
            svg.selectAll(".x .tick").nodes().forEach(function (d, i) {
                xTicks.push({ "transform": d.transform.baseVal[0].matrix.e, "data": d3.select(d).data()[0] });
                bbox = d.getBBox();
            });
            if (xTicks && xTicks.length > 0) {
                t = xTicks[1].transform - xTicks[0].transform;
                xTicks.forEach(function (item, index) {
                    if (index == xTicks.length - 1) {
                        return
                    }
                    svg.select(".x")
                        .append("rect")
                        .attr("id", item.data + "-" + xTicks[index + 1].data)
                        .attr("height", bbox.height)
                        .attr("width", t - 2 * bbox.width)
                        .attr("fill", "transparent")
                        .attr("transform",
                            function (d) {
                                return "translate(" + (item.transform + bbox.width) + ",0)"
                            })
                        .each(function (d, i) {
                            var hammertime = new Hammer(this,
                            {
                                multiUser: true,
                                dragLockToAxis: true,
                                dragBlockHorizontal: true,
                                preventDefault: true
                            });
                            hammertime.get('press')
                                .set({
                                    time: 200,
                                    pointers: 1,
                                    threshold: 20
                                });
                            hammertime.on("press",
                               function (event) {
                                   touches.log.push({ "message": "press x interval -line", "timestamp": Date.now() });
                                   annotator.annotate(null, { "xInterval": event.target }, "ChangeXInterval", config["Change"].style)
                               });
                        });

                });
            }
        }

        // annotate threshold above on y-axis
        line.Threshold = function() {
            console.log("Adding Event Handlers for Threshold Annotation");

            // Y- AXIS VALUES
            svg.selectAll(".y .tick")
              .each(function (d, i) {
                  var hammertime = new Hammer(this,
                           {
                               multiUser: true,
                               dragLockToAxis: true,
                               dragBlockHorizontal: true,
                               preventDefault: true,
                               stop_browser_behavior: true
                           });
                  hammertime.get('press')
                      .set({
                          time: 200,
                          pointers: 1,
                          threshold: 20
                      });
                  hammertime.on("press",
                             function (event) {
                                 event.preventDefault();
                                 console.log("Firing press for " + d3.select(event.target).data()[0]);
                                 touches.log.push({ "message": "press single y -line", "timestamp": Date.now() });
                                 annotator.annotate(null, { "y": event.target }, "Threshold", config["Threshold"].style);

                             });
                  //hammertime.on("pressup",
                  //    function (event) {
                  //        event.preventDefault();
                  //        index = yItems.findIndex(x => d3.select(x).data()[0] == d3.select(event.target).data()[0]);
                  //        yItems.splice(index, 1);
                  //        if (yItems.length == 0) {
                  //            console.log("clearing yItems");
                  //        }
                  //    });
              });
        }


        //INTERNAL METHODS
        function annotateAll(parameters) {
            line.Change();
            line.Threshold();
        }

        function getLabel(m) {

        }

        function getData() {
            data = null;
            d3.selectAll("path").nodes().forEach(function (item, index) {
                if (item.hasOwnProperty("__data__") && item.__data__ && item.__data__.length > 0) {
                    data = item.__data__;
                }
            })
            return data;
        }

        return line;

    };


        return touches;
    }
}));
