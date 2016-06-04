function dataVis () {

    var x = 0,
        y = 0,
        padding = { top: 40, bottom: 40, left: 20, right: 20},
        width = 700,
        height = 400;

    function vis (selection) {


        var data = selection.datum(),
            timeScaleForAxis = d3.time.scale(), //Scale for just showing the x (time) axis
            timeScale = d3.scale.ordinal(),    //Actual scale to determine x coordinate
            categScale = d3.scale.ordinal(),
            categories = d3.set(data.map(function(d){ return d.category; })).values(),
            colorScale = d3.scale.linear(),
            dates = data.filter(function(d){
                return d.category == categories[0];
            }).map(function(d){ return d.date; }),
            line = d3.svg.line(),
            rateScale = d3.scale.linear(),
            xAxis = d3.svg.axis(),
            oldest = d3.min(dates),
            newest = d3.max(dates),
            countMax = d3.max(data.map(function(d){ return d.count; })),
            borderWidth = 0.1,
            monthText = ["January", "Febrary", "March", "April", "May", "June",
                         "July", "August", "September", "Octorber", "November", "December"],
            /* Text is same as the original values */
            categText = {
                "D" : "Dealing with my lender or servicer",
                "P" : "Problems when you are unable to pay",
                "G" : "Getting a loan",
                "R" : "Repaying your loan",
                "C" : "Can't repay my loan"
            },

            //From ColorBrewer2.0
            colors = ['#ffffff', '#ffffb2','#fed976','#feb24c','#fd8d3c','#f03b20','#bd0026'],

            //Values are manually chose to show the data easier to see
            colorDomain = [0, 1, 24, 90, 210, 278, countMax];


        timeScale
            .domain(dates)
            .rangeRoundBands([padding.left, width - padding.right]);

        timeScaleForAxis
            .domain([oldest, newest])
            .rangeRound([timeScale(oldest) + timeScale.rangeBand() / 2,
                         timeScale(newest) + timeScale.rangeBand() / 2]);
        rateScale
            .domain([0, countMax])
            .range([0.0, 1.0]);

        colorScale
            .domain(colorDomain)
            .range(colors);

        categScale
            .domain(categories)
            .rangeRoundBands([padding.top, height - padding.bottom], 0.4);

        xAxis.scale(timeScaleForAxis).orient("bottom");

        line
            .x(function(d){ return d; })
            .y(function(d){ return d; })
            .interpolate("linear-closed");

        var gParent = selection.append("g"),
            gColumn = gParent.append("g"),
            gValues = gParent.append("g"),
            gCateg = gParent.append("g"),
            gLegend = gParent.append("g"),
            columnIDPrefix = "_backColumn",
            labelTxtIDPrefix = "_label",
            monthTextID = "_monthText",
            tooltipID = "_tooltip",
            indicatorID = "_indicator",
            opacityMOver = 0.2,
            opacityDefault = 0,
            lWidth = 120,
            lHeight = 20,
            lTextOfs = 4,
            indicatorWidth = 5,
            lx = (width - padding.left - padding.right) / 1.05 - lWidth,
            ly = padding.top / 1.3,
            getColumn = function (i) {
                return d3.select("#" + columnIDPrefix + Math.floor(i / categories.length));
            };


        var mouseOverEvent = function (selection) {
                selection.style("opacity", opacityMOver);
            },
            mouseLeaveEvent = function (selection) {
                selection.style("opacity", opacityDefault);
                d3.select("#" + monthTextID).remove();
            };


        //Draw Rects (Columns), which is highlighed when the mouse cursor is over
        gColumn.selectAll("rect").data(data).enter().append("rect")
            .attr("x", function(d) { return timeScale(d.date)})
            .attr("y", padding.top)
            .attr("id", function(d,i) { return columnIDPrefix + Math.floor(i / categories.length); })
            .attr("height", height - (padding.top + padding.bottom))
            .attr("width", timeScale.rangeBand())
            .style({
                "fill": "gray",
                "opacity": opacityDefault
            })
            .on("mouseover", function() {
                mouseOverEvent(d3.select(this));
            })
            .on("mouseleave", function() {
                mouseLeaveEvent(d3.select(this));
            });


        //Draw Rects (Values)
        gValues.selectAll("rect").data(data).enter().append("rect")
            .attr("x", function(d) { return timeScale(d.date); })
            .attr("y", function(d) { return categScale(d.category); })
            .attr("height", categScale.rangeBand())
            .attr("width", timeScale.rangeBand())
            //.attr("width", dummyTimeScale.rangeBand())
            .style({
                "fill" : "white",
                "stroke-width": borderWidth,
                "stroke": "black",
                "rx" : 0,
                "ry" : 0
            })
            .on("mouseover", function(d, i) {

                var rect = d3.select(this);

                mouseOverEvent(getColumn(i));

                d3.select(this).node().parentNode.appendChild(d3.select(this).node());
                d3.select(this).style({ "stroke-width" : 1 });
                d3.select("#" + labelTxtIDPrefix + d.category)
                    .transition().duration(100).style({
                    "font-size" : "17px"
                });


                //Add and show tooltip if not exist yet
                if (gParent.select("#" + tooltipID).empty()) {
                    var gTooltip = gParent.append("g").attr("id", tooltipID),
                        rectX = +rect.attr("x"),
                        rectY = +rect.attr("y"),
                        rectH = +rect.attr("height"),
                        rectW = +rect.attr("width"),
                        ofs = 4,
                        tWidth = 130,
                        tHeight = 60,

                        //Top-left point of the tooltip
                        newX = rectX + rectW + ofs,
                        newY = rectY + rectH + ofs;

                    if (width - padding.left - padding.right < newX + tWidth)
                        newX = rectX - tWidth - ofs;

                    if (height < newY + tHeight)
                        newY = rectY - tHeight - ofs;


                    gTooltip.append("rect")
                            .attr("x", newX)
                            .attr("y", newY)
                            .attr("width", tWidth)
                            .attr("height", tHeight)
                            .style({
                                "fill": "white",
                                "stroke-width": 2,
                                "stroke": "black",
                                "rx": 3,
                                "ry": 3
                            });

                    //Add Date text to tooltip
                    gTooltip.append("text")
                        .attr("x", newX + tWidth / 2)
                        .attr("y", newY + tHeight / 3.2)
                        .text(function(){
                            var date = rect.datum().date;
                            return monthText[date.getMonth()] + ", " + date.getFullYear();
                        })
                        .style({
                            "font-family": "sans-serif",
                            "font-size": "13px",
                            "text-anchor": "middle"
                        });

                    //Add count text to tooltip
                    gTooltip.append("text")
                        .attr("x", newX + tWidth / 2)
                        .attr("y", newY + (tHeight - (tHeight / 3)))
                        .text(function(){
                            var count = +rect.datum().count;

                            return count + " issue" + ((count == 0 || count == 1)? "" : "s");
                        })
                        .style({
                            "font-family": "sans-serif",
                            "font-size": "17px",
                            "text-anchor": "middle"
                        });

                }

                d3.select("#" + indicatorID)
                    .attr("x", function(){
                        var count = +rect.datum().count;
                        return lx + (lWidth * rateScale(count)) - (indicatorWidth / 2);
                    })
                    .style("opacity", 1)

            })
            .on("mouseleave", function(d, i) {

                mouseLeaveEvent(getColumn(i));
                d3.select(this).style({ "stroke-width": 0.1 });
                d3.select("#" + labelTxtIDPrefix + d.category)
                    .transition().duration(300).style({
                    "font-size" : "13px"
                });
                d3.select("#" + indicatorID).style("opacity", 0);
                gParent.select("#" + tooltipID).remove();
            });


        //Animation for rect colors
        gValues.selectAll("rect").transition().delay(function(d,i){ return i * 5; }).duration(800)
            .style("fill", function(d){
                return  colorScale(d.count);
            });

        //Show category names
        gCateg.selectAll("text").data(categories).enter().append("text")
            .attr("x", padding.left)
            .attr("y", function(d) { return categScale(d) - 4; })
            .attr("id", function(d) { return labelTxtIDPrefix + d; })
            //.transition().delay(1500)
            .text(function(d) { return categText[d]; })
            .style({
                "font-size" : "13px",
                "font-family" : "sans-serif"
            });

        //Show time axis at the bottom
        gParent.append("g")
            .attr("class","x axis")
            .attr("transform", "translate(0," + (height - padding.bottom) + ")")
            .call(xAxis);

        //Color scheme for legend
        var gradient = gLegend.append("defs")
            .append("linearGradient")
            .attr("id", "legendGradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("spreadmethond", "pad");

        gradient.selectAll("stop").data(colorDomain).enter().append("stop")
            .attr("offset", function(d){
                return rateScale(d) * 100 + "%";
            })
            .attr("stop-color", function(d,i){
                return colors[i];
            })
            .attr("stop-opacity", 1);


        //Draw legend
        gLegend.append("rect")
            .attr("x", lx)
            .attr("y", ly)
            .transition()
            .delay(1300)
            .attr("width", lWidth)
            .attr("height", lHeight)
            .style({
                "fill" : "url(#legendGradient)",
                "stroke-width" : 0.3,
                "stroke" : "black",
                "rx" : 0.5,
                "ry" : 0.5
            });

        //Min label for legend
        gLegend.append("text")
            .attr("x", lx)
            .attr("y", ly - lTextOfs)
            .transition()
            .delay(1300)
            .text("Min (0)")
            .style({
                "font-family" : "sans-serif",
                "font-size" : "10px",
                "text-anchor" : "middle"
            });

        //Max label for legend
        gLegend.append("text")
            .attr("x", lx + lWidth + lTextOfs)
            .attr("y", ly - lTextOfs)
            .transition()
            .delay(1300)
            .text("Max (" + countMax + ")")
            .style({
                "font-family" : "sans-serif",
                "font-size" : "10px",
                "text-anchor" : "middle"
            });

        //Draw Indicator, which shows the current value (count)
        gLegend.append("rect")
            .attr("x", lx + lWidth / 2)
            .attr("y", ly)
            .attr("id", indicatorID)
            .attr("width", indicatorWidth)
            .attr("height", lHeight - 1)
            .style({
                "fill" : "white",
                "stroke" : "black",
                "stroke-width" : 1.4,
                "opacity" : 0
            });
    }


    vis.x = function (val) {
        x = val;
        return vis;
    };

    vis.y = function (val) {
        y = val;
        return vis;
    };

    vis.width = function (val) {
        width = val;
        return vis;
    };

    vis.height = function (val) {
        height = val;
        return vis;
    };

    vis.padding = function (val) {
        padding = val;
        return vis;
    };

    return vis;

}

