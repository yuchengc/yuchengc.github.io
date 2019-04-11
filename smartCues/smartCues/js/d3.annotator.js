;(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module with d3 as a dependency.
        define([
          'd3-collection',
          'd3-selection'
        ], factory)
    } else if (typeof module === 'object' && module.exports) {
        /* eslint-disable global-require */
        // CommonJS
        var d3Collection = require('d3-collection'),
            d3Selection = require('d3-selection')
        module.exports = factory(d3Collection, d3Selection)
        /* eslint-enable global-require */
    } else {
        // Browser global.
        var d3 = root.d3
        // eslint-disable-next-line no-param-reassign
        root.d3.annotator = factory(d3, d3);
    }
}(this, function (d3Collection, d3Selection) {
    //target is the name of the schema that is being annotated (bar, scatter, line, etc.)
    return function (target) {

        // INTERNAL PROPERTIES
        var svg = null,
            rootElement = document.body, // need this to append annotations
            instance = null,
            clearAnnotationTimer,
            history = [],
            clearAnnotaitonsTimer = null;

        // PUBLIC PROPERTIES
        annotator.target = target; // type of chart being annotated
        annotator.className = "annotation"; // class name that will be assigned to all annotated elements
        annotator.interaction = null; //function that can be used for selection over annotation
        annotator.label = null; // mark identifier attribute in data
        annotator.hist = true;
        annotator.autoClear = false;
        annotator.timeoutInterval = 3000;
        annotator.current = null;
        // CLASS INSTANTIATION
        function annotator(vis) {
            svg = getSVGNode(vis)
            if (!svg) return;
            //If target is defined, we instantiate the schema instance.
            if (target && instance == null) {
                instance = annotator[target].call();
                console.log("annotator",annotator[target])
                console.log("Annotator Instance Created")
            }
            return annotator;
        }

        // PUBLIC METHODS

        //generic method to set attributes for annotator, and all of its instances.
        annotator.attr = function (property, value) {
          console.log("annotator property", property)
            if (annotator.hasOwnProperty(property)) {
                annotator[property] = value;

            }

            if (instance.hasOwnProperty(property)) {
                instance[property] = value;
            }
            console.log("instance",instance)
            console.log("annotator attr",   instance[property] ,value )
            return annotator;
        }

        //root html div that contains the graph
        annotator.rootElement = function (v) {
            if (!arguments.length) return rootElement
            rootElement = v == null ? v : functor(v)
            return annotator
        }

        // execute a specific annotations on the instance
        annotator.annotate = function (marks, constraints, intent, options, region) {

            // 1. check if there is an exisitng annotation
            // 2. if yes, check if this intent is a candidate for multi-layer annotations
            // 3. if yes, cancel timeout for clear, process multilayer annotation.
            // 4. If no to step 2, clear current annotation, and check if intent is a candidate for query expansion.
            // 5. if yes, call generalized version of annotation
            // 6. if no, call annotation

            //Stop AutoClear
            if (clearAnnotationTimer) {
                clearTimeout(clearAnnotaitonsTimer);
            }
            if (annotator.current) { // there is an annotation present and has not been cleared out yet.
                route = instance.isMultiLayer(annotator.current.intent);
                if (route && route.length > 0) {
                    route.forEach(function(item, index) {
                        if (item.interact == intent) {
                            instance[item.intent].call(this, marks, constraints, options);
                        }
                        history.push(intent);
                    });
                }
                else {
                    annotator.clear();
                    generalizedIntent = instance.isGeneralizable(intent);
                    if (generalizedIntent &&
                        history.length >= 2 &&
                        history[history.length - 1] == intent &&
                        history[history.length - 2] == intent) {
                        annotator.current = { marks: marks, constraints: constraints, intent: intent, options: options, region:region };
                        instance[generalizedIntent].call(this, marks, constraints, options, region);
                        //clear history stack
                        history = [];
                    } else {
                        console.log("Annotating for" + intent);
                        annotator.current = { marks: marks, constraints: constraints, intent: intent, options: options, region:region };
                        instance[intent].call(this, marks, constraints, options,region);
                        if (annotator.autoClear) {
                            clearAnnotaitonsTimer = setTimeout(annotator.clear, annotator.timeoutInterval);
                        }
                        history.push(intent);
                    }
                    addClearButton();
                }
            } else {
                annotator.clear();
                generalizedIntent = instance.isGeneralizable(intent);
                if (generalizedIntent &&
                    history.length >= 2 &&
                    history[history.length - 1] == intent &&
                    history[history.length - 2] == intent) {
                    annotator.current = { marks: marks, constraints: constraints, intent: intent, options: options, region:region };
                    instance[generalizedIntent].call(this, marks, constraints, options,region);
                    //clear history stack
                    history = [];
                } else {
                    console.log("Annotating for " + intent);
                    annotator.current = { marks: marks, constraints: constraints, intent: intent, options: options, region:region };
                    console.log("annotator.current" + annotator.current);
                    instance[intent].call(this, marks, constraints, options, region);
                    if (annotator.autoClear) {
                        clearAnnotaitonsTimer = setTimeout(annotator.clear, annotator.timeoutInterval);
                    }
                    history.push(intent);
                }
                addClearButton();
            }
            //history.push(intent);
            return annotator;
        }

        //clear all annotations.
        annotator.clear = function () {
            if (clearAnnotationTimer) {
                clearTimeout(clearAnnotaitonsTimer);
            }
            annotator.current = null;
            d3.selectAll(".annotation").remove();
            d3.selectAll(".clearBtnAnnotation").remove();
            console.log("clearing annotations");
            instance.clear();
            return annotator;
        }

        annotator.showTooltip = function (annotationTarget) {
            d3.selectAll(".multiItem").remove();
            // add result text
            node = d3.select(annotationTarget.parentNode)
                .append("text")
                .attr("class", "annotation multiItem")
                .attr("x", annotationTarget.getBBox().x)
                .attr("y", annotationTarget.getBBox().y + annotationTarget.getBBox().height*.1)
                .attr("dy", ".35em")
                .attr("font-size", "16px")
                .text(annotationTarget.id);

            bbox = node._groups[0][0].getBBox();

            //add rectangle around result
            d3.select(annotationTarget.parentNode)
                .insert('rect', ".multiItem")
                .attr("class", "annotation multiItem")
                .attr('x', bbox.x - 5)
                .attr('y', bbox.y - 5)
                .attr('width', bbox.width + 10)
                .attr('height', bbox.height + 10)
                .attr('stroke', "black")
                .attr("fill", "#eeff82");
        }

        //PRIVATE METHODS
        function getSVGNode(element) {
            var svgNode = element.node()
            if (!svgNode) return null
            if (svgNode.tagName.toLowerCase() === 'svg') return svgNode
            return svgNode.ownerSVGElement
        }

        function functor(v) {
            return typeof v === 'function' ? v : function () {
                return v
            }
        }

        String.prototype.format = function () {
            var formatted = this;
            for (var arg in arguments) {
                formatted = formatted.replace("{" + arg + "}", arguments[arg]);
            }
            return formatted;
        };

        function clone(node) {
            if (node) {
                var attr = node.attributes;
                var length = attr.length;
                var node_name = node.nodeName;
                var cloned = d3.select(node.parentNode)
                    .append(node_name)
                    .attr("class", "annotation");
                for (var j = 0; j < length; j++) { // Iterate on attributes and skip on "id"
                    if (attr[j].nodeName == "class") continue;
                    cloned.attr(attr[j].name, attr[j].value);
                }
                return cloned;
            }
        }

        function addClearButton() {
            d3.selectAll(".clearBtnAnnotation").remove();

            node = d3.select(svg)
                .append("text")
                .attr("class", "clearBtnAnnotation")
                .attr("x", svg.getAttribute("width") - 80)
                .attr("y", 20)
                .attr("dy", ".35em")
                .attr("font-size", "16px")
                .text("CLEAR").on("click", function (d) {
                    annotator.clear();
                });

            bbox = node._groups[0][0].getBBox();

            //add rectangle around result
            d3.select(svg)
                .insert('rect', ".clearBtnAnnotation")
                .attr("class", "clearBtnAnnotation")
                .attr('x', bbox.x - 25/2)
                .attr('y', bbox.y - 15/2)
                .attr('width', bbox.width + 25)
                .attr('height', bbox.height + 15)
                .attr('stroke', "black")
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("fill", "white").on("click", function(d) {
                    annotator.clear();
                });
        }

        Array.prototype.clean = function (deleteValue) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] == deleteValue) {
                    this.splice(i, 1);
                    i--;
                }
            }
            return this;
        };
        Array.prototype.last = function () {
            return this[this.length - 1];
        }
        d3.selection.prototype.moveToFront = function () {
            return this.each(function () {
                this.parentNode.appendChild(this);
            });
        };
        d3.selection.prototype.moveToBack = function () {
            return this.each(function () {
                var firstChild = this.parentNode.firstChild;
                if (firstChild) {
                    this.parentNode.insertBefore(this, firstChild);
                }
            });
        };
 ////Annotations for BUBBLE CHART
annotator.bubble = function () {
    var rules = {
        "Diff": { generalize: "DiffGeneralized" },
        "Value" : {generalize: "ValueGeneralized"}
    };
    //ATTRIBUTES
    bubble.value = null;
    bubble.label = null;
    bubble.data = d3.selectAll("circle").data();
    if (bubble.data) {
        bubble.data.clean(undefined);
    }
    // CLASS INSTANTIATION
    function bubble() {
        //bar.data = d3.selectAll("rect").data();
        //if (data) {
        //    data.clean(undefined);
        //}
    }
    //MEASURE

    // Computes the difference between two bars
    bubble.Diff = function(marks, constraints, options) {
           if (marks.length == 2) {
               d = getValue(marks[0]) - getValue(marks[1]);
               if (options && options.hasOwnProperty("rounding")) {
                   d = d.toFixed(options.rounding);
               }
               result = "{0} - {1} : {2} ".format(getLabel(marks[0]), getLabel(marks[1]), d)
               console.log("The difference is " + d);
               if (options && options.hasOwnProperty("unit")) {
                   result += options.unit;
               }
               bubble.AnnotateDiff(result, marks, constraints, options);
           }
    }

    //Computes the percentage difference between two values
    bubble.PercentDiff = function(marks, constraints, options) {
        //d3.select(event.target).data()
    }


    bubble.DiffGeneralized = function(marks, constraints, options,region) {
        if (marks.length == 2) {
            bar1 = getValue(marks[0]);
            diffs = []
            bubble.data.forEach(function(item, index) {
                bar2 = item[bubble.value];
                diff = Math.abs(bar1 - bar2);
                result = "{0} - {1} : {2} ".format(getLabel(marks[0]),
               item[bubble.label],
               options.hasOwnProperty("rounding") ? diff.toFixed(options.rounding) : diff);
                if (options && options.hasOwnProperty("unit")) {
                    result += options.unit;
                }
                diffs.push({
                    diff: diff,
                    data: item,
                    isGreater: bar2 > bar1,
                    marks:marks,
                    result: result
                });
            });

            bubble.AnnotateDiffGeneralized(diffs, marks, constraints, options,region);
        }
    }
    bubble.Value = function(marks, constraints, options) {
        if (marks && marks.length == 1) {
            result = getValue(marks[0]).toString();
            if (options && options.hasOwnProperty("unit")) {
                result += options.unit;
            }
            bubble.AnnotateValue(result, marks, constraints, options);
        }
    }

    bubble.ValueGeneralized = function (marks, constraints, options) {

        getDataMarks()
            .forEach(function(item, index) {
                result = getValue(item).toString();
                if (options && options.hasOwnProperty("unit")) {
                    result += options.unit;
                }
                if (getLabel(item) == getLabel(marks[0])) {
                    bubble.AnnotateValue(result, [item], constraints, options);
                } else {
                    bubble.AnnotateValue(result, [item], constraints, { "highlight": "transparent" });
                }

            });
        //if (marks && marks.length == 1) {
        //    result = getValue(marks[0]).toString();
        //    if (options && options.hasOwnProperty("unit")) {
        //        result += options.unit;
        //    }
        //    bar.AnnotateValue(result, marks, constraints, options);
        //}
    }

    bubble.Rank = function (marks, constraints, options) {
        bubble.RankAscending(marks, constraints, options);
    }

    bbubblear.RankDescending = function(marks,constraints,options) {
        //var data = []
        //marks.forEach(function(item, index) {
        //    data.push(d3.select(item).data()[0]);
        //});
        bubble.data.sort(function (a, b) { return parseFloat(a[bubble.value]) - parseFloat(b[bubble.value]); });
        bubble.data.forEach(function(item, index) {
            item["rank"] = bubble.data.length - index;
        });
        bbubblear.AnnotateRank(bubble.data, marks, constraints, options);
    }

    bubble.RankAscending = function (marks, constraints, options) {
        //var data = []
        //marks.forEach(function (item, index) {
        //    data.push(d3.select(item).data()[0]);
        //});
        bubble.data.sort(function (a, b) { return parseFloat(a[bar.value]) - parseFloat(b[bar.value]); });
        bubble.data.forEach(function (item, index) {
            item["rank"] = index+1;
        });
        bubble.AnnotateRank(bubble.data, marks, constraints, options);
    }
    //ANNOTATIONS
    bubble.AnnotateValue = function (result, marks, constraints, options) {

        if (result == null || typeof(result) == "undefined") {
            return;
        }

        node = d3.select(marks[0].parentNode)
            .append("text")
            .attr("class", "annotation result")
            .attr("x", ((parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                - (result.length * 4)))
            .attr("y", parseFloat(marks[0].getAttribute("y")) - 30)
            .attr("dy", ".35em")
            .attr("font-size", getStyle("font-size", "16px", options))
            .text(result);

        bbox = node._groups[0][0].getBBox();

        //add rectangle around result
        d3.select(marks[0].parentNode)
            .insert('rect', ".result")
            .attr("class", "annotation result")
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 5)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 10)
            .attr('stroke', "black")
            .attr("fill", getStyle("fill", "#eeff82", options));

        clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
    }

    bubble.AnnotateDiffGeneralized = function (result, marks, constraints, options) {

        n = d3.selectAll(".difference").nodes();
        if (n.length > 0) {
            d3.selectAll(".difference")
                .attr("height", 0)
                .transition()
                .duration(2000);
        }
        parentNode = marks[0].parentNode;
        d3.selectAll(".annotation").remove();
        parentNode.appendChild(marks[0]);
        xScale = d3.select(".x").node().__axis;
        yScale = d3.select(".y").node().__axis;
        var tooltip = null;
        d3.selectAll(" svg circle")
            .nodes()
            .forEach(function (item, index) {
                itemdata = d3.select(item).data()[0];
                if (itemdata) {
                    c = clone(item).node();
                    c.__data__ = itemdata;

                    annotator.interaction.call(this,
                        c,
                        function (target) {
                            bubble.DiffGeneralized([target, null], constraints, options);
                        })
                }
            });

        result.forEach(function(item, index) {
            if (item.data[bar.label] == getLabel(marks[0])) {
                clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
            } else {


                rect = d3.select(parentNode)
                    .append("rect")
                    .attr("id", item.result)
                    .attr("class", "annotation difference")
                    .attr("x", parseInt(xScale(item.data[bar.label]) - item.marks[0].getBBox().width / 2))
                    .attr("width", item.marks[0].getBBox().width)
                    .attr("fill",
                        item.isGreater
                        ? setAlphaColor("rgb(66, 228, 232)")
                        : setAlphaColor("rgb(255, 69, 69)"))
                    .attr("y", yScale(item.data[bar.value]))
                    .transition()
                    .duration(300)
                    //.delay(index * 50)
                    .attr("y",
                        item.isGreater
                        ? yScale(item.data[bar.value])
                        : yScale(item.data[bar.value] + item.diff))
                    .attr("height",
                        item.isGreater
                        ? Math.abs(yScale(item.data[bar.value]) - yScale(item.data[bar.value] - item.diff))
                        : Math.abs(yScale(item
                                .data[bar.value] +
                                item.diff) -
                            yScale(item.data[bar.value])));

                annotator.interaction.call(this, rect.node(), annotator.showTooltip);
                if (marks[1] && item.data[bar.label] == getLabel(marks[1])) {
                    tooltip = rect.node();
                }
            }
        });

        //add horizontal threshold line
        d3.select(marks[0].parentNode)
            .append("line")
            .attr("class", "annotation hLine")
            .attr("y1", yScale(getValue(marks[0])))
            .attr("x1", 0)
            .attr("y2", yScale(getValue(marks[0])))
            .attr("x2", parseFloat(svg.getAttribute("width")))
            .style("stroke", getStyle("stroke", "black", options))
            .style("stroke-width", getStyle("stroke-width", "1.5", options));
        if (tooltip) {
            annotator.showTooltip(tooltip);
        }
    }

    bubble.AnnotateDiff = function (result, marks, constraints, options) {

        // add vertical lines from bar
        d3.select(marks[0].parentNode).selectAll(".vLine")
            .data(marks)
            .enter()
            .append("line")
            .attr("class", "annotation vLine")
            .attr("x1", function(d) {
                 return parseFloat(d.getAttribute("x")) + parseFloat(d.getAttribute("width")) / 2;
            })
            .attr("y1", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
            .attr("x2", function(d) {
                return parseFloat(d.getAttribute("x")) + parseFloat(d.getAttribute("width")) / 2;
            })
            .attr("y2", function(d) { return parseFloat(d.getAttribute("y")); })
            .style("stroke", getStyle("stroke", "black", options))
            .style("stroke-width", getStyle("stroke-width","1.5", options));


        //add horizontal connecting line
        d3.select(marks[0].parentNode)
            .append("line")
            .attr("class", "annotation hLine")
            .attr("y1", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
            .attr("x1", parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
            .attr("y2", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
            .attr("x2", parseFloat(marks[1].getAttribute("x")) + parseFloat(marks[1].getAttribute("width")) / 2)
            .style("stroke", getStyle("stroke", "black", options))
            .style("stroke-width", getStyle("stroke-width", "1.5", options));

        // add result text
        node = d3.select(marks[0].parentNode)
            .append("text")
            .attr("class", "annotation result")
            .attr("x", ((parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                + (parseFloat(marks[1].getAttribute("x")) + parseFloat(marks[1].getAttribute("width")) / 2)) / 2 - (result.length*4))
            .attr("y", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 30)
            .attr("dy", ".35em")
            .attr("font-size", getStyle("font-size", "16px", options))
            .text(result);

        bbox = node._groups[0][0].getBBox();

        //add rectangle around result
        d3.select(marks[0].parentNode)
            .insert('rect', ".result")
            .attr("class", "annotation result")
            .attr('x', bbox.x-5)
            .attr('y', bbox.y-5)
            .attr('width', bbox.width+10)
            .attr('height', bbox.height + 10)
            .attr('stroke', "black")
            .attr("fill", getStyle("fill", "#eeff82", options));

        // highlight bars
        clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
        clone(marks[1]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));

    }

    bubble.AnnotateRank = function(result, marks, constraints, options) {
        var color = d3.scaleLinear().domain([1, result.length+1])
                                   .range([getStyle("gradientStart", "rgb(217, 239, 192)", options), getStyle("gradientStop", "rgb(113, 179, 36)", options)]);
        marks.forEach(function (mark, index) {
            r = result.filter(function(v) {
                return v[bar.value] == getValue(mark);
            })[0];
            if (marks.length > 1) {
                clone(mark)
                    .style("fill",
                        function(d) {
                            return color(r.rank)
                        });
            } else {
                clone(mark)
                    .style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
            }

            bar.AnnotateValue(r.rank.toString(), [mark], constraints, { "highlight": "transparent"});


        });
    }
    return bubble

}

/////Annotationd for Pyramid chart
annotator.pyramid = function () {

    var rules = {
        "Diff": { generalize: "DiffGeneralized" },
        "Value" : {generalize: "ValueGeneralized"}
    };

                //ATTRIBUTES
                pyramid.valueUp = null;
                pyramid.valueDown = null;
                pyramid.label = null;
                pyramid.data = d3.selectAll(".bar-up").data();
                if (pyramid.data) {
                    pyramid.data.clean(undefined);
                }
                console.log("pyramid.data",pyramid.data)
                // CLASS INSTANTIATION
                function pyramid() {
                    //bar.data = d3.selectAll("rect").data();
                    //if (data) {
                    //    data.clean(undefined);
                    //}
                }

                //MEASURE

                // Computes the difference between two bars
                pyramid.Diff = function(marks, constraints, options) {
                      let regionIndexOne,regionIndexTwo;
                      // (region < 400)?regionIndex="valueTop":regionIndex="valueDown";
                       if (marks.length == 2) {
                         marks[0].classList.contains("bar-up")?regionIndexOne="valueTop":regionIndexOne="valueDown";
                         marks[1].classList.contains("bar-up")?regionIndexTwo="valueTop":regionIndexTwo="valueDown";
                         // console.log("marks[0] & marks[1]",marks[0], marks[1])

                           d = getValue(marks[0], regionIndexOne) - getValue(marks[1], regionIndexTwo);
                           if (options && options.hasOwnProperty("rounding")) {
                               d = d.toFixed(options.rounding);
                           }
                           result = "{0} - {1} : {2} ".format(getLabel(marks[0]), getLabel(marks[1]), d)
                           // console.log("The difference is " + d);
                           if (options && options.hasOwnProperty("unit")) {
                               result += options.unit;
                           }
                           if(regionIndexOne === regionIndexTwo){
                             pyramid.AnnotateDiff(result, marks, constraints, options);
                           }else{
                             pyramid.AnnotateDiffTwoSide(result, marks, constraints, options);
                           }

                       }
                }

                //Computes the percentage difference between two values
                pyramid.PercentDiff = function(marks, constraints, options) {
                    //d3.select(event.target).data()
                }


                pyramid.DiffGeneralized = function(marks, constraints, options,region) {
                  console.log("DiffGeneralized marks[0] & marks[1]",marks[0].classList[0], marks[1].classList[0])

                    if (marks.length == 2 && marks[0].classList[0] ==  marks[1].classList[0] ) {
                        let regionIndex
                        marks[0].classList[0]==="bar-up"?regionIndex="valueTop":regionIndex="valueDown"
                        // marks[0].classList[0]==="bar-up"?dataIndex="up":dataIndex="down"
                        bar1 = getValue(marks[0],regionIndex);
                        diffs = []
                        console.log("pyramid.data[regionIndex]",pyramid.data)
                        pyramid.data.forEach(function(item, index) {
                          console.log("pyramid.value",pyramid)
                            bar2 = item[regionIndex];
                            diff = Math.abs(bar1 - bar2);
                            result = "{0} - {1} : {2} ".format(getLabel(marks[0]),
                           item[pyramid.label],
                           options.hasOwnProperty("rounding") ? diff.toFixed(options.rounding) : diff);
                            if (options && options.hasOwnProperty("unit")) {
                                result += options.unit;
                            }
                            diffs.push({
                                diff: diff,
                                data: item,
                                isGreater: bar2 > bar1,
                                marks:marks,
                                result: result
                            });
                        });
                        console.log("diffs result",diffs)
                        pyramid.AnnotateDiffGeneralized(diffs, marks, constraints, options,region);
                    }
                }

                pyramid.Value = function(marks, constraints, options, region) {
                    let regionIndex;
                    (region < 400)?regionIndex="valueTop":regionIndex="valueDown";
                    if (marks && marks.length == 1) {
                        console.log("instance Value data",marks)
                        result = getValue(marks[0],regionIndex).toString();
                        if (options && options.hasOwnProperty("unit")) {
                            result += options.unit;
                        }
                        pyramid.AnnotateValue(result, marks, constraints, options);
                    }
                }

                pyramid.ValueGeneralized = function (marks, constraints, options) {
                  let regionIndex;
                  (region < 400)?regionIndex="valueTop":regionIndex="valueDown";
                    getDataMarks()
                        .forEach(function(item, index) {
                            result = getValue(item,regionIndex).toString();
                            if (options && options.hasOwnProperty("unit")) {
                                result += options.unit;
                            }
                            if (getLabel(item) == getLabel(marks[0])) {
                                pyramid.AnnotateValue(result, [item], constraints, options);
                            } else {
                                pyramid.AnnotateValue(result, [item], constraints, { "highlight": "transparent" });
                            }

                        });
                    //if (marks && marks.length == 1) {
                    //    result = getValue(marks[0]).toString();
                    //    if (options && options.hasOwnProperty("unit")) {
                    //        result += options.unit;
                    //    }
                    //    bar.AnnotateValue(result, marks, constraints, options);
                    //}
                }

                pyramid.Rank = function (marks, constraints, options) {
                    pyramid.RankAscending(marks, constraints, options);
                }

                pyramid.RankDescending = function(marks,constraints,options) {
                    //var data = []
                    //marks.forEach(function(item, index) {
                    //    data.push(d3.select(item).data()[0]);
                    //});
                    pyramid.data.sort(function (a, b) { return parseFloat(a[pyramid.value]) - parseFloat(b[pyramid.value]); });
                    pyramid.data.forEach(function(item, index) {
                        item["rank"] = pyramid.data.length - index;
                    });
                    pyramid.AnnotateRank(pyramid.data, marks, constraints, options);
                }

                pyramid.RankAscending = function (marks, constraints, options) {
                    //var data = []
                    //marks.forEach(function (item, index) {
                    //    data.push(d3.select(item).data()[0]);
                    //});
                    pyramid.data.sort(function (a, b) { return parseFloat(a[pyramid.value]) - parseFloat(b[pyramid.value]); });
                    pyramid.data.forEach(function (item, index) {
                        item["rank"] = index+1;
                    });
                    pyramid.AnnotateRank(pyramid.data, marks, constraints, options);
                }

                pyramid.Threshold = function(marks, constraints, options) {
                    if (constraints && constraints.length == 1) {
                        var threshold;
                        if (constraints[0].nodeName == "text") {
                            threshold = d3.select(constraints[0]).data()[0];
                        } else {
                            threshold = getValue(constraints[0]);
                        }
                        var tVal = "> ";
                        tVal += threshold.toString();
                        if (options && options.hasOwnProperty("unit")) {
                            tVal += options.unit;
                        }

                        pyramid.data.forEach(function (item, index) {
                            item["threshold"] = parseFloat(item[pyramid.value]) > parseFloat(threshold);
                            item["tval"] = tVal;
                        });
                        pyramid.AnnotateThreshold(pyramid.data, marks, constraints, options);
                    }
                }

                pyramid.ThresholdBelow = function(marks, constraints, options) {
                    if (constraints && constraints.length == 1) {
                        var threshold;
                        if (constraints[0].nodeName == "text") {
                            threshold = d3.select(constraints[0]).data()[0];
                        } else {
                            threshold = getValue(constraints[0]);
                        }
                        var tVal = "< ";
                        tVal += threshold.toString();
                        if (options && options.hasOwnProperty("unit")) {
                            tVal += options.unit;
                        }
                        pyramid.data.forEach(function (item, index) {
                            item["threshold"] = parseFloat(item[pyramid.value]) < parseFloat(threshold);
                            item["tval"] = tVal;
                        });
                        pyramid.AnnotateThreshold(pyramid.data, marks, constraints, options);
                    }
                }

                pyramid.Mean = function(marks, constraints, options, region) {

                    var total = 0;
                    console.log("Mean pyramid.data",pyramid.data)
                    if(region<400){
                      for(i = 0; i < pyramid.data.length; i += 1) {
                          total += pyramid.data[i][pyramid.valueUp];
                      }
                    }
                    else{
                      for(i = 0; i < pyramid.data.length; i += 1) {
                          total += pyramid.data[i][pyramid.valueDown];
                      }
                    }

                    mean = total / pyramid.data.length;
                    mean = mean.toFixed(2)
                    console.log("region",region)
                    pyramid.AnnotateMean({ val: mean, text: "Mean = {0} ".format(mean) },marks,constraints,options, region);
                }
                pyramid.BothMean = function(marks, constraints, options, region) {
                    var total = 0;
                    console.log("pyramid.data",pyramid.data)
                    mean=pyramid.data.map((d)=>{
                      console.log(" d.valueTop+d.valueDown", d.valueTop+d.valueDown)
                      return (d.valueTop+d.valueDown).toFixed(2)
                    })
                    // mean = mean.toFixed(2)
                    // if(region<400){
                    //   for(i = 0; i < pyramid.data.length; i += 1) {
                    //       total += pyramid.data[i][pyramid.valueUp];
                    //   }
                    // }
                    // else{
                    //   for(i = 0; i < pyramid.data.length; i += 1) {
                    //       total += pyramid.data[i][pyramid.valueDown];
                    //   }
                    // }
                    //
                    // mean = total / pyramid.data.length;
                    // mean = mean.toFixed(2)
                    // console.log("region",region)
                    pyramid.AnnotateBothMean({ val: mean, text: "Mean = {0} ".format(mean) },marks,constraints,options, region);
                }

                pyramid.Median = function(marks, constraints, options,region) {
                    var median = 0,
                        numsLen = pyramid.data.length;
                    pyramid.data.sort();
                    if (numsLen % 2 === 0) { // is even
                        // average of two middle numbers
                        median = (pyramid.data[numsLen / 2 - 1] + pyramid.data[numsLen / 2]) / 2;
                    } else { // is odd
                        // middle number only
                        median = pyramid.data[(numsLen - 1) / 2];
                    }
                    pyramid.AnnotateMean({ val: median, text: "Median = {0} ".format(median) }, marks, constraints, options,region);
                }

                //ANNOTATIONS
                pyramid.AnnotateValue = function (result, marks, constraints, options) {

                    if (result == null || typeof(result) == "undefined") {
                        return;
                    }

                    node = d3.select(marks[0].parentNode)
                        .append("text")
                        .attr("class", "annotation result")
                        .attr("x", ((parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                            - (result.length * 4)))
                        .attr("y", parseFloat(marks[0].getAttribute("y")) - 30)
                        .attr("dy", ".35em")
                        .attr("font-size", getStyle("font-size", "16px", options))
                        .text(result);

                    bbox = node._groups[0][0].getBBox();

                    //add rectangle around result
                    d3.select(marks[0].parentNode)
                        .insert('rect', ".result")
                        .attr("class", "annotation result")
                        .attr('x', bbox.x - 5)
                        .attr('y', bbox.y - 5)
                        .attr('width', bbox.width + 10)
                        .attr('height', bbox.height + 10)
                        .attr('stroke', "black")
                        .attr("fill", getStyle("fill", "#eeff82", options));

                    clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                }

                pyramid.AnnotateDiffGeneralized = function (result, marks, constraints, options, region) {
                    let regionIndex
                    marks[0].classList[0]==="bar-up"?regionIndex="valueTop":regionIndex="valueDown"
                    n = d3.selectAll(".difference").nodes();
                    if (n.length > 0) {
                        d3.selectAll(".difference")
                            .attr("height", 0)
                            .transition()
                            .duration(2000);
                    }
                    console.log(" marks[0]", marks[0])
                    parentNode = marks[0].parentNode;
                    d3.selectAll(".annotation").remove();
                    parentNode.appendChild(marks[0]);
                    xScale = d3.select(".x").node().__axis;
                    console.log("xScale",xScale)
                    yScale = d3.select(".y").node().__axis;
                    var tooltip = null;
                    d3.selectAll(`svg .${regionIndex}`)
                        .nodes()
                        .forEach(function (item, index) {
                            itemdata = d3.select(item).data()[0];
                            if (itemdata) {
                                c = clone(item).node();
                                c.__data__ = itemdata;

                                annotator.interaction.call(this,
                                    c,
                                    function (target) {
                                        pyramid.DiffGeneralized([target, null], constraints, options,region);
                                    })
                            }
                        });

                    result.forEach(function(item, index) {
                      console.log("item",item.marks[1].getBBox())
                      console.log("xScale(item.data[pyramid.label])", item.data[pyramid.label])
                        if (item.data[pyramid.label] == getLabel(marks[0])) {
                            clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                        } else {


                            rect = d3.select(parentNode)
                                .append("rect")
                                .attr("id", item.result)
                                .attr("class", "annotation difference")
                                .attr("x", parseInt(xScale(item.data[pyramid.label]) - item.marks[0].getBBox().width / 2)+2)
                                .attr("width", item.marks[0].getBBox().width)
                                .attr("fill",
                                    item.isGreater
                                    ? setAlphaColor("rgb(66, 228, 232)")
                                    : setAlphaColor("rgb(255, 69, 69)"))
                                .attr("y", yScale(item.data[regionIndex]))
                                .transition()
                                .duration(300)
                                //.delay(index * 50)
                                .attr("y",
                                    item.isGreater
                                    ? yScale(item.data[regionIndex])
                                    : yScale(item.data[regionIndex] + item.diff))
                                .attr("height",
                                    item.isGreater
                                    ? Math.abs(yScale(item.data[regionIndex]) - yScale(item.data[regionIndex] - item.diff))
                                    : Math.abs(yScale(item
                                            .data[regionIndex] +
                                            item.diff) -
                                        yScale(item.data[regionIndex])));

                            annotator.interaction.call(this, rect.node(), annotator.showTooltip);
                            if (marks[1] && item.data[pyramid.label] == getLabel(marks[1])) {
                                tooltip = rect.node();
                            }
                        }
                    });

                    //add horizontal threshold line
                    d3.select(marks[0].parentNode)
                        .append("line")
                        .attr("class", "annotation hLine")
                        .attr("y1", yScale(getValue(marks[0],regionIndex)))
                        .attr("x1", 0)
                        .attr("y2", yScale(getValue(marks[0],regionIndex)))
                        .attr("x2", parseFloat(svg.getAttribute("width")))
                        .style("stroke", getStyle("stroke", "black", options))
                        .style("stroke-width", getStyle("stroke-width", "1.5", options));
                    if (tooltip) {
                        annotator.showTooltip(tooltip);
                    }
                }
                pyramid.AnnotateDiff = function (result, marks, constraints, options) {

                    // add vertical lines from bar
                    d3.select(marks[0].parentNode).selectAll(".vLine")
                        .data(marks)
                        .enter()
                        .append("line")
                        .attr("class", "annotation vLine")
                        .attr("x1", function(d) {
                             return parseFloat(d.getAttribute("x")) + parseFloat(d.getAttribute("width")) / 2;
                        })
                        .attr("y1", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
                        .attr("x2", function(d) {
                            return parseFloat(d.getAttribute("x")) + parseFloat(d.getAttribute("width")) / 2;
                        })
                        .attr("y2", function(d) { return parseFloat(d.getAttribute("y")); })
                        .style("stroke", getStyle("stroke", "black", options))
                        .style("stroke-width", getStyle("stroke-width","1.5", options));


                    //add horizontal connecting line
                    d3.select(marks[0].parentNode)
                        .append("line")
                        .attr("class", "annotation hLine")
                        .attr("y1", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
                        .attr("x1", parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                        .attr("y2", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
                        .attr("x2", parseFloat(marks[1].getAttribute("x")) + parseFloat(marks[1].getAttribute("width")) / 2)
                        .style("stroke", getStyle("stroke", "black", options))
                        .style("stroke-width", getStyle("stroke-width", "1.5", options));

                    // add result text
                    node = d3.select(marks[0].parentNode)
                        .append("text")
                        .attr("class", "annotation result")
                        .attr("x", ((parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                            + (parseFloat(marks[1].getAttribute("x")) + parseFloat(marks[1].getAttribute("width")) / 2)) / 2 - (result.length*4))
                        .attr("y", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 30)
                        .attr("dy", ".35em")
                        .attr("font-size", getStyle("font-size", "16px", options))
                        .text(result);

                    bbox = node._groups[0][0].getBBox();

                    //add rectangle around result
                    d3.select(marks[0].parentNode)
                        .insert('rect', ".result")
                        .attr("class", "annotation result")
                        .attr('x', bbox.x-5)
                        .attr('y', bbox.y-5)
                        .attr('width', bbox.width+10)
                        .attr('height', bbox.height + 10)
                        .attr('stroke', "black")
                        .attr("fill", getStyle("fill", "#eeff82", options));

                    // highlight bars
                    clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                    clone(marks[1]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));

                }
                pyramid.AnnotateDiffTwoSide = function (result, marks, constraints, options) {
                  console.log("result",result)
                    // add vertical lines from bar
                    d3.select(marks[0].parentNode).selectAll(".vLine")
                        .data(marks)
                        .enter()
                        .append("line")
                        .attr("class", "annotation vLine")
                        .attr("x1", function(d) {
                             return parseFloat(d.getAttribute("x")) + parseFloat(d.getAttribute("width")) / 2;
                        })
                        .attr("y1", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))))
                        .attr("x2", function(d) {
                            return parseFloat(d.getAttribute("x")) + parseFloat(d.getAttribute("width")) / 2;
                        })
                        .attr("y2", (b)=>{
                          return Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y")))+parseFloat(marks[0].getAttribute("height"))+parseFloat(marks[1].getAttribute("height"))
                        })
                        .style("stroke", getStyle("stroke", "grey", options))
                        .style("stroke-width", getStyle("stroke-width","1.5", options));


                    //add horizontal connecting line
                    d3.select(marks[0].parentNode)
                        .append("line")
                        .attr("class", "annotation hLine")
                        .attr("y1", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) )
                        .attr("x1", parseFloat(marks[0].getAttribute("x")) -5)
                        .attr("y2", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) )
                        .attr("x2", parseFloat(marks[0].getAttribute("x")) +(x.bandwidth())+5)
                        .style("stroke", getStyle("stroke", "#FF6600", options))
                        .style("stroke-width", getStyle("stroke-width", "2.5", options));

                    //add horizontal connecting line
                    d3.select(marks[0].parentNode)
                        .append("line")
                        .attr("class", "annotation hLine")
                        .attr("y1", (b)=>{
                          return Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y")))+parseFloat(marks[0].getAttribute("height"))+parseFloat(marks[1].getAttribute("height"))
                        })
                        .attr("x1", parseFloat(marks[0].getAttribute("x")) -5 )
                        .attr("y2",(b)=>{
                          return Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y")))+parseFloat(marks[0].getAttribute("height"))+parseFloat(marks[1].getAttribute("height"))
                        })
                        .attr("x2", parseFloat(marks[0].getAttribute("x")) + (x.bandwidth())+5)
                        .style("stroke", getStyle("stroke", "#FF6600", options))
                        .style("stroke-width", getStyle("stroke-width", "2.5", options));

                    // add result text
                    node = d3.select(marks[0].parentNode)
                        .append("text")
                        .attr("class", "annotation result")
                        .attr("x", ((parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                            + (parseFloat(marks[1].getAttribute("x")) + parseFloat(marks[1].getAttribute("width")) / 2)) / 2 - (result.length*4))
                        .attr("y", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 30)
                        .attr("dy", ".35em")
                        .attr("font-size", getStyle("font-size", "16px", options))
                        .text(result);

                    bbox = node._groups[0][0].getBBox();


                    //add dot around result
                    d3.select(marks[0].parentNode)
                        .insert('circle', ".result")
                        .attr("class", "annotation result")
                          .attr("r", 10)
                          .attr("cx", parseFloat(marks[0].getAttribute("x"))+ (x.bandwidth())/2 )
                          .attr("cy", (d)=>{
                            if(parseFloat(marks[0].getAttribute("y"))<250)
                            {return (parseFloat(marks[1].getAttribute("height"))-parseFloat(marks[0].getAttribute("height"))+250)}
                            else{return (parseFloat(marks[0].getAttribute("height"))-parseFloat(marks[1].getAttribute("height"))+250)}
                            // console.log("Diff",parseFloat(marks[0].getAttribute("height"))-parseFloat(marks[1].getAttribute("height")))
                            // return (parseFloat(marks[0].getAttribute("height"))-parseFloat(marks[1].getAttribute("height"))+250)
                          })
                          .attr("fill", getStyle("fill", "#FF6600", options));


                    //add rectangle around result
                    // d3.select(marks[0].parentNode)
                    //     .insert('rect', ".result")
                    //     .attr("class", "annotation result")
                    //     .attr('x', bbox.x-5)
                    //     .attr('y', bbox.y-5)
                    //     .attr('width', bbox.width+10)
                    //     .attr('height', bbox.height + 10)
                    //     .attr('stroke', "black")
                    //     .attr("fill", getStyle("fill", "#eeff82", options));

                    // highlight bars
                    // clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                    // clone(marks[1]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));

                }

                pyramid.AnnotateRank = function(result, marks, constraints, options) {
                    var color = d3.scaleLinear().domain([1, result.length+1])
                                               .range([getStyle("gradientStart", "rgb(217, 239, 192)", options), getStyle("gradientStop", "rgb(113, 179, 36)", options)]);
                    marks.forEach(function (mark, index) {
                        r = result.filter(function(v) {
                            return v[pyramid.value] == getValue(mark);
                        })[0];
                        if (marks.length > 1) {
                            clone(mark)
                                .style("fill",
                                    function(d) {
                                        return color(r.rank)
                                    });
                        } else {
                            clone(mark)
                                .style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                        }

                        pyramid.AnnotateValue(r.rank.toString(), [mark], constraints, { "highlight": "transparent"});


                    });
                }

                pyramid.AnnotateThreshold = function(result, marks, constraints, options) {
                    marks.forEach(function(mark, index) {
                        r = result.filter(function(v) {
                            return v[pyramid.value] == getValue(mark);
                        })[0];
                        if (r && r.threshold) {
                            clone(mark).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                        }
                    });

                    if (constraints[0].nodeName == "text") {
                        bbox = constraints[0].getBBox();
                        //add rectangle around result
                        d3.select(constraints[0].parentNode)
                            .insert('rect', ".text")
                            .attr("class", "annotation result")
                            .attr('x', bbox.x - 5)
                            .attr('y', bbox.y - 5)
                            .attr('width', bbox.width + 10)
                            .attr('height', bbox.height + 10)
                            .attr('stroke', "black")
                            .attr("fill", getStyle("fill", "#eeff82", options))
                            .moveToBack();

                        //add horizontal threshold line
                        d3.select(constraints[0].parentNode)
                            .append("line")
                            .attr("class", "annotation hLine")
                            .attr("y1", parseFloat(constraints[0].getAttribute("y")))
                            .attr("x1", parseFloat(constraints[0].getAttribute("x")) + 10)
                            .attr("y2", parseFloat(constraints[0].getAttribute("y")))
                            .attr("x2",
                                parseFloat(constraints[0].getAttribute("x")) + parseFloat(svg.getAttribute("width")))
                            .style("stroke", getStyle("stroke", "black", options))
                            .style("stroke-width", getStyle("stroke-width", "1.5", options));

                        d3.select(constraints[0].parentNode.parentNode).moveToFront();
                    } else {
                        pyramid.AnnotateValue(result[0].tval, constraints, null, { "highlight": "transparent" });
                    }
                }

                pyramid.AnnotateMean = function(result, marks, constraints, options, region) {
                  console.log("marks",marks);
                  console.log("result",result);
                  console.log("region",region);
                  let marksSub=[]
                  if(region <400){
                    marksSub=marks.up
                  }
                  if(region >400){
                    marksSub=marks.down
                  }
                    if (result) {
                        yScale = d3.select(".y").node().__axis;
                        marksSub.forEach(function (mark, index) {
                          console.log("mark value",mark.value)
                            if (getValue(mark) > result.val) {
                                clone(mark).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                            }
                            else if(getValue(mark) > result.val ){
                                clone(mark).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                            }
                        });
                        //add horizontal threshold line
                        d3.select(marksSub[0].parentNode)
                            .append("line")
                            .attr("class", "annotation hLine")
                            .attr("y1", yScale(result.val))
                            .attr("x1", 0)
                            .attr("y2", yScale(result.val))
                            .attr("x2", parseFloat(svg.getAttribute("width")))
                            .style("stroke", getStyle("stroke", "black", options))
                            .style("stroke-width", getStyle("stroke-width", "1.5", options));

                        node = d3.select(marksSub[0].parentNode)
                            .append("text")
                            .attr("class", "annotation result")
                            .attr("x", parseFloat(svg.getAttribute("width"))/2)
                            .attr("y", yScale(result.val) - 20)
                            .attr("dy", ".35em")
                            .attr("font-size", getStyle("font-size", "16px", options))
                            .text(result.text);

                        bbox = node._groups[0][0].getBBox();

                        //add rectangle around result
                        d3.select(marksSub[0].parentNode)
                            .insert('rect', ".result")
                            .attr("class", "annotation result")
                            .attr('x', bbox.x - 5)
                            .attr('y', bbox.y - 5)
                            .attr('width', bbox.width + 10)
                            .attr('height', bbox.height + 10)
                            .attr('stroke', "black")
                            .attr("fill", getStyle("fill", "#eeff82", options));
                    }
                }
                pyramid.AnnotateBothMean = function(result, marks, constraints, options, region) {
                  console.log("marks",marks);
                  console.log("result",result);
                  console.log("region",region);
                  // let marksSub=[]
                  // if(region <400){
                  //   marksSub=marks.up
                  // }
                  // if(region >400){
                  //   marksSub=marks.down
                  // }
                    if (result) {
                      console.log("start drawing")
                        yScale = d3.select(".y").node().__axis;
                        // marksSub.forEach(function (mark, index) {
                        //   // console.log("mark value",mark.value)
                        //     if (getValue(mark) > result.val) {
                        //         clone(mark).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                        //     }
                        //     else if(getValue(mark) > result.val ){
                        //         clone(mark).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                        //     }
                        // });
                        // //add horizontal threshold line
                        // d3.select(marksSub[0].parentNode)
                        //     .append("line")
                        //     .attr("class", "annotation hLine")
                        //     .attr("y1", yScale(result.val))
                        //     .attr("x1", 0)
                        //     .attr("y2", yScale(result.val))
                        //     .attr("x2", parseFloat(svg.getAttribute("width")))
                        //     .style("stroke", getStyle("stroke", "black", options))
                        //     .style("stroke-width", getStyle("stroke-width", "1.5", options));
                        console.log("marks[Object.keys(marks)[0]].parentNode",marks[Object.keys(marks)[0]].parentNode)
                        //add dot around result
                        d3.select(marks[Object.keys(marks)[0]][0].parentNode).selectAll('circle')
                            .data(result.val)
                            .enter()
                            .append('circle')
                            .attr("class", "annotation result")
                              .attr("r", 10)
                              .attr("cx", (d,i)=>{
                                // console.log(d)
                                console.log("cx",i,parseFloat(marks[Object.keys(marks)[0]][i].getAttribute("x"))+ (x.bandwidth()/data.length-5)/2)
                                // return 400
                                return parseFloat(marks[Object.keys(marks)[0]][i].getAttribute("x"))+ (x.bandwidth()/data.length-5)/2
                              })
                              .attr("cy", (d,i)=>{
                                console.log(i)
                                console.log("cy",i, parseFloat(marks["down"][i].getAttribute("height"))-parseFloat(marks["up"][i].getAttribute("height"))+250)
                                // return 400
                                return parseFloat(marks["down"][i].getAttribute("height"))-parseFloat(marks["up"][i].getAttribute("height"))+250
                              })
                              .attr("fill", getStyle("fill", "#FF6600", options));

                        // node = d3.select(marksSub[0].parentNode)
                        //     .append("text")
                        //     .attr("class", "annotation result")
                        //     .attr("x", parseFloat(svg.getAttribute("width"))/2)
                        //     .attr("y", yScale(result.val) - 20)
                        //     .attr("dy", ".35em")
                        //     .attr("font-size", getStyle("font-size", "16px", options))
                        //     .text(result.text);

                        // bbox = node._groups[0][0].getBBox();

                        //add rectangle around result
                        // d3.select(marksSub[0].parentNode)
                        //     .insert('rect', ".result")
                        //     .attr("class", "annotation result")
                        //     .attr('x', bbox.x - 5)
                        //     .attr('y', bbox.y - 5)
                        //     .attr('width', bbox.width + 10)
                        //     .attr('height', bbox.height + 10)
                        //     .attr('stroke', "black")
                        //     .attr("fill", getStyle("fill", "#eeff82", options));
                    }
                }

                pyramid.clear = function() {
                    pyramid.data = d3.selectAll(".bar-up").data();
                    if (pyramid.data) {
                        pyramid.data.clean(undefined);
                    }
                }

                pyramid.isMultiLayer = function (intent) {
                    if (rules[intent] && rules[intent].hasOwnProperty("interact")) {
                        return rules[intent].interact;
                    }
                    return null;
                }

                pyramid.isGeneralizable = function (intent) {
                  console.log("rules ,[intent]",rules)
                    if (rules[intent] && rules[intent].hasOwnProperty("generalize")) {
                        return rules[intent].generalize;
                    }
                    return null;
                }

                //HELPER FUNCTIONS
                function getValue(m,item) {
                    dataObj = d3.select(m).data();
                    if (dataObj && dataObj.length > 0) {
                      if(item==="valueTop"){
                        console.log("get upper part value",dataObj[0][pyramid.valueUp] )
                        return dataObj[0][pyramid.valueUp];
                      }
                      else if(item==="valueDown"){
                        console.log("get down part value",dataObj[0][pyramid.valueDown] )
                        return dataObj[0][pyramid.valueDown];
                      }

                    }
                }

                function getLabel(m) {
                    dataObj = d3.select(m).data();
                    if (dataObj && dataObj.length > 0) {
                        return dataObj[0][pyramid.label];
                    }
                }

                function getStyle(prop, def, options) {
                    if (options && options.hasOwnProperty(prop)) {
                        return options[prop];
                    }
                    return def;
                }

                function setAlphaColor(color) {
                    if (color.indexOf('a') == -1) {
                        return color.replace(')', ', 0.8)').replace('rgb', 'rgba');
                    }
                    return color;
                }

                function getDataMarks() {
                    var marks = [];
                    d3.selectAll("svg rect")
                        .nodes()
                        .forEach(function (item, index) {
                            if (item.hasOwnProperty("__data__") && !d3.select(item).classed("annotation")) {
                                marks.push(item);
                            }
                        });
                    return marks;

                }

            return pyramid;
        }

annotator.heatmap = function () {

var rules = {
    "Diff": { generalize: "DiffGeneralized" },
    "Value" : {generalize: "ValueGeneralized"}
};

            //ATTRIBUTES
            heatmap.value = null;
            heatmap.label = null;
            heatmap.data = d3.selectAll(".hour").data();
            if (heatmap.data) {
                heatmap.data.clean(undefined);
            }
            console.log("  heatmap.data",  heatmap.data)
            // CLASS INSTANTIATION
            function heatmap() {
                //bar.data = d3.selectAll("rect").data();
                //if (data) {
                //    data.clean(undefined);
                //}
            }

            //MEASURE

            // Computes the difference between two bars
            heatmap.Diff = function(marks, constraints, options) {
                   if (marks.length == 2) {
                       d = getValue(marks[0]) - getValue(marks[1]);
                       if (options && options.hasOwnProperty("rounding")) {
                           d = d.toFixed(options.rounding);
                       }
                       result = "{0} - {1} : {2} ".format(getLabel(marks[0]), getLabel(marks[1]), d)
                       console.log("The difference is " + d);
                       if (options && options.hasOwnProperty("unit")) {
                           result += options.unit;
                       }
                       heatmap.AnnotateDiff(result, marks, constraints, options);
                   }
            }

            //Computes the percentage difference between two values
            heatmap.PercentDiff = function(marks, constraints, options) {
                //d3.select(event.target).data()
            }


            heatmap.DiffGeneralized = function(marks, constraints, options) {
                if (marks.length == 2) {
                    cube1 = getValue(marks[0]);
                    diffs = []
                    console.log(heatmap.data)
                    heatmap.data.forEach(function(item, index) {
                        cube2 = item[heatmap.value];
                        diff = Math.abs(cube1 - cube2);
                        result = "{0} - {1} : {2} ".format(getLabel(marks[0]),
                       item[heatmap.label],
                       options.hasOwnProperty("rounding") ? diff.toFixed(options.rounding) : diff);
                        if (options && options.hasOwnProperty("unit")) {
                            result += options.unit;
                        }
                        diffs.push({
                            diff: diff,
                            data: item,
                            isGreater: cube2 > cube1,
                            marks:marks,
                            result: result
                        });
                    });

                    heatmap.AnnotateDiffGeneralized(diffs, marks, constraints, options);
                }
            }

            heatmap.Value = function(marks, constraints, options) {
                if (marks && marks.length == 1) {
                    result = getValue(marks[0]).toString();
                    if (options && options.hasOwnProperty("unit")) {
                        result += options.unit;
                    }
                    heatmap.AnnotateValue(result, marks, constraints, options);
                }
            }

            heatmap.ValueGeneralized = function (marks, constraints, options) {

                getDataMarks()
                    .forEach(function(item, index) {
                        result = getValue(item).toString();
                        if (options && options.hasOwnProperty("unit")) {
                            result += options.unit;
                        }
                        if (getLabel(item) == getLabel(marks[0])) {
                            bar.AnnotateValue(result, [item], constraints, options);
                        } else {
                            heatmap.AnnotateValue(result, [item], constraints, { "highlight": "transparent" });
                        }

                    });
                //if (marks && marks.length == 1) {
                //    result = getValue(marks[0]).toString();
                //    if (options && options.hasOwnProperty("unit")) {
                //        result += options.unit;
                //    }
                //    bar.AnnotateValue(result, marks, constraints, options);
                //}
            }

            heatmap.Rank = function (marks, constraints, options) {
                heatmap.RankAscending(marks, constraints, options);
            }

            heatmap.RankDescending = function(marks,constraints,options) {
                //var data = []
                //marks.forEach(function(item, index) {
                //    data.push(d3.select(item).data()[0]);
                //});
                heatmap.data.sort(function (a, b) { return parseFloat(a[heatmap.value]) - parseFloat(b[heatmap.value]); });
                heatmap.data.forEach(function(item, index) {
                    item["rank"] = heatmap.data.length - index;
                });
                heatmap.AnnotateRank(heatmap.data, marks, constraints, options);
            }

            heatmap.RankAscending = function (marks, constraints, options) {
                //var data = []
                //marks.forEach(function (item, index) {
                //    data.push(d3.select(item).data()[0]);
                //});
                heatmap.data.sort(function (a, b) { return parseFloat(a[heatmap.value]) - parseFloat(b[heatmap.value]); });
                heatmap.data.forEach(function (item, index) {
                    item["rank"] = index+1;
                });
                heatmap.AnnotateRank(heatmap.data, marks, constraints, options);
            }

            heatmap.Threshold = function(marks, constraints, options) {
                if (constraints && constraints.length == 1) {
                    var threshold;
                    if (constraints[0].nodeName == "text") {
                        threshold = d3.select(constraints[0]).data()[0];
                    } else {
                        threshold = getValue(constraints[0]);
                    }
                    var tVal = "> ";
                    tVal += threshold.toString();
                    if (options && options.hasOwnProperty("unit")) {
                        tVal += options.unit;
                    }

                    heatmap.data.forEach(function (item, index) {
                        item["threshold"] = parseFloat(item[bar.value]) > parseFloat(threshold);
                        item["tval"] = tVal;
                    });
                    heatmap.AnnotateThreshold(heatmap.data, marks, constraints, options);
                }
            }

            heatmap.ThresholdBelow = function(marks, constraints, options) {
                if (constraints && constraints.length == 1) {
                    var threshold;
                    if (constraints[0].nodeName == "text") {
                        threshold = d3.select(constraints[0]).data()[0];
                    } else {
                        threshold = getValue(constraints[0]);
                    }
                    var tVal = "< ";
                    tVal += threshold.toString();
                    if (options && options.hasOwnProperty("unit")) {
                        tVal += options.unit;
                    }
                    heatmap.data.forEach(function (item, index) {
                        item["threshold"] = parseFloat(item[heatmap.value]) < parseFloat(threshold);
                        item["tval"] = tVal;
                    });
                    heatmap.AnnotateThreshold(heatmap.data, marks, constraints, options);
                }
            }

            heatmap.Mean = function(marks, constraints, options) {
                var total = 0;
                console.log("bar.value",heatmap.value)
                for(i = 0; i < heatmap.data.length; i += 1) {
                    total += heatmap.data[i][heatmap.value];
                }
                mean = total / heatmap.data.length;
                mean = mean.toFixed(2)
                heatmap.AnnotateMean({ val: mean, text: "Mean = {0} ".format(mean) },marks,constraints,options);
            }

            heatmap.Median = function(marks, constraints, options) {
                var median = 0,
                    numsLen = heatmap.data.length;
                heatmap.data.sort();
                if (numsLen % 2 === 0) { // is even
                    // average of two middle numbers
                    median = (heatmap.data[numsLen / 2 - 1] + heatmap.data[numsLen / 2]) / 2;
                } else { // is odd
                    // middle number only
                    median = heatmap.data[(numsLen - 1) / 2];
                }
                heatmap.AnnotateMean({ val: median, text: "Median = {0} ".format(median) }, marks, constraints, options);
            }

            //ANNOTATIONS
            heatmap.AnnotateValue = function (result, marks, constraints, options) {

                if (result == null || typeof(result) == "undefined") {
                    return;
                }

                node = d3.select(marks[0].parentNode)
                    .append("text")
                    .attr("class", "annotation result")
                    .attr("x", ((parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                        - (result.length * 4)))
                    .attr("y", parseFloat(marks[0].getAttribute("y")) - 30)
                    .attr("dy", ".35em")
                    .attr("font-size", getStyle("font-size", "16px", options))
                    .text(result);

                bbox = node._groups[0][0].getBBox();

                //add rectangle around result
                d3.select(marks[0].parentNode)
                    .insert('rect', ".result")
                    .attr("class", "annotation result")
                    .attr('x', bbox.x - 5)
                    .attr('y', bbox.y - 5)
                    .attr('width', bbox.width + 10)
                    .attr('height', bbox.height + 10)
                    .attr('stroke', "black")
                    .attr("fill", getStyle("fill", "#eeff82", options));

                clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
            }

            heatmap.AnnotateDiffGeneralized = function (result, marks, constraints, options) {

                n = d3.selectAll(".difference").nodes();
                if (n.length > 0) {
                    d3.selectAll(".difference")
                        .attr("height", 0)
                        .transition()
                        .duration(2000);
                }
                parentNode = marks[0].parentNode;
                d3.selectAll(".annotation").remove();
                parentNode.appendChild(marks[0]);
                xScale = d3.select(".x").node().__axis;
                yScale = d3.select(".y").node().__axis;
                var tooltip = null;
                d3.selectAll(" svg rect")
                    .nodes()
                    .forEach(function (item, index) {
                        itemdata = d3.select(item).data()[0];
                        if (itemdata) {
                            c = clone(item).node();
                            c.__data__ = itemdata;

                            annotator.interaction.call(this,
                                c,
                                function (target) {
                                    heatmap.DiffGeneralized([target, null], constraints, options);
                                })
                        }
                    });
                    console.log("result",result)
                result.forEach(function(item, index) {
                    // console.log("(item.data",item.data)
                    if (item.data[heatmap.label] == getLabel(marks[0])) {
                        clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                    } else {
                      // console.log("xScale(item.data[heatmap.label]) - item.marks[0].getBBox().width / 2",item.data[heatmap.label],xScale(item.data[heatmap.label]), item.marks[0].getBBox().width)

                        rect = d3.select(parentNode)
                            .append("rect")
                            .attr("id", item.result)
                            .attr("class", "annotation difference")
                            .attr("x", parseInt(xScale(item.data[heatmap.label]) - item.marks[0].getBBox().width / 2))
                            .attr("width", item.marks[0].getBBox().width)
                            .style("fill", ()=>{
                                return item.isGreater
                                ? setAlphaColor("rgb(66, 228, 232)")
                                : setAlphaColor("rgb(255, 69, 69)")})
                            .attr("y", yScale(dayconvert[item.data.day]))
                            .transition()
                            .duration(300)
                            .attr("x", parseInt(xScale(item.data[heatmap.label]) - item.marks[0].getBBox().width / 2))
                            .attr("y", yScale(dayconvert[item.data.day]))
                            .style("fill",()=>{
                                return item.isGreater
                                ? setAlphaColor("rgb(66, 228, 232)")
                                : setAlphaColor("rgb(255, 69, 69)")})
                            //.delay(index * 50)
                            // .attr("y",
                            //     item.isGreater
                            //     ? yScale(dayconvert[item.data.day])
                            //     : yScale(dayconvert[item.data.day] + item.diff))
                            // .attr("height",
                            //     item.isGreater
                            //     ? Math.abs(yScale(item.data[heatmap.value]) - yScale(item.data[heatmap.value] - item.diff))
                            //     : Math.abs(yScale(item
                            //             .data[heatmap.value] +
                            //             item.diff) -
                            //         yScale(item.data[heatmap.value])));
                            // .attr("fill":)

                        annotator.interaction.call(this, rect.node(), annotator.showTooltip);
                        if (marks[1] && item.data[heatmap.label] == getLabel(marks[1])) {
                            tooltip = rect.node();
                        }
                    }
                });

                // //add horizontal threshold line
                // d3.select(marks[0].parentNode)
                //     .append("line")
                //     .attr("class", "annotation hLine")
                //     .attr("y1", yScale(getValue(marks[0])))
                //     .attr("x1", 0)
                //     .attr("y2", yScale(getValue(marks[0])))
                //     .attr("x2", parseFloat(svg.getAttribute("width")))
                //     .style("stroke", getStyle("stroke", "black", options))
                //     .style("stroke-width", getStyle("stroke-width", "1.5", options));
                if (tooltip) {
                    annotator.showTooltip(tooltip);
                }
            }

            heatmap.AnnotateDiff = function (result, marks, constraints, options) {

                // add vertical lines from bar
                d3.select(marks[0].parentNode).selectAll(".vLine")
                    .data(marks)
                    .enter()
                    .append("line")
                    .attr("class", "annotation vLine")
                    .attr("x1", function(d) {
                         return parseFloat(d.getAttribute("x")) + parseFloat(d.getAttribute("width")) / 2;
                    })
                    .attr("y1", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
                    .attr("x2", function(d) {
                        return parseFloat(d.getAttribute("x")) + parseFloat(d.getAttribute("width")) / 2;
                    })
                    .attr("y2", function(d) { return parseFloat(d.getAttribute("y")); })
                    .style("stroke", getStyle("stroke", "black", options))
                    .style("stroke-width", getStyle("stroke-width","1.5", options));


                //add horizontal connecting line
                d3.select(marks[0].parentNode)
                    .append("line")
                    .attr("class", "annotation hLine")
                    .attr("y1", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
                    .attr("x1", parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                    .attr("y2", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
                    .attr("x2", parseFloat(marks[1].getAttribute("x")) + parseFloat(marks[1].getAttribute("width")) / 2)
                    .style("stroke", getStyle("stroke", "black", options))
                    .style("stroke-width", getStyle("stroke-width", "1.5", options));

                // add result text
                node = d3.select(marks[0].parentNode)
                    .append("text")
                    .attr("class", "annotation result")
                    .attr("x", ((parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                        + (parseFloat(marks[1].getAttribute("x")) + parseFloat(marks[1].getAttribute("width")) / 2)) / 2 - (result.length*4))
                    .attr("y", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 30)
                    .attr("dy", ".35em")
                    .attr("font-size", getStyle("font-size", "16px", options))
                    .text(result);

                bbox = node._groups[0][0].getBBox();

                //add rectangle around result
                d3.select(marks[0].parentNode)
                    .insert('rect', ".result")
                    .attr("class", "annotation result")
                    .attr('x', bbox.x-5)
                    .attr('y', bbox.y-5)
                    .attr('width', bbox.width+10)
                    .attr('height', bbox.height + 10)
                    .attr('stroke', "black")
                    .attr("fill", getStyle("fill", "#eeff82", options));

                // highlight bars
                clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                clone(marks[1]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));

            }

            heatmap.AnnotateRank = function(result, marks, constraints, options) {
                var color = d3.scaleLinear().domain([1, result.length+1])
                                           .range([getStyle("gradientStart", "rgb(217, 239, 192)", options), getStyle("gradientStop", "rgb(113, 179, 36)", options)]);
                marks.forEach(function (mark, index) {
                    r = result.filter(function(v) {
                        return v[heatmap.value] == getValue(mark);
                    })[0];
                    if (marks.length > 1) {
                        clone(mark)
                            .style("fill",
                                function(d) {
                                    return color(r.rank)
                                });
                    } else {
                        clone(mark)
                            .style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                    }

                    heatmap.AnnotateValue(r.rank.toString(), [mark], constraints, { "highlight": "transparent"});


                });
            }

            heatmap.AnnotateThreshold = function(result, marks, constraints, options) {
                marks.forEach(function(mark, index) {
                    r = result.filter(function(v) {
                        return v[bar.value] == getValue(mark);
                    })[0];
                    if (r && r.threshold) {
                        clone(mark).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                    }
                });

                if (constraints[0].nodeName == "text") {
                    bbox = constraints[0].getBBox();
                    //add rectangle around result
                    d3.select(constraints[0].parentNode)
                        .insert('rect', ".text")
                        .attr("class", "annotation result")
                        .attr('x', bbox.x - 5)
                        .attr('y', bbox.y - 5)
                        .attr('width', bbox.width + 10)
                        .attr('height', bbox.height + 10)
                        .attr('stroke', "black")
                        .attr("fill", getStyle("fill", "#eeff82", options))
                        .moveToBack();

                    //add horizontal threshold line
                    d3.select(constraints[0].parentNode)
                        .append("line")
                        .attr("class", "annotation hLine")
                        .attr("y1", parseFloat(constraints[0].getAttribute("y")))
                        .attr("x1", parseFloat(constraints[0].getAttribute("x")) + 10)
                        .attr("y2", parseFloat(constraints[0].getAttribute("y")))
                        .attr("x2",
                            parseFloat(constraints[0].getAttribute("x")) + parseFloat(svg.getAttribute("width")))
                        .style("stroke", getStyle("stroke", "black", options))
                        .style("stroke-width", getStyle("stroke-width", "1.5", options));

                    d3.select(constraints[0].parentNode.parentNode).moveToFront();
                } else {
                    heatmap.AnnotateValue(result[0].tval, constraints, null, { "highlight": "transparent" });
                }
            }

            heatmap.AnnotateMean = function(result, marks, constraints, options) {
              console.log("marks",marks)
                if (result) {
                    yScale = d3.select(".y").node().__axis;
                    marks.forEach(function (mark, index) {
                        if (getValue(mark) > result.val) {
                            clone(mark).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                        }
                    });
                    //add horizontal threshold line
                    d3.select(marks[0].parentNode)
                        .append("line")
                        .attr("class", "annotation hLine")
                        .attr("y1", yScale(result.val))
                        .attr("x1", 0)
                        .attr("y2", yScale(result.val))
                        .attr("x2", parseFloat(svg.getAttribute("width")))
                        .style("stroke", getStyle("stroke", "black", options))
                        .style("stroke-width", getStyle("stroke-width", "1.5", options));

                    node = d3.select(marks[0].parentNode)
                        .append("text")
                        .attr("class", "annotation result")
                        .attr("x", parseFloat(svg.getAttribute("width"))/2)
                        .attr("y", yScale(result.val) - 20)
                        .attr("dy", ".35em")
                        .attr("font-size", getStyle("font-size", "16px", options))
                        .text(result.text);

                    bbox = node._groups[0][0].getBBox();

                    //add rectangle around result
                    d3.select(marks[0].parentNode)
                        .insert('rect', ".result")
                        .attr("class", "annotation result")
                        .attr('x', bbox.x - 5)
                        .attr('y', bbox.y - 5)
                        .attr('width', bbox.width + 10)
                        .attr('height', bbox.height + 10)
                        .attr('stroke', "black")
                        .attr("fill", getStyle("fill", "#eeff82", options));
                }
            }

            heatmap.clear = function() {
                heatmap.data = d3.selectAll(".hour").data();
                if (heatmap.data) {
                    heatmap.data.clean(undefined);
                }
            }

            heatmap.isMultiLayer = function (intent) {
                if (rules[intent] && rules[intent].hasOwnProperty("interact")) {
                    return rules[intent].interact;
                }
                return null;
            }

            heatmap.isGeneralizable = function (intent) {
              console.log("rules ,[intent]",rules)
                if (rules[intent] && rules[intent].hasOwnProperty("generalize")) {
                    return rules[intent].generalize;
                }
                return null;
            }

            //HELPER FUNCTIONS
            function getValue(m) {
                dataObj = d3.select(m).data();
                if (dataObj && dataObj.length > 0) {
                    return dataObj[0][heatmap.value];
                }
            }

            function getLabel(m) {
                dataObj = d3.select(m).data();
                if (dataObj && dataObj.length > 0) {
                    return dataObj[0][heatmap.label];
                }
            }

            function getStyle(prop, def, options) {
                if (options && options.hasOwnProperty(prop)) {
                    return options[prop];
                }
                return def;
            }

            function setAlphaColor(color) {
                if (color.indexOf('a') == -1) {
                    return color.replace(')', ', 0.8)').replace('rgb', 'rgba');
                }
                return color;
            }

            function getDataMarks() {
                var marks = [];
                d3.selectAll("svg rect")
                    .nodes()
                    .forEach(function (item, index) {
                        if (item.hasOwnProperty("__data__") && !d3.select(item).classed("annotation")) {
                            marks.push(item);
                        }
                    });
                return marks;

            }

        return heatmap;
    }

        ////Annotations for BAR CHART
annotator.bar = function () {

    var rules = {
        "Diff": { generalize: "DiffGeneralized" },
        "Value" : {generalize: "ValueGeneralized"}
    };

                //ATTRIBUTES
                bar.value = null;
                bar.label = null;
                bar.data = d3.selectAll("rect").data();
                if (bar.data) {
                    bar.data.clean(undefined);
                }
                // CLASS INSTANTIATION
                function bar() {
                    //bar.data = d3.selectAll("rect").data();
                    //if (data) {
                    //    data.clean(undefined);
                    //}
                }

                //MEASURE

                // Computes the difference between two bars
                bar.Diff = function(marks, constraints, options) {
                       if (marks.length == 2) {
                           d = getValue(marks[0]) - getValue(marks[1]);
                           if (options && options.hasOwnProperty("rounding")) {
                               d = d.toFixed(options.rounding);
                           }
                           result = "{0} - {1} : {2} ".format(getLabel(marks[0]), getLabel(marks[1]), d)
                           console.log("The difference is " + d);
                           if (options && options.hasOwnProperty("unit")) {
                               result += options.unit;
                           }
                           bar.AnnotateDiff(result, marks, constraints, options);
                       }
                }

                //Computes the percentage difference between two values
                bar.PercentDiff = function(marks, constraints, options) {
                    //d3.select(event.target).data()
                }


                bar.DiffGeneralized = function(marks, constraints, options) {
                    if (marks.length == 2) {
                        bar1 = getValue(marks[0]);
                        diffs = []
                        bar.data.forEach(function(item, index) {
                            bar2 = item[bar.value];
                            diff = Math.abs(bar1 - bar2);
                            result = "{0} - {1} : {2} ".format(getLabel(marks[0]),
                           item[bar.label],
                           options.hasOwnProperty("rounding") ? diff.toFixed(options.rounding) : diff);
                            if (options && options.hasOwnProperty("unit")) {
                                result += options.unit;
                            }
                            diffs.push({
                                diff: diff,
                                data: item,
                                isGreater: bar2 > bar1,
                                marks:marks,
                                result: result
                            });
                        });

                        bar.AnnotateDiffGeneralized(diffs, marks, constraints, options);
                    }
                }

                bar.Value = function(marks, constraints, options) {
                    if (marks && marks.length == 1) {
                        result = getValue(marks[0]).toString();
                        if (options && options.hasOwnProperty("unit")) {
                            result += options.unit;
                        }
                        bar.AnnotateValue(result, marks, constraints, options);
                    }
                }

                bar.ValueGeneralized = function (marks, constraints, options) {

                    getDataMarks()
                        .forEach(function(item, index) {
                            result = getValue(item).toString();
                            if (options && options.hasOwnProperty("unit")) {
                                result += options.unit;
                            }
                            if (getLabel(item) == getLabel(marks[0])) {
                                bar.AnnotateValue(result, [item], constraints, options);
                            } else {
                                bar.AnnotateValue(result, [item], constraints, { "highlight": "transparent" });
                            }

                        });
                    //if (marks && marks.length == 1) {
                    //    result = getValue(marks[0]).toString();
                    //    if (options && options.hasOwnProperty("unit")) {
                    //        result += options.unit;
                    //    }
                    //    bar.AnnotateValue(result, marks, constraints, options);
                    //}
                }

                bar.Rank = function (marks, constraints, options) {
                    bar.RankAscending(marks, constraints, options);
                }

                bar.RankDescending = function(marks,constraints,options) {
                    //var data = []
                    //marks.forEach(function(item, index) {
                    //    data.push(d3.select(item).data()[0]);
                    //});
                    bar.data.sort(function (a, b) { return parseFloat(a[bar.value]) - parseFloat(b[bar.value]); });
                    bar.data.forEach(function(item, index) {
                        item["rank"] = bar.data.length - index;
                    });
                    bar.AnnotateRank(bar.data, marks, constraints, options);
                }

                bar.RankAscending = function (marks, constraints, options) {
                    //var data = []
                    //marks.forEach(function (item, index) {
                    //    data.push(d3.select(item).data()[0]);
                    //});
                    bar.data.sort(function (a, b) { return parseFloat(a[bar.value]) - parseFloat(b[bar.value]); });
                    bar.data.forEach(function (item, index) {
                        item["rank"] = index+1;
                    });
                    bar.AnnotateRank(bar.data, marks, constraints, options);
                }

                bar.Threshold = function(marks, constraints, options) {
                    if (constraints && constraints.length == 1) {
                        var threshold;
                        if (constraints[0].nodeName == "text") {
                            threshold = d3.select(constraints[0]).data()[0];
                        } else {
                            threshold = getValue(constraints[0]);
                        }
                        var tVal = "> ";
                        tVal += threshold.toString();
                        if (options && options.hasOwnProperty("unit")) {
                            tVal += options.unit;
                        }

                        bar.data.forEach(function (item, index) {
                            item["threshold"] = parseFloat(item[bar.value]) > parseFloat(threshold);
                            item["tval"] = tVal;
                        });
                        bar.AnnotateThreshold(bar.data, marks, constraints, options);
                    }
                }

                bar.ThresholdBelow = function(marks, constraints, options) {
                    if (constraints && constraints.length == 1) {
                        var threshold;
                        if (constraints[0].nodeName == "text") {
                            threshold = d3.select(constraints[0]).data()[0];
                        } else {
                            threshold = getValue(constraints[0]);
                        }
                        var tVal = "< ";
                        tVal += threshold.toString();
                        if (options && options.hasOwnProperty("unit")) {
                            tVal += options.unit;
                        }
                        bar.data.forEach(function (item, index) {
                            item["threshold"] = parseFloat(item[bar.value]) < parseFloat(threshold);
                            item["tval"] = tVal;
                        });
                        bar.AnnotateThreshold(bar.data, marks, constraints, options);
                    }
                }

                bar.Mean = function(marks, constraints, options) {
                    var total = 0;
                    console.log("bar.value",bar.value)
                    for(i = 0; i < bar.data.length; i += 1) {
                        total += bar.data[i][bar.value];
                    }
                    mean = total / bar.data.length;
                    mean = mean.toFixed(2)
                    bar.AnnotateMean({ val: mean, text: "Mean = {0} ".format(mean) },marks,constraints,options);
                }

                bar.Median = function(marks, constraints, options) {
                    var median = 0,
                        numsLen = bar.data.length;
                    bar.data.sort();
                    if (numsLen % 2 === 0) { // is even
                        // average of two middle numbers
                        median = (bar.data[numsLen / 2 - 1] + bar.data[numsLen / 2]) / 2;
                    } else { // is odd
                        // middle number only
                        median = bar.data[(numsLen - 1) / 2];
                    }
                    bar.AnnotateMean({ val: median, text: "Median = {0} ".format(median) }, marks, constraints, options);
                }

                //ANNOTATIONS
                bar.AnnotateValue = function (result, marks, constraints, options) {

                    if (result == null || typeof(result) == "undefined") {
                        return;
                    }

                    node = d3.select(marks[0].parentNode)
                        .append("text")
                        .attr("class", "annotation result")
                        .attr("x", ((parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                            - (result.length * 4)))
                        .attr("y", parseFloat(marks[0].getAttribute("y")) - 30)
                        .attr("dy", ".35em")
                        .attr("font-size", getStyle("font-size", "16px", options))
                        .text(result);

                    bbox = node._groups[0][0].getBBox();

                    //add rectangle around result
                    d3.select(marks[0].parentNode)
                        .insert('rect', ".result")
                        .attr("class", "annotation result")
                        .attr('x', bbox.x - 5)
                        .attr('y', bbox.y - 5)
                        .attr('width', bbox.width + 10)
                        .attr('height', bbox.height + 10)
                        .attr('stroke', "black")
                        .attr("fill", getStyle("fill", "#eeff82", options));

                    clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                }

                bar.AnnotateDiffGeneralized = function (result, marks, constraints, options) {

                    n = d3.selectAll(".difference").nodes();
                    if (n.length > 0) {
                        d3.selectAll(".difference")
                            .attr("height", 0)
                            .transition()
                            .duration(2000);
                    }
                    parentNode = marks[0].parentNode;
                    d3.selectAll(".annotation").remove();
                    parentNode.appendChild(marks[0]);
                    xScale = d3.select(".x").node().__axis;
                    yScale = d3.select(".y").node().__axis;
                    var tooltip = null;
                    d3.selectAll(" svg rect")
                        .nodes()
                        .forEach(function (item, index) {
                            itemdata = d3.select(item).data()[0];
                            if (itemdata) {
                                c = clone(item).node();
                                c.__data__ = itemdata;

                                annotator.interaction.call(this,
                                    c,
                                    function (target) {
                                        bar.DiffGeneralized([target, null], constraints, options);
                                    })
                            }
                        });

                    result.forEach(function(item, index) {
                        if (item.data[bar.label] == getLabel(marks[0])) {
                            clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                        } else {


                            rect = d3.select(parentNode)
                                .append("rect")
                                .attr("id", item.result)
                                .attr("class", "annotation difference")
                                .attr("x", parseInt(xScale(item.data[bar.label]) - item.marks[0].getBBox().width / 2))
                                .attr("width", item.marks[0].getBBox().width)
                                .attr("fill",
                                    item.isGreater
                                    ? setAlphaColor("rgb(66, 228, 232)")
                                    : setAlphaColor("rgb(255, 69, 69)"))
                                .attr("y", yScale(item.data[bar.value]))
                                .transition()
                                .duration(300)
                                //.delay(index * 50)
                                .attr("y",
                                    item.isGreater
                                    ? yScale(item.data[bar.value])
                                    : yScale(item.data[bar.value] + item.diff))
                                .attr("height",
                                    item.isGreater
                                    ? Math.abs(yScale(item.data[bar.value]) - yScale(item.data[bar.value] - item.diff))
                                    : Math.abs(yScale(item
                                            .data[bar.value] +
                                            item.diff) -
                                        yScale(item.data[bar.value])));

                            annotator.interaction.call(this, rect.node(), annotator.showTooltip);
                            if (marks[1] && item.data[bar.label] == getLabel(marks[1])) {
                                tooltip = rect.node();
                            }
                        }
                    });

                    //add horizontal threshold line
                    d3.select(marks[0].parentNode)
                        .append("line")
                        .attr("class", "annotation hLine")
                        .attr("y1", yScale(getValue(marks[0])))
                        .attr("x1", 0)
                        .attr("y2", yScale(getValue(marks[0])))
                        .attr("x2", parseFloat(svg.getAttribute("width")))
                        .style("stroke", getStyle("stroke", "black", options))
                        .style("stroke-width", getStyle("stroke-width", "1.5", options));
                    if (tooltip) {
                        annotator.showTooltip(tooltip);
                    }
                }

                bar.AnnotateDiff = function (result, marks, constraints, options) {

                    // add vertical lines from bar
                    d3.select(marks[0].parentNode).selectAll(".vLine")
                        .data(marks)
                        .enter()
                        .append("line")
                        .attr("class", "annotation vLine")
                        .attr("x1", function(d) {
                             return parseFloat(d.getAttribute("x")) + parseFloat(d.getAttribute("width")) / 2;
                        })
                        .attr("y1", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
                        .attr("x2", function(d) {
                            return parseFloat(d.getAttribute("x")) + parseFloat(d.getAttribute("width")) / 2;
                        })
                        .attr("y2", function(d) { return parseFloat(d.getAttribute("y")); })
                        .style("stroke", getStyle("stroke", "black", options))
                        .style("stroke-width", getStyle("stroke-width","1.5", options));


                    //add horizontal connecting line
                    d3.select(marks[0].parentNode)
                        .append("line")
                        .attr("class", "annotation hLine")
                        .attr("y1", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
                        .attr("x1", parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                        .attr("y2", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 10)
                        .attr("x2", parseFloat(marks[1].getAttribute("x")) + parseFloat(marks[1].getAttribute("width")) / 2)
                        .style("stroke", getStyle("stroke", "black", options))
                        .style("stroke-width", getStyle("stroke-width", "1.5", options));

                    // add result text
                    node = d3.select(marks[0].parentNode)
                        .append("text")
                        .attr("class", "annotation result")
                        .attr("x", ((parseFloat(marks[0].getAttribute("x")) + parseFloat(marks[0].getAttribute("width")) / 2)
                            + (parseFloat(marks[1].getAttribute("x")) + parseFloat(marks[1].getAttribute("width")) / 2)) / 2 - (result.length*4))
                        .attr("y", Math.min(parseFloat(marks[0].getAttribute("y")), parseFloat(marks[1].getAttribute("y"))) - 30)
                        .attr("dy", ".35em")
                        .attr("font-size", getStyle("font-size", "16px", options))
                        .text(result);

                    bbox = node._groups[0][0].getBBox();

                    //add rectangle around result
                    d3.select(marks[0].parentNode)
                        .insert('rect', ".result")
                        .attr("class", "annotation result")
                        .attr('x', bbox.x-5)
                        .attr('y', bbox.y-5)
                        .attr('width', bbox.width+10)
                        .attr('height', bbox.height + 10)
                        .attr('stroke', "black")
                        .attr("fill", getStyle("fill", "#eeff82", options));

                    // highlight bars
                    clone(marks[0]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                    clone(marks[1]).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));

                }

                bar.AnnotateRank = function(result, marks, constraints, options) {
                    var color = d3.scaleLinear().domain([1, result.length+1])
                                               .range([getStyle("gradientStart", "rgb(217, 239, 192)", options), getStyle("gradientStop", "rgb(113, 179, 36)", options)]);
                    marks.forEach(function (mark, index) {
                        r = result.filter(function(v) {
                            return v[bar.value] == getValue(mark);
                        })[0];
                        if (marks.length > 1) {
                            clone(mark)
                                .style("fill",
                                    function(d) {
                                        return color(r.rank)
                                    });
                        } else {
                            clone(mark)
                                .style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                        }

                        bar.AnnotateValue(r.rank.toString(), [mark], constraints, { "highlight": "transparent"});


                    });
                }

                bar.AnnotateThreshold = function(result, marks, constraints, options) {
                    marks.forEach(function(mark, index) {
                        r = result.filter(function(v) {
                            return v[bar.value] == getValue(mark);
                        })[0];
                        if (r && r.threshold) {
                            clone(mark).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                        }
                    });

                    if (constraints[0].nodeName == "text") {
                        bbox = constraints[0].getBBox();
                        //add rectangle around result
                        d3.select(constraints[0].parentNode)
                            .insert('rect', ".text")
                            .attr("class", "annotation result")
                            .attr('x', bbox.x - 5)
                            .attr('y', bbox.y - 5)
                            .attr('width', bbox.width + 10)
                            .attr('height', bbox.height + 10)
                            .attr('stroke', "black")
                            .attr("fill", getStyle("fill", "#eeff82", options))
                            .moveToBack();

                        //add horizontal threshold line
                        d3.select(constraints[0].parentNode)
                            .append("line")
                            .attr("class", "annotation hLine")
                            .attr("y1", parseFloat(constraints[0].getAttribute("y")))
                            .attr("x1", parseFloat(constraints[0].getAttribute("x")) + 10)
                            .attr("y2", parseFloat(constraints[0].getAttribute("y")))
                            .attr("x2",
                                parseFloat(constraints[0].getAttribute("x")) + parseFloat(svg.getAttribute("width")))
                            .style("stroke", getStyle("stroke", "black", options))
                            .style("stroke-width", getStyle("stroke-width", "1.5", options));

                        d3.select(constraints[0].parentNode.parentNode).moveToFront();
                    } else {
                        bar.AnnotateValue(result[0].tval, constraints, null, { "highlight": "transparent" });
                    }
                }

                bar.AnnotateMean = function(result, marks, constraints, options) {
                  console.log("marks",marks)
                    if (result) {
                        yScale = d3.select(".y").node().__axis;
                        marks.forEach(function (mark, index) {
                            if (getValue(mark) > result.val) {
                                clone(mark).style("fill", getStyle("highlight", "rgb(201, 216, 106)", options));
                            }
                        });
                        //add horizontal threshold line
                        d3.select(marks[0].parentNode)
                            .append("line")
                            .attr("class", "annotation hLine")
                            .attr("y1", yScale(result.val))
                            .attr("x1", 0)
                            .attr("y2", yScale(result.val))
                            .attr("x2", parseFloat(svg.getAttribute("width")))
                            .style("stroke", getStyle("stroke", "black", options))
                            .style("stroke-width", getStyle("stroke-width", "1.5", options));

                        node = d3.select(marks[0].parentNode)
                            .append("text")
                            .attr("class", "annotation result")
                            .attr("x", parseFloat(svg.getAttribute("width"))/2)
                            .attr("y", yScale(result.val) - 20)
                            .attr("dy", ".35em")
                            .attr("font-size", getStyle("font-size", "16px", options))
                            .text(result.text);

                        bbox = node._groups[0][0].getBBox();

                        //add rectangle around result
                        d3.select(marks[0].parentNode)
                            .insert('rect', ".result")
                            .attr("class", "annotation result")
                            .attr('x', bbox.x - 5)
                            .attr('y', bbox.y - 5)
                            .attr('width', bbox.width + 10)
                            .attr('height', bbox.height + 10)
                            .attr('stroke', "black")
                            .attr("fill", getStyle("fill", "#eeff82", options));
                    }
                }

                bar.clear = function() {
                    bar.data = d3.selectAll("rect").data();
                    if (bar.data) {
                        bar.data.clean(undefined);
                    }
                }

                bar.isMultiLayer = function (intent) {
                    if (rules[intent] && rules[intent].hasOwnProperty("interact")) {
                        return rules[intent].interact;
                    }
                    return null;
                }

                bar.isGeneralizable = function (intent) {
                  console.log("rules ,[intent]",rules)
                    if (rules[intent] && rules[intent].hasOwnProperty("generalize")) {
                        return rules[intent].generalize;
                    }
                    return null;
                }

                //HELPER FUNCTIONS
                function getValue(m) {
                    dataObj = d3.select(m).data();
                    if (dataObj && dataObj.length > 0) {
                        return dataObj[0][bar.value];
                    }
                }

                function getLabel(m) {
                    dataObj = d3.select(m).data();
                    if (dataObj && dataObj.length > 0) {
                        return dataObj[0][bar.label];
                    }
                }

                function getStyle(prop, def, options) {
                    if (options && options.hasOwnProperty(prop)) {
                        return options[prop];
                    }
                    return def;
                }

                function setAlphaColor(color) {
                    if (color.indexOf('a') == -1) {
                        return color.replace(')', ', 0.8)').replace('rgb', 'rgba');
                    }
                    return color;
                }

                function getDataMarks() {
                    var marks = [];
                    d3.selectAll("svg rect")
                        .nodes()
                        .forEach(function (item, index) {
                            if (item.hasOwnProperty("__data__") && !d3.select(item).classed("annotation")) {
                                marks.push(item);
                            }
                        });
                    return marks;

                }

            return bar;
        }

////Annotations for SCATTER PLOT

annotator.scatter = function() {

    var rules = {
        "DistXInterval": { generalize: "DistXIntervalGeneralized" },
        "DistYInterval": { generalize: "DistYIntervalGeneralized" },
        "Regress" : { interact: [{interact:"DistX",intent:"Predict"}] }
    }


    scatter.value = null;
    scatter.label = null;
    scatter.data = d3.selectAll("circle").data();
    if (scatter.data) {
        scatter.data.clean(undefined);
    }

    // CLASS INSTANTIATION
    function scatter() {


    }

    //MEASURE
    scatter.Diff = function (marks, constraints, options) {

    }

    scatter.DistX = function(marks, constraints, options) {
        console.log("Annotating for Dist ScatterPlot")
        if (constraints && scatter.data) {
            if (constraints.hasOwnProperty("x") && constraints.x.length == 2) {
                // Calculate total number of observations between the two x-ticks
                x1 = d3.select(constraints.x[0]).data()[0];
                x2 = d3.select(constraints.x[1]).data()[0];
                total = scatter.data.length;
                scatter.data = scatter.data.filter(function(v) {
                    return parseFloat(v[scatter.label]) >= (x1 < x2 ? x1 : x2) &&
                        parseFloat(v[scatter.label]) <= (x1 < x2 ? x2 : x1);
                });
                result = "{0} of {1} observations.".format(scatter.data.length, total);

                scatter.AnnotateDistX(result, marks, constraints, options);
            }
        }
    }

    scatter.DistY = function(marks, constraints, options) {
        console.log("Annotating for Dist ScatterPlot")
        if (constraints && scatter.data) {
            if (constraints.hasOwnProperty("y") && constraints.y.length == 2) {
                // Calculate total number of observations between the two y-ticks
                y1 = d3.select(constraints.y[0]).data()[0];
                y2 = d3.select(constraints.y[1]).data()[0];
                total = scatter.data.length;
                scatter.data = scatter.data.filter(function(v) {
                    return parseFloat(v[scatter.value]) >= (y1 < y2 ? y1 : y2) &&
                        parseFloat(v[scatter.value]) <= (y1 < y2 ? y2 : y1);
                });
                result = "{0} of {1} observations.".format(scatter.data.length, total);
                scatter.AnnotateDistY(result, marks, constraints, options);

            }
        }
    }

    scatter.DistXInterval = function (marks, constraints, options) {
        console.log("Annotating for Dist ScatterPlot")
        if (constraints && scatter.data) {
            if (constraints.hasOwnProperty("xInterval")) {
                // Calculate total number of observations between the x-interval
                id = constraints.xInterval.id.split("-");
                x1 = parseFloat(id[0]);
                x2 = parseFloat(id[1]);
                total = scatter.data.length;
                scatter.data = scatter.data.filter(function (v) {
                    return parseFloat(v[scatter.label]) >= (x1 < x2 ? x1 : x2) &&
                        parseFloat(v[scatter.label]) <= (x1 < x2 ? x2 : x1);
                });
                result = "{0} of {1} observations.".format(scatter.data.length, total);

                scatter.AnnotateDistXInterval(result, marks, constraints, options);
            }
        }
    }

    scatter.DistYInterval = function(marks, constraints, options) {
        console.log("Annotating for Dist ScatterPlot")
        if (constraints && scatter.data) {
            if (constraints.hasOwnProperty("yInterval")) {
                id = constraints.yInterval.id.split("-");
                y1 = parseFloat(id[0]);
                y2 = parseFloat(id[1]);
                total = scatter.data.length;
                scatter.data = scatter.data.filter(function (v) {
                    return parseFloat(v[scatter.value]) >= (y1 < y2 ? y1 : y2) &&
                        parseFloat(v[scatter.value]) <= (y1 < y2 ? y2 : y1);
                });
                result = "{0} of {1} observations.".format(scatter.data.length, total);
                scatter.AnnotateDistYInterval(result, marks, constraints, options);
            }
        }
    }

    //convention over configuration "Generalized" at end of method name
    scatter.DistXIntervalGeneralized = function(marks, constraints, options) {
        xTicks = d3.select(svg).selectAll(".x .tick")
            .nodes();
        xTicksTotal = [];
        for (i = 0; i < xTicks.length - 1; i++) {
            x1 = d3.select(xTicks[i]).data()[0];
            x2 = d3.select(xTicks[i+1]).data()[0];
            total = 0;
            scatter.data.forEach(function(v, index) {
                if (parseFloat(v[scatter.label]) >= (x1 < x2 ? x1 : x2) &&
                    parseFloat(v[scatter.label]) <= (x1 < x2 ? x2 : x1)) {
                    total += 1;
                }
            });
            xTicksTotal.push({
                marks: marks,
                constraints: [xTicks[i], xTicks[i + 1]],
                total: total,
                result: "{0} of {1} observations.".format(total, scatter.data.length)
            });
        }
        xTicksTotal.sort(function(a, b) { return a.total - b.total; });
        xTicksTotal.forEach(function(item, index) {
            item["rank"] = index + 1;
        });
        scatter.AnnotateDistXIntervalGeneralized(xTicksTotal,constraints.xInterval, options);
    }

    scatter.DistYIntervalGeneralized = function (marks, constraints, options) {
        yTicks = d3.select(svg).selectAll(".y .tick")
            .nodes();
        yTicksTotal = [];
        for (i = 0; i < yTicks.length - 1; i++) {
            y1 = d3.select(yTicks[i]).data()[0];
            y2 = d3.select(yTicks[i + 1]).data()[0];
            total = 0;
            scatter.data.forEach(function (v, index) {
                if (parseFloat(v[scatter.label]) >= (y1 < y2 ? y1 : y2) &&
                    parseFloat(v[scatter.label]) <= (y1 < y2 ? y2 : y1)) {
                    total += 1;
                }
            });
            yTicksTotal.push({
                marks: marks,
                constraints: [yTicks[i], yTicks[i + 1]],
                total: total,
                result: "{0} of {1} observations.".format(total, scatter.data.length)
            });
        }
        yTicksTotal.sort(function (a, b) { return a.total - b.total; })
        yTicksTotal.forEach(function (item, index) {
            item["rank"] = index + 1;
        });
        scatter.AnnotateDistYIntervalGeneralized(yTicksTotal,constraints.yInterval, options);
    }

    scatter.Order = function (marks, constraints, options) {

    }

    scatter.Regress = function (marks, constraints, options) {

        var items = [];
        scatter.data.forEach(function(item, index) {
            item_array = [];
            item_array.push(parseFloat(item[scatter.label]));
            item_array.push(parseFloat(item[scatter.value]));
            items.push(item_array);
        });

        var regress = regression('linear', items);
        annotator.current["result"] = regress.equation;
        scatter.AnnotateRegress(regress, marks, constraints, options);
    }

    scatter.Predict = function(marks, constraints, options) {
        if (annotator.current &&
            annotator.current.result &&
            annotator.current.result.length == 2 &&
            constraints.hasOwnProperty("x")) {
            x = d3.select(constraints.x[0]).data()[0];
            equation = annotator.current.result;
            y = x * equation[0] + equation[1];
            if (options && options.hasOwnProperty("rounding")) {
                y = y.toFixed(options.rounding);
            }
            scatter.AnnotatePredict([x, y], marks, constraints, options);

        }
    }

    scatter.clear = function () {
        console.log("Reloading data....");
        scatter.data = d3.selectAll("circle").data();
        if (scatter.data) {
            scatter.data.clean(undefined);
        }
    }

    //ANNOTATIONS
    scatter.AnnotateDistX = function (result, marks, constraints, options) {
        x1 = constraints.x[0].parentNode.transform.baseVal[0].matrix.e;
        x2 = constraints.x[1].parentNode.transform.baseVal[0].matrix.e;

        d3.select(marks[0].parentNode)
            .append("rect")
            .attr("class", "annotation")
            .attr("x", x1 < x2 ? x1 : x2)
            .attr("y", 0)
            .attr("width", Math.abs(x1 - x2))
            .attr("height", d3.select(".y").node().getBBox().height - constraints.x[0].getBBox().height)
            .style("fill", getStyle("overlay", " rgba(205, 220, 57, 0.19)", options));

        // add result text
        node = d3.select(marks[0].parentNode)
            .append("text")
            .attr("class", "annotation result")
            .attr("x", x1 < x2 ? x1 : x2)
            .attr("y", 50)
            .attr("dy", ".35em")
            .attr("font-size", getStyle("font-size", "16px", options))
            .text(result);

        bbox = node._groups[0][0].getBBox();

        //add rectangle around result
        d3.select(marks[0].parentNode)
            .insert('rect', ".result")
            .attr("class", "annotation result")
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 5)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 10)
            .attr('stroke', "black")
            .attr("fill", getStyle("fill", "#eeff82", options));
    }

    scatter.AnnotateDistY = function (result, marks, constraints, options) {
        y1 = constraints.y[0].parentNode.transform.baseVal[0].matrix.f;
        y2 = constraints.y[1].parentNode.transform.baseVal[0].matrix.f;

        d3.select(marks[0].parentNode)
            .append("rect")
            .attr("class", "annotation")
            .attr("x", 0)
            .attr("y", y1 < y2 ? y1 : y2)
            .attr("height", Math.abs(y1 - y2))
            .attr("width", d3.select(".x").node().getBBox().width - constraints.y[0].getBBox().width)
            .style("fill", getStyle("overlay", " rgba(205, 220, 57, 0.19)", options));

        // add result text
        node = d3.select(marks[0].parentNode)
            .append("text")
            .attr("class", "annotation result")
            .attr("y", y1 < y2 ? y1 : y2)
            .attr("x", 50)
            .attr("dy", ".35em")
            .attr("font-size", getStyle("font-size", "16px", options))
            .text(result);

        bbox = node._groups[0][0].getBBox();

        //add rectangle around result
        d3.select(marks[0].parentNode)
            .insert('rect', ".result")
            .attr("class", "annotation result")
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 5)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 10)
            .attr('stroke', "black")
            .attr("fill", getStyle("fill", "#eeff82", options));

    }

    scatter.AnnotateDistXInterval = function (result, marks, constraints, options) {
        var x = constraints.xInterval;
        var xPrev = constraints.xInterval.previousSibling;
        var xNext = constraints.xInterval.nextSibling;
        var xOverlay, width;


        //first
        if (xPrev.tagName != "rect") {
            xOverlay = 0;
            width = x.getBBox().width + xPrev.getBBox().width;
        }
            //last
        else if (xNext == null) {
            start = (xPrev.transform.baseVal[0].matrix.e + xPrev.getBBox().width);
            xOverlay = start + Math.abs(start - x.transform.baseVal[0].matrix.e) / 2;
            width = x.getBBox().width + (x.transform.baseVal[0].matrix.e - xOverlay) * 2;
        }
            //middle
        else {
            //xt = x.transform.baseVal[0].matrix.e;
            //xPrevt = xPrev.transform.baseVal[0].matrix.e;
            start = (xPrev.transform.baseVal[0].matrix.e + xPrev.getBBox().width);
            xOverlay = start + Math.abs(start - x.transform.baseVal[0].matrix.e) / 2;
            width = x.getBBox().width + (x.transform.baseVal[0].matrix.e - xOverlay) * 2;
        }

        d3.select(marks[0].parentNode)
           .append("rect")
           .attr("class", "annotation")
           .attr("x", xOverlay)
           .attr("y", 0)
           .attr("width", width)
           .attr("height", d3.select(".y").node().getBBox().height - constraints.xInterval.getBBox().height)
           .style("fill", getStyle("overlay", " rgba(205, 220, 57, 0.19)", options));

        // add result text
        node = d3.select(marks[0].parentNode)
            .append("text")
            .attr("class", "annotation result")
             .attr("x", xOverlay)
            .attr("y", 50)
            .attr("dy", ".35em")
            .attr("font-size", getStyle("font-size", "16px", options))
            .text(result);

        bbox = node._groups[0][0].getBBox();

        //add rectangle around result
        d3.select(marks[0].parentNode)
            .insert('rect', ".result")
            .attr("class", "annotation result")
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 5)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 10)
            .attr('stroke', "black")
            .attr("fill", getStyle("fill", "#eeff82", options));
    }

    scatter.AnnotateDistXIntervalGeneralized = function(result,mark,options) {
        var color = d3.scaleLinear()
            .domain([1, result.length + 1])
            .range([
                getStyle("gradientStart", "rgb(233, 255, 208)", options),
                getStyle("gradientStop", "rgb(98, 177, 3)", options)
            ]);

        result.forEach(function(item, index) {
            x1 = item.constraints[0].transform.baseVal[0].matrix.e;
            x2 = item.constraints[1].transform.baseVal[0].matrix.e;

            rect = d3.select(item.marks[0].parentNode)
                .append("rect")
                .attr("id",item.result)
                .attr("class", "annotation")
                .attr("x", x1 < x2 ? x1 : x2)
                .attr("y", 0)
                .attr("stroke", "white")
                .attr("stroke-width","2")
                .attr("width", Math.abs(x1 - x2))
                .attr("height", d3.select(".y").node().getBBox().height - item.constraints[0].getBBox().height)
                .style("fill", function (d) { return setAlphaColor(color(item.rank)); });
            annotator.interaction.call(this,rect.node(), annotator.showTooltip);
        })
    }

    scatter.AnnotateDistYInterval = function (result, marks, constraints, options) {
        var y = constraints.yInterval;
        var yPrev = constraints.yInterval.previousSibling;
        var yNext = constraints.yInterval.nextSibling;
        var xOverlay, height = 0;

        //first
        if (yPrev.tagName != "rect") {
            yOverlay = y.transform.baseVal[0].matrix.f -
                Math.abs((yNext.transform.baseVal[0].matrix.f + yNext.getBBox().height) - y.transform.baseVal[0].matrix.f) / 2;
            height = y.getBBox().height +
                Math.abs((yNext.transform.baseVal[0].matrix.f + yNext.getBBox().height) - y.transform.baseVal[0].matrix.f);
        }
        else {
            yOverlay = y.transform.baseVal[0].matrix.f -
              Math.abs((y.transform.baseVal[0].matrix.f + y.getBBox().height) - yPrev.transform.baseVal[0].matrix.f) /
              2;
            height = y.getBBox().height +
                Math.abs((y.transform.baseVal[0].matrix.f + y.getBBox().height) - yPrev.transform.baseVal[0].matrix.f);
        }

        d3.select(marks[0].parentNode)
           .append("rect")
           .attr("class", "annotation")
           .attr("y", yOverlay)
           .attr("x", 0)
           .attr("height", height)
           .attr("width", d3.select(".x").node().getBBox().width - constraints.yInterval.getBBox().width)
           .style("fill", getStyle("overlay", " rgba(205, 220, 57, 0.19)", options));

        // add result text
        node = d3.select(marks[0].parentNode)
            .append("text")
            .attr("class", "annotation result")
             .attr("y", yOverlay)
            .attr("x", 50)
            .attr("dy", ".35em")
            .attr("font-size", getStyle("font-size", "16px", options))
            .text(result);

        bbox = node._groups[0][0].getBBox();

        //add rectangle around result
        d3.select(marks[0].parentNode)
            .insert('rect', ".result")
            .attr("class", "annotation result")
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 5)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 10)
            .attr('stroke', "black")
            .attr("fill", getStyle("fill", "#eeff82", options));
    }

    scatter.AnnotateDistYIntervalGeneralized = function(result,marks, options) {
        var color = d3.scaleLinear()
            .domain([1, result.length + 1])
            .range([
                getStyle("gradientStart", "rgb(233, 255, 208)", options),
                getStyle("gradientStop", "rgb(98, 177, 3)", options)
            ]);

        result.forEach(function(item, index) {
            y1 = item.constraints[0].transform.baseVal[0].matrix.f;
            y2 = item.constraints[1].transform.baseVal[0].matrix.f;
            rect = d3.select(item.marks[0].parentNode)
                .append("rect")
                .attr("id", item.result)
                .attr("class", "annotation")
                .attr("x", 0)
                .attr("y", y1 < y2 ? y1 : y2)
                .attr("stroke", "white")
                .attr("stroke-width", "2")
                .attr("height", Math.abs(y1 - y2))
                .attr("width", d3.select(".x").node().getBBox().width - item.constraints[0].getBBox().width)
                .style("fill", function(d) { return setAlphaColor(color(item.rank)); });
            annotator.interaction.call(this, rect.node(), annotator.showTooltip);
        })
    };

    scatter.AnnotateRegress = function (result, marks, constraints, options) {
        x = d3.select(".x").node().__axis;
        y = d3.select(".y").node().__axis;
        var regressionLine = d3.line()
                     .x(function (d) { return x(d[0]); })
                     .y(function (d) { return y(d[1]); });

        d3.select(marks[0].parentNode).append("path")
           .attr("class", "annotation")
           .style("fill", "none")
           .style("stroke", getStyle("stroke", "black", options))
           .style("stroke-width", getStyle("stroke-width", "2", options))
           .attr("d", regressionLine(result.points));

        equation = "y = {0}x + {1}".format(result.equation[0], result.equation[1]);

    }

    scatter.AnnotatePredict = function (result, marks, constraints, options) {
        d3.selectAll(".multiAnnotation").remove();
        if (result && result.length == 2) {
            xScale = d3.select(".x").node().__axis;
            yScale = d3.select(".y").node().__axis;
            d3.select(marks[0].parentNode)
                .append("line")
                .attr("class", "annotation multiAnnotation")
                .attr("x1",0)
                .attr("y1",yScale(result[1]))
                .attr("x2",xScale(result[0]))
                .attr("y2", yScale(result[1]))
                .style("stroke", getStyle("stroke", "grey", options))
                .style("stroke-width", getStyle("stroke-width", "1", options));

            d3.select(marks[0].parentNode)
                .append("line")
                .attr("class", "annotation multiAnnotation")
                .attr("x1", xScale(result[0]))
                .attr("y1", yScale(result[1]))
                .attr("x2", xScale(result[0]))
                .attr("y2", d3.select(".y").node().getBBox().y + d3.select(".y").node().getBBox().height)
                .style("stroke", getStyle("stroke", "grey", options))
                .style("stroke-width", getStyle("stroke-width", "1", options));

            if (options && options.hasOwnProperty("rounding")) {
                result[1] = result[1].toFixed(options.rounding);
            }

            // add result text
            node = d3.select(marks[0].parentNode)
                .append("text")
                .attr("class", "annotation multiAnnotation")
                .attr("y", yScale(result[1]) - 20)
                .attr("x", xScale(result[0]))
                .attr("dy", ".35em")
                .attr("font-size", getStyle("font-size", "16px", options))
                .text("Y = {0}".format(result[1]));

            bbox = node._groups[0][0].getBBox();

            //add rectangle around result
            d3.select(marks[0].parentNode)
                .insert('rect', ".multiAnnotation")
                .attr("class", "annotation multiAnnotation")
                .attr('x', bbox.x - 5)
                .attr('y', bbox.y - 5)
                .attr('width', bbox.width + 10)
                .attr('height', bbox.height + 10)
                .attr('stroke', "black")
                .attr("fill", getStyle("fill", "#eeff82", options));

        }
    }


    scatter.isMultiLayer = function(intent) {
        if (rules[intent] && rules[intent].hasOwnProperty("interact")) {
            return rules[intent].interact;
        }
        return null;
    }

    scatter.isGeneralizable = function(intent) {
        if (rules[intent] && rules[intent].hasOwnProperty("generalize")) {
            return rules[intent].generalize;
        }
        return null;
    }

    //HELPER FUNCTIONS
    //

    function getValue(m) {
        dataObj = d3.select(m).data();
        if (dataObj && dataObj.length > 0) {
            return dataObj[0][bar.value];
        }
    }

    function getLabel(m) {
        dataObj = d3.select(m).data();
        if (dataObj && dataObj.length > 0) {
            return dataObj[0][bar.label];
        }
    }

    function getStyle(prop, def, options) {
        if (options && options.hasOwnProperty(prop)) {
            return options[prop];
        }
        return def;
    }

    function setAlphaColor(color) {
        if (color.indexOf('a') == -1) {
            return color.replace(')', ', 0.25)').replace('rgb', 'rgba');
        }
        return color;
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
        ////Annotations for LINE GRAPH

annotator.line = function() {

    var rules = {
        "ChangeXInterval": { generalize: "ChangeXIntervalGeneralized" }
    }

    line.value = null;
    line.label = null;
    line.data = getData();
    line.x = d3.select(".x").node().__axis;
    line.y = d3.select(".y").node().__axis;

    // CLASS INSTANTIATION
    function line() {

    }

    //Measure
    line.ChangeX = function(marks,constraints,options) {
        console.log("Annotating for ChangeX");
        if (constraints && line.data) {
            if (constraints.hasOwnProperty("x") && constraints.x.length == 2) {
                // Calculate total number of observations between the two x-ticks
                x1 = d3.select(constraints.x[0]).data()[0];
                x2 = d3.select(constraints.x[1]).data()[0];
                x1Data = line.data.find(function(d) { return d[line.label] == x1 });
                x2Data = line.data.find(function(d) { return d[line.label] == x2 });

                c = x1 > x2 ? x1Data[line.value] - x2Data[line.value] : x2Data[line.value] - x1Data[line.value];
                if (options && options.hasOwnProperty("rounding")) {
                    c = c.toFixed(options.rounding);
                }
                result = "Change {0} - {1} : {2}".format(x1, x2, c);
                if (options && options.hasOwnProperty("unit")) {
                    result += options.unit;
                }
                line.AnnotateChangeX(result, marks, constraints, options);
            }
        }
    }

    line.ChangeXInterval = function (marks, constraints, options) {
        console.log("Annotating for ChangeXInterval");
        if (constraints && line.data) {
            if (constraints.hasOwnProperty("xInterval")) {
                // Calculate total number of observations between the two x-ticks
                id = constraints.xInterval.id.split("-");
                x1 = id[0];
                x2 = id[1];
                x1Data = line.data.find(function (d) { return d[line.label] == x1 });
                x2Data = line.data.find(function (d) { return d[line.label] == x2 });

                c = x1 > x2 ? x1Data[line.value] - x2Data[line.value] : x2Data[line.value] - x1Data[line.value];
                if (options && options.hasOwnProperty("rounding")) {
                    c = c.toFixed(options.rounding);
                }

                result = "Change {0} - {1} : {2}".format(x1, x2, c);
                if (options && options.hasOwnProperty("unit")) {
                    result += options.unit;
                }
                line.AnnotateChangeXInterval(result, marks, constraints, options);
            }
        }
    }

    line.ChangeXIntervalGeneralized  = function(marks, constraints, options) {

        result = [];

        line.data.forEach(function(item, index) {
            if (index < line.data.length - 1) {
                item["change"] = line.data[index + 1][line.value] - item[line.value];
                result.push(item);
            }
        });

        line.AnnotateChangeXIntervalGeneralized(result, marks, constraints, options);
    }

    line.Threshold = function (marks, constraints, options) {
        console.log("Annotating for Threshold")
        if (constraints && line.data) {
            if (constraints.hasOwnProperty("y")) {
                // Calculate total number of observations between the two y-ticks
                y1 = d3.select(constraints.y).data()[0];
                result = [];
                line.data.forEach(function(item, index) {
                    if (item[line.value] >= y1) {
                        result.push(item);
                    }
                });

                line.AnnotateThreshold(result, marks, constraints, options);
            }
        }
    }

    line.Value = function (marks, constraints, options) {
        console.log("Annotating for ChangeX");
        if (constraints && line.data) {
            if (constraints.hasOwnProperty("x") && constraints.x.length == 1) {
                // Calculate total number of observations between the two x-ticks
                x1 = d3.select(constraints.x[0]).data()[0];
                x1Data = line.data.find(function (d) { return d[line.label] == x1 })

                result = "Value at {0} : {1}".format(x1, x1Data[line.value]);
                if (options && options.hasOwnProperty("unit")) {
                    result += options.unit;
                }
                line.AnnotateValue(result, marks, constraints, options);
            }
        }
    }

    line.AnnotateChangeX = function(result, marks, constraints, options) {
        x1 = d3.select(constraints.x[0]).data()[0];
        x2 = d3.select(constraints.x[1]).data()[0];
        x1Data = line.data.find(function (d) { return d[line.label] == x1 });
        x2Data = line.data.find(function (d) { return d[line.label] == x2 });

        //x1 line
        d3.select(d3.select(".x").node().parentNode)
            .append("line")
            .attr("class", "annotation")
            .attr("x1", line.x(x1))
            .attr("y1", line.y(x1Data[line.value]))
            .attr("x2", line.x(x1))
            .attr("y2", d3.select(".y").node().getBBox().y + d3.select(".y").node().getBBox().height)
            .style("stroke", getStyle("stroke", "grey", options))
            .style("stroke-width", getStyle("stroke-width", "1", options));


        //x2 line
        d3.select(d3.select(".x").node().parentNode)
            .append("line")
            .attr("class", "annotation")
            .attr("x1", line.x(x2))
            .attr("y1", line.y(x2Data[line.value]))
            .attr("x2", line.x(x2))
            .attr("y2", d3.select(".y").node().getBBox().y + d3.select(".y").node().getBBox().height)
            .style("stroke", getStyle("strokeX", "grey", options))
            .style("stroke-width", getStyle("stroke-width", "1", options));


        //y1 line
        d3.select(d3.select(".x").node().parentNode)
            .append("line")
            .attr("class", "annotation")
            .attr("x1", line.x(x1) - 50)
            .attr("y1", line.y(x1Data[line.value]))
            .attr("x2", line.x(x1) + 50)
            .attr("y2", line.y(x1Data[line.value]))
            .style("stroke", getStyle("strokeY", "#8a2929", options))
            .style("stroke-width", getStyle("stroke-width", "1", options));

        //y2 line
        d3.select(d3.select(".x").node().parentNode)
           .append("line")
           .attr("class", "annotation")
           .attr("x1", line.x(x2) - 50)
           .attr("y1", line.y(x2Data[line.value]))
           .attr("x2", line.x(x2) + 50)
           .attr("y2", line.y(x2Data[line.value]))
           .style("stroke", getStyle("strokeY", "#8a2929", options))
           .style("stroke-width", getStyle("stroke-width", "1", options));


        // label
        // add result text
        node = d3.select(d3.select(".x").node().parentNode)
            .append("text")
            .attr("class", "annotation result")
            .attr("y",
                x1Data[line.value] < x2Data[line.value]
                ? line.y(x1Data[line.value]) - Math.abs(line.y(x1Data[line.value]) - line.y(x2Data[line.value])) - 20
                : line.y(x2Data[line.value]) - Math.abs(line.y(x1Data[line.value]) - line.y(x2Data[line.value])) - 20)
            .attr("x",
                x1 < x2
                ? line.x(x1) + Math.abs(line.x(x1) - line.x(x2))/2
                : line.x(x2) + Math.abs(line.x(x1) - line.x(x2))/2)
            .attr("dy", ".35em")
            .attr("font-size", getStyle("font-size", "16px", options))
            .text(result);

        bbox = node._groups[0][0].getBBox();

        //add rectangle around result
        d3.select(d3.select(".x").node().parentNode)
            .insert('rect', ".result")
            .attr("class", "annotation result")
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 5)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 10)
            .attr('stroke', "black")
            .attr("fill", getStyle("fill", "#eeff82", options));

    }

    line.AnnotateChangeXInterval = function(result, marks, constraints, options) {
        id = constraints.xInterval.id.split("-");
        x1 = id[0];
        x2 = id[1];
        x1Data = line.data.find(function (d) { return d[line.label] == x1 });
        x2Data = line.data.find(function (d) { return d[line.label] == x2 });

        //x1 line
        d3.select(d3.select(".x").node().parentNode)
            .append("line")
            .attr("class", "annotation")
            .attr("x1", line.x(x1))
            .attr("y1", line.y(x1Data[line.value]))
            .attr("x2", line.x(x1))
            .attr("y2", d3.select(".y").node().getBBox().y + d3.select(".y").node().getBBox().height)
            .style("stroke", getStyle("stroke", "grey", options))
            .style("stroke-width", getStyle("stroke-width", "1", options));


        //x2 line
        d3.select(d3.select(".x").node().parentNode)
            .append("line")
            .attr("class", "annotation")
            .attr("x1", line.x(x2))
            .attr("y1", line.y(x2Data[line.value]))
            .attr("x2", line.x(x2))
            .attr("y2", d3.select(".y").node().getBBox().y + d3.select(".y").node().getBBox().height)
            .style("stroke", getStyle("strokeX", "grey", options))
            .style("stroke-width", getStyle("stroke-width", "1", options));


        //y1 line
        d3.select(d3.select(".x").node().parentNode)
            .append("line")
            .attr("class", "annotation")
            .attr("x1", line.x(x1) - 50)
            .attr("y1", line.y(x1Data[line.value]))
            .attr("x2", line.x(x1) + 50)
            .attr("y2", line.y(x1Data[line.value]))
            .style("stroke", getStyle("strokeY", "#8a2929", options))
            .style("stroke-width", getStyle("stroke-width", "1", options));

        //y2 line
        d3.select(d3.select(".x").node().parentNode)
           .append("line")
           .attr("class", "annotation")
           .attr("x1", line.x(x2) - 50)
           .attr("y1", line.y(x2Data[line.value]))
           .attr("x2", line.x(x2) + 50)
           .attr("y2", line.y(x2Data[line.value]))
           .style("stroke", getStyle("strokeY", "#8a2929", options))
           .style("stroke-width", getStyle("stroke-width", "1", options));


        // label
        // add result text
        node = d3.select(d3.select(".x").node().parentNode)
            .append("text")
            .attr("class", "annotation result")
            .attr("y",
                x1Data[line.value] < x2Data[line.value]
                ? line.y(x1Data[line.value]) - Math.abs(line.y(x1Data[line.value]) - line.y(x2Data[line.value])) - 20
                : line.y(x2Data[line.value]) - Math.abs(line.y(x1Data[line.value]) - line.y(x2Data[line.value])) - 20)
            .attr("x",
                x1 < x2
                ? line.x(x1) + Math.abs(line.x(x1) - line.x(x2)) / 2
                : line.x(x2) + Math.abs(line.x(x1) - line.x(x2)) / 2)
            .attr("dy", ".35em")
            .attr("font-size", getStyle("font-size", "16px", options))
            .text(result);

        bbox = node._groups[0][0].getBBox();

        //add rectangle around result
        d3.select(d3.select(".x").node().parentNode)
            .insert('rect', ".result")
            .attr("class", "annotation result")
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 5)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 10)
            .attr('stroke', "black")
            .attr("fill", getStyle("fill", "#eeff82", options));

    }

    line.AnnotateThreshold = function (result, marks, constraints, options) {

        result.forEach(function(item, index) {

            x1 = item[line.label];
            x1Data = item;
            //x1 line
            //d3.select(d3.select(".x").node().parentNode)
            //    .append("line")
            //    .attr("class", "annotation")
            //    .attr("x1", line.x(x1))
            //    .attr("y1", line.y(x1Data[line.value]))
            //    .attr("x2", line.x(x1))
            //    .attr("y2", d3.select(".y").node().getBBox().y + d3.select(".y").node().getBBox().height)
            //    .style("stroke", getStyle("stroke", "grey", options))
            //    .style("stroke-width", getStyle("stroke-width", "1", options));


            //y1 line
            d3.select(d3.select(".x").node().parentNode)
                .append("line")
                .attr("class", "annotation")
                .attr("x1", line.x(x1) - 50)
                .attr("y1", line.y(x1Data[line.value]))
                .attr("x2", line.x(x1) + 50)
                .attr("y2", line.y(x1Data[line.value]))
                .style("stroke", getStyle("strokeY", "#8a2929", options))
                .style("stroke-width", getStyle("stroke-width", "1", options));

            // label
            // add result text
            node = d3.select(d3.select(".x").node().parentNode)
                .append("text")
                .attr("class", "annotation result")
                .attr("y", line.y(x1Data[line.value]) - 20)
                .attr("x",
                    line.x(x1)- 10)
                .attr("dy", ".35em")
                .attr("font-size", getStyle("font-size", "16px", options))
                .text(x1Data[line.value]);

            bbox = node._groups[0][0].getBBox();

            //add rectangle around result
            d3.select(d3.select(".x").node().parentNode)
                .insert('rect', ".result")
                .attr("class", "annotation result")
                .attr('x', bbox.x - 5)
                .attr('y', bbox.y - 5)
                .attr('width', bbox.width + 10)
                .attr('height', bbox.height + 10)
                .attr('stroke', "black")
                .attr("fill", getStyle("fill", "#eeff82", options));

        });


        bbox = constraints.y.getBBox();
        //add rectangle around result
        d3.select(constraints.y.parentNode)
            .insert('rect', ".text")
            .attr("class", "annotation result")
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 5)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 10)
            .attr('stroke', "black")
            .attr("fill", getStyle("fill", "#eeff82", options))
            .moveToBack();

        //add horizontal threshold line
        d3.select(constraints.y.parentNode)
            .append("line")
            .attr("class", "annotation hLine")
            .attr("y1", parseFloat(constraints.y.getAttribute("y")))
            .attr("x1", parseFloat(constraints.y.getAttribute("x")) + 10)
            .attr("y2", parseFloat(constraints.y.getAttribute("y")))
            .attr("x2",
                parseFloat(constraints.y.getAttribute("x")) + parseFloat(svg.getAttribute("width")))
            .style("stroke", getStyle("stroke", "black", options))
            .style("stroke-width", getStyle("stroke-width", "1.5", options));

        d3.select(constraints.y.parentNode.parentNode).moveToFront();
    }

    line.AnnotateValue = function(result, marks, constraints, options) {
        x1 = d3.select(constraints.x[0]).data()[0];
        x1Data = line.data.find(function (d) { return d[line.label] == x1 });

        //x1 line
        d3.select(d3.select(".x").node().parentNode)
            .append("line")
            .attr("class", "annotation")
            .attr("x1", line.x(x1))
            .attr("y1", line.y(x1Data[line.value]))
            .attr("x2", line.x(x1))
            .attr("y2", d3.select(".y").node().getBBox().y + d3.select(".y").node().getBBox().height)
            .style("stroke", getStyle("stroke", "grey", options))
            .style("stroke-width", getStyle("stroke-width", "1", options));


        //y1 line
        d3.select(d3.select(".x").node().parentNode)
            .append("line")
            .attr("class", "annotation")
            .attr("x1", line.x(x1) - 50)
            .attr("y1", line.y(x1Data[line.value]))
            .attr("x2", line.x(x1) + 50)
            .attr("y2", line.y(x1Data[line.value]))
            .style("stroke", getStyle("strokeY", "#8a2929", options))
            .style("stroke-width", getStyle("stroke-width", "1", options));

        // label
        // add result text
        node = d3.select(d3.select(".x").node().parentNode)
            .append("text")
            .attr("class", "annotation result")
            .attr("y", line.y(x1Data[line.value]) - 20)
            .attr("x",
                line.x(x1))
            .attr("dy", ".35em")
            .attr("font-size", getStyle("font-size", "16px", options))
            .text(result);

        bbox = node._groups[0][0].getBBox();

        //add rectangle around result
        d3.select(d3.select(".x").node().parentNode)
            .insert('rect', ".result")
            .attr("class", "annotation result")
            .attr('x', bbox.x - 5)
            .attr('y', bbox.y - 5)
            .attr('width', bbox.width + 10)
            .attr('height', bbox.height + 10)
            .attr('stroke', "black")
            .attr("fill", getStyle("fill", "#eeff82", options));

    }

    line.AnnotateChangeXIntervalGeneralized = function(result, marks, constraints, options) {
        positiveChanges = result.filter(function (i) { return i.change > 0 });
        negativeChanges = result.filter(function (i) { return i.change < 0 });

        var colorPositive = d3.scaleLinear()
            .domain([
                d3.min(positiveChanges, function (d) { return d.change }), d3
                .max(positiveChanges, function (d) { return d.change })
            ])
            .range([
                getStyle("gradientStartP", "rgb(233, 255, 208)", options),
                getStyle("gradientStopP", "rgb(98, 177, 3)", options)
            ]);


        var colorNegative = d3.scaleLinear()
            .domain([
                d3.min(negativeChanges, function (d) { return d.change }), d3
                .max(negativeChanges, function (d) { return d.change })
            ])
            .range([
                getStyle("gradientStartN", "rgb(228, 19, 19)", options),
                getStyle("gradientStopN", "rgb(234, 196, 196)", options)
            ]);


        result.forEach(function (item, index) {
            rect = d3.select(d3.select(".x").node().parentNode)
                 .append("rect")
                 .attr("id", "Change : " + item.change)
                 .attr("class", "annotation")
                 .attr("x", line.x(item[line.label]))
                 .attr("y", 0)
                 .attr("stroke", "white")
                 .attr("stroke-width", "2")
                 .attr("width", line.x(line.data[index+1][line.label]) - line.x(item[line.label]))
                 .attr("height", d3.select(".y").node().getBBox().height) //- constraints.xInterval.getBBox().height
                 .style("fill", function(d) {
                     return item.change > 0 ? setAlphaColor(colorPositive(item.change)) : setAlphaColor(colorNegative(item.change));
                });
            annotator.interaction.call(this, rect.node(), annotator.showTooltip);
        });
    }

    line.clear = function () {
        console.log("Reloading data....");
        line.data = getData();
    }

    line.isMultiLayer = function (intent) {
        if (rules[intent] && rules[intent].hasOwnProperty("interact")) {
            return rules[intent].interact;
        }
        return null;
    }

    line.isGeneralizable = function (intent) {
        if (rules[intent] && rules[intent].hasOwnProperty("generalize")) {
            return rules[intent].generalize;
        }
        return null;
    }

    function getData() {
        data = null;
        d3.selectAll("path").nodes().forEach(function (item, index) {
            if (item.hasOwnProperty("__data__") && item.__data__ && item.__data__.length > 0) {
                data =  item.__data__;
            }
        })
        return data;
    }

    function getStyle(prop, def, options) {
        if (options && options.hasOwnProperty(prop)) {
            return options[prop];
        }
        return def;
    }

    function setAlphaColor(color) {
        if (color.indexOf('a') == -1) {
            return color.replace(')', ', 0.1)').replace('rgb', 'rgba');
        }
        return color;
    }

    return line;
}


        return annotator;
    }
}));
