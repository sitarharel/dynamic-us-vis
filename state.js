function State(svg, map, data, units, width, height) {
    this.svg = svg;
    this.map = map;
    this.data = data;
    this.units = units;


    var colors = [
        d3.hsl(122, 0.5, 0.49), d3.hsl(88, 0.5, 0.53), d3.hsl(45, 1, 0.51),
        d3.hsl(36, 1, 0.5), d3.hsl(14, 1, 0.57), d3.hsl(4, 0.9, 0.58), d3.hsl(340, 0.82, 0.52),
        d3.hsl(291, 0.64, 0.52), d3.hsl(207, 0.90, 0.54),
        d3.hsl(199, 0.98, 0.48), d3.hsl(192, 0.7, 0.5), d3.hsl(174, 0.76, 0.56)
    ];
    var color = colors[0];


    var vb = svg.attr('viewBox').split(/\s+|,/);
    width = width ? width : +vb[2];
    height = height ? height : +vb[3];
    var horizontal_offset = (+vb[2] - width)/2;
    var vertical_offset = (+vb[3] - height)/2;
    var locationColumns = 6;
    var locationRows = 9;
    var locationCoordinates = [];
    // Break the svg down into squares with locationColumns columns and locationRows rows
    for(var y = height * 0.1; y <= height * 0.9; y += height * 0.9 / locationRows) {
        for(var x = width * 0.1; x <= width * 0.9; x += width * 0.9 / locationColumns) {
            locationCoordinates.push([horizontal_offset + x, vertical_offset + y]);
        }
    }
    var locationScale = function(d) { return locationCoordinates[d]; }

    var areaScale;
    var opacityScale;
    var graphXScale;
    var graphYScale;
    var examine_text_g = svg.append("g");
    var examine_text;
    
    var cleanData = data.reduce((a,x) => {a[+x.STATE] = x; return a},[]);
    map.forEach((d) => d.name = cleanData[d.id].STNAME);

    var state_mapping = {
        "default": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d) => d.geo_origin,
            "tween": [
                {style: "fill-opacity", f: (d) => 1 },
                {attr: "area", f: (d) => d.origin_area},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => {
                    var c = d3.hsl(color.toString());
                    c.l = opacityScale(this.get_data(d.id));
                    return c;
                } },
                {style: "stroke-width", f: (d) => 0}
            ],

            "forEach": (d) => {d.no_clip = true; d.no_drag = true; d.bound_scale = false; d.no_hover = false; 
                d.text = "";
                d.tooltip = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip2 = "";
                d.tooltip3 = "";
                d.tooltip4 = ""},
            "tween_duration": 500

        },
        "circle": {
            "shape": (d) => d.circle_path,
            "shape_duration": 200,
            "location": (d) => d.geo_origin,
            "tween": [
                {style: "fill-opacity", f: (d) => 0.8},
                {attr: "area", f: (d) => areaScale(+this.get_data(d.id))},
                {attr: "origin_area", f: (d) => d.geo_origin_area},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "stroke-width", f: (d) => 3}
            ],
            "forEach": (d) => {d.no_clip = false; d.no_drag = false; d.bound_scale = false; d.no_hover = false; 
                d.text = "";
                d.tooltip = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip2 = "";
                d.tooltip3 = "";
                d.tooltip4 = ""},
            "tween_duration": 300
        },
        "layout": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d, i) => { return locationScale(this.get_data(d.id)) },
            "tween": [
                {attr: "area", f: (d) => width * 2 },
                {attr: "origin_area", f: (d) => d.bound_origin_area},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "fill-opacity", f: (d) => 1}, 
                {style: "stroke-width", f: (d) => 1}
            ],
            "forEach": (d) => {d.no_clip = false; d.no_drag = false; d.bound_scale = true; d.no_hover = false; 
                d.text = "" + (this.get_data(d.id) + 1) + ". " + d.name ;
                d.tooltip = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip2 = "";
                d.tooltip3 = "";
                d.tooltip4 = ""},
            "tween_duration": 500
        },
        "graph": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d) => { return [graphXScale(this.get_data(d.id)), graphYScale(this.get_compared_to_data(d.id))]; },
            "tween": [
                {style: "fill-opacity", f: (d) => 0.8}, 
                {attr: "area", f: (d) => width / 2 },
                {attr: "origin_area", f: (d) => d.geo_origin_area},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "stroke-width", f: (d) => 0}
            ],
            "forEach": (d) => {d.no_clip = true; d.no_drag = true; d.bound_scale = false; d.no_hover = false; 
                d.text = "";
                d.tooltip = this.column+":";
                d.tooltip2 = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip3 = this.compared_to+":";
                d.tooltip4 = cleanData[d.id][this.compared_to]+" "+ units[0][this.compared_to]},
            "tween_duration": 500
        },
        "graph_circle": {
            "shape": (d) => d.circle_path,
            "shape_duration": 500,
            "location": (d) => { return [graphXScale(this.get_data(d.id)), graphYScale(this.get_compared_to_data(d.id))]; },
            "tween": [
                {style: "fill-opacity", f: (d) => 0.8}, 
                {attr: "area", f: (d) => 50},
                {attr: "origin_area", f: (d) => d.geo_origin_area},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "stroke-width", f: (d) => 0}
            ],
            "forEach": (d) => {d.no_clip = true; d.no_drag = true; d.bound_scale = false; d.no_hover = false; 
                d.tooltip = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip2 = cleanData[d.id][this.compared_to]+" "+ units[0][this.compared_to]},
            "forEach": (d) => {d.no_clip = true; d.no_drag = true; d.bound_scale = false; 
                d.text = "";
                d.tooltip = this.column+":";
                d.tooltip2 = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip3 = this.compared_to+":"
                d.tooltip4 = cleanData[d.id][this.compared_to]+" "+ units[0][this.compared_to]},
            "tween_duration": 500
        },
    };

    this.column = "POPULATION (2010)";
    this.compared_to = "STARBUCKS";
    this.current_state = "default";
    this.previous_state = this.current_state;
    this.map_options = state_mapping[this.current_state];

    var columnData = {};
    var comparedToData = {};

    this.set_map_state = function(state_name, options) {
        // Set the current state
        this.remove_examine_state();
        this.previous_state = this.current_state;
        this.current_state = state_name;
        
        // Change domains to reflect data changes
        this.set_domains();

        // Retrieve options of this state_name and overwrite existing values with
        // values from data-specific options, if any
        var stateOptions = state_mapping[state_name] || state_mapping["default"];
        stateOptions = Object.assign(stateOptions, options || {});
        this.map_options = stateOptions;

        // Update scale
        this.update_scale();

        // Transform the map based on options given
        this.map.shape(stateOptions.shape, stateOptions.shape_duration)
            .location(stateOptions.location)
            .tween(stateOptions.tween, stateOptions.tween_duration)
            .forEach(stateOptions.forEach)
            .onClick((d) => state.set_examine_state(d.id));

        // Draw or remove axes as necessary
        if (this.current_state == "graph" || this.current_state == "graph_circle") this.draw_axises();
        else this.remove_axises();
   
    }

    this.remove_examine_state = function(){
        if(examine_text) examine_text.remove().exit();
        examine_text_g.selectAll("text").remove();
    }

    this.set_examine_state = function(id){
        var data = Object.keys(cleanData[id]).filter((a) => 
            !["SUMLEV", "REGION", "DIVISION", "STATE", "COUNTY", "STNAME"].includes(a));
        data = data.map((k) => {return {key: k, val: cleanData[id][k], units: units[0][k]}})
        var cDl = data.length;

        examine_text = examine_text_g.selectAll("text").data(data).enter()
        .append("text")
        .attr("x", (d, i) => {
            var xoff = Math.sin(Math.PI * 2*(i >= cDl/2 ? i - cDl/2: i)/cDl)*100;
            var x = horizontal_offset + (i >= cDl/2 ? width - (300 - xoff): 300 - xoff);
            if (x > width/1.5) return x + x * 0.5;
            else return x - x * 0.5;
        })
        .attr("y", (d, i) => {
            return vertical_offset + (i >= cDl/2 ? i - cDl/2: i) * 30 + cDl * 30 / 8
        })
        .attr("dy", "1em")
        .style("text-anchor", (d, i) => i >= cDl/2 ? "start" : "end")
        .style("stroke", "none")
        .append("tspan")
        .style("font-weight", 700)
        .text((d) => d.key + ": ")
        .append("tspan")
        .style("fill", "var(--main-color)")
        .text((d) => d.val + " ")
        .append("tspan")
        .style("fill", "white")
        .text((d) => d.units)

        examine_text_g.selectAll("text")
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .attr("x", (d, i) => {
            var xoff = Math.sin(Math.PI * 2*(i >= cDl/2 ? i - cDl/2: i)/cDl)*100;
            return horizontal_offset + (i >= cDl/2 ? width - (300 - xoff): 300 - xoff); 
        });

        examine_text_g.append("text").text(cleanData[id]["STNAME"])
        .style("fill", color)
        .style("stroke", color)
        .style("font-size", "42pt")
        .style("text-anchor", "middle")
        .attr("x", horizontal_offset + width/2)
        .attr("y", 100)
        .style("opacity", 0)
        .transition().duration(500)
        .style("opacity", 1);

        this.map.shape((d) => d.state_shape, 500)
            .location((d) => { 
                if(d.id == id) return [horizontal_offset + width/2, vertical_offset + height/2];
                var sigma = d.index/50 * 2 * Math.PI;
                var radius = 500;
                return [horizontal_offset + width/2 + Math.cos(sigma) * radius,
                    vertical_offset + height/2 + Math.sin(sigma) * radius]; 
            }).tween([
                {style: "fill-opacity", f: (d) => 0.8}, 
                {attr: "area", f: (d) => {
                    if(d.id == id) return 75000;
                    return 0;
                }},
                {attr: "origin_area", f: (d) => d.bound_origin_area},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "stroke-width", f: (d) => d.id == id ? 2 : 0}
            ], 500)
            .forEach((d) => {d.no_clip = true; d.no_drag = false; d.bound_scale = true; d.no_hover = true; d.text = "";})
            .onClick((d) => state.set_map_state(this.current_state));

        this.remove_axises();
        this.remove_scale();
    }

    this.get_color = function(n) {
        return colors[n % colors.length];
    }

    //http://stackoverflow.com/questions/34888205/insert-padding-so-that-points-do-not-overlap-with-y-or-x-axis
    function getExtendedDomain(extent){
        range = extent[1] - extent[0];
        return [extent[0] - range * 0.05, extent[1] + range * 0.05];
    }

    this.set_domains = function() {
        var extent = d3.extent(Object.values(columnData)) || [0, 1];
        areaScale = d3.scaleLinear().range([2500, 12500]).domain(extent);
        opacityScale = d3.scaleLinear().range([0.8, 0.4]).domain(extent);
        graphXScale = d3.scaleLinear().range([horizontal_offset + width * 0.1, horizontal_offset + width - width * 0.1]).domain(getExtendedDomain(extent));

        if (this.current_state == "layout")
            opacityScale = d3.scaleLinear().range([0.8, 0.4]).domain([0, Object.values(columnData).length]);

    }

    function sortStateByValue() {
        var keys = [];
        for(var key in columnData){
            if(key != "NaN" && key != "11") keys.push(key); 
        }
        keys.sort(function(a,b){
            if (columnData[a] < columnData[b]) return 1
            else return -1;
        });
        return keys
    }

    this.get_data = function(state_fips) {
        // Look up data for set column for this state based on its fips code (d.id)
        if (this.current_state != "layout"){
            return columnData[+state_fips];
        }

        // If the state is layout, then get the ranking instead of the actual data
        var keys = sortStateByValue();
        return keys.indexOf(String(state_fips));
    }

    this.set_data = function(column, options) {
        this.column = column;

        // Reset column data and update to reflect the values of the column
        columnData = {};
        this.data.forEach(function(d){
            columnData[+d.STATE] = (columnData[+d.STATE] || 0) + +d[column];
        });

        // Pick a color for this dataset
        var columns = new Set();
        Object.keys(this.data[0]).forEach(function(d){ columns.add(d)});
        color = this.get_color(Array.from(columns).indexOf(column));

        // Transform map with new data
        this.set_map_state(this.current_state, options);
    }

    this.get_compared_to_data = function(state_fips) {
        return comparedToData[+state_fips];
    }

    this.set_compared_to_data = function(column) {
        this.compared_to = column;
        comparedToData = {};
        this.data.forEach(function(d){
            comparedToData[+d.STATE] = (comparedToData[+d.STATE] || 0) + +d[column];
        });
        var extent = d3.extent(Object.values(comparedToData));
        graphYScale = d3.scaleLinear()
            .range([vertical_offset + height - height * 0.1, vertical_offset + height * 0.1])
            .domain(getExtendedDomain(extent));

        this.set_map_state(this.current_state);
    }

    this.remove_axises = function() {
        this.svg.selectAll(".graph-axis").remove();
        this.svg.selectAll(".regression-line").remove();
        this.svg.selectAll(".error-line").remove();
    }

    this.draw_axises = function() {
        this.remove_axises();
        this.svg.append("g")
            .attr("class", "graph-axis")
            .attr("transform", "translate(0," + (vertical_offset + height - height * 0.1) + ")")
            .call(d3.axisBottom(graphXScale));
        this.svg.append("g")
            .attr("class", "graph-axis")
            .attr("transform", "translate(" + (horizontal_offset + width * 0.1) + ",0)")
            .call(d3.axisLeft(graphYScale));

        this.svg.append("text")
            .attr("class", "graph-axis")
            .attr("y", vertical_offset + height - height * 0.05 )
            .attr("x", horizontal_offset + (width / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(this.column);

        this.svg.append("text")
            .attr("class", "graph-axis")
            .attr("transform", "rotate(-90)")
            .attr("y", horizontal_offset + width * 0.01)
            .attr("x", 0 - height/2 - vertical_offset)
            .style("text-anchor", "middle")
            .text(this.compared_to)


            var params = this.lin_reg(this.data,this.column,this.compared_to);
            var col = this.column;
            var comp = this.compared_to;
            var dat = this.data.slice(0,this.data.length-1);   


            this.svg.append("text")
            .attr("class","regression-line")
            .attr("x",this.svg.attr("width")-horizontal_offset)
            .attr("y",100)
            .attr("font-size","20px")
            .text("Pearson Coefficient: "+ parseFloat(params[2]).toFixed(2));
   

            if (Math.abs(params[2])>=0.6){ // pearson correlation threshold = +/- 0.6
              
                xrange = graphXScale.domain();
                this.svg.append("line")
                .attr("class","regression-line")
                .attr("x1",graphXScale(xrange[0]))
                .attr("y1",graphYScale(params[1]+params[0]*xrange[0]))
                .attr("x2",graphXScale(xrange[1]))
                .attr("y2",graphYScale(params[1]+params[0]*xrange[1]))
                .style("stroke-width","2px");

                this.svg.append("text")
                .attr("class","regression-line")
                .attr("x",this.svg.attr("width")-horizontal_offset)
                .attr("y",130)
                .attr("font-size","20px")
                .text("Slope: "+ parseFloat(params[0]).toFixed(5));  

                this.svg.append("text")
                .attr("class","regression-line")
                .attr("x",this.svg.attr("width")-horizontal_offset)
                .attr("y",160)
                .attr("font-size","20px")
                .text("Y-Intercept: "+ parseFloat(params[1]).toFixed(2)); 

            if (this.current_state=="graph_circle"){  
                var errorlines = this.svg.selectAll(".error-line")
                .data(dat)
                .enter()
                .append("line")
                .attr("class","error-line")
                .attr("x1",function(d){return graphXScale(d[col])})
                .attr("y1",function(d){
                    y1 = graphYScale(params[1]+params[0]*d[col]);
                    if (y1>vertical_offset) return y1;
                    return graphYScale(d[comp])})
                .attr("x2",function(d){return graphXScale(d[col])})
                .attr("y2",function(d){return graphYScale(d[comp])})
                .style("opacity",0.5);           
            }
        }


    }


    this.lin_reg = function(d,xvar,yvar){
        // https://en.wikipedia.org/wiki/Simple_linear_regression
        var datalength = d.length-1;
        var xmean = 0;
        var ymean = 0;
        var xr = 0;
        var yr = 0;
        var yr2 = 0;
        var term1 = 0;
        var term2 = 0;
        var pearson;
        // means
        for (var k=0; k<datalength; ++k){
            xmean += (d[k][xvar])/datalength;
            ymean += (d[k][yvar])/datalength;
        }
        // coefficients
        for (var w=0; w<datalength; ++w){
            xr = d[w][xvar] - xmean;
            yr = d[w][yvar]- ymean;
            yr2 += yr*yr;
            term1 += xr*yr;
            term2 += xr*xr;
        }
        pearson = term1/(Math.sqrt(term2)*Math.sqrt(yr2));
        var fitted_slope = term1/term2;
        var fitted_intercept = ymean - (fitted_slope*xmean);
        return [fitted_slope,fitted_intercept,pearson];
    }

    this.remove_scale = function() {
        svg.selectAll("g.legend")
        .remove()
        .exit()
    }

    this.update_scale = function() {
        var data = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8];
        if (this.current_state == "circle") {
            data = [12500, 10000, 7500, 5000, 2500];
        }

        var column = this.column;

        var legend = svg.selectAll("g.legend")
        .remove()
        .exit()
        .data(data)
        .enter().append("g")
        .attr("class", "legend");

        var ls_w = 20, ls_h = 20;
        var label_start = 250;
        if (this.current_state == "default") {
            legend.append("rect")
            .attr("x", 50)
            .attr("y", function(d, i){ return label_start + i * ls_h;})
            .style("fill", "#3b4951")
            .transition()
            .duration(function(d, i){ return 500 + 100 * i})
            .attr("width", ls_w)
            .attr("height", ls_h)
            .style("fill", function(d, i) {
                var c = d3.hsl(color.toString());
                c.l = d;
                return c.toString();
            })
            .style("stroke", "none")
            .style("opacity", 1);

            legend.append("text")
            .attr("class", "legendLabel")
            .attr("x", 50)
            .attr("y", label_start - ls_h)
            .style("stroke", "none")
            .text(units[0][column])
            .style("opacity", 0)
            .transition()
            .duration(1500)
            .style("opacity", 1)

            legend.append("text")
            .attr("class", "legendLabel")
            .attr("x", 80)
            .attr("y", function(d, i){ return label_start + i * ls_h + ls_h - 5;})
            .text(function(d, i){ return d3.format(",.2f")(opacityScale.invert(d)); })
            .style("opacity", 0)
            .style("stroke", "none")
            .transition()
            .duration(function(d, i){ return 500 + 100 * i})
            .style("opacity", 1);

        } else if (this.current_state == "circle") {
            legend.append("text")
            .attr("class", "legendLabel")
            .attr("x", 50)
            .attr("y", label_start / 2)
            .style("stroke", "none")
            .text(units[0][column])
            .style("opacity", 0)
            .transition()
            .duration(1500)
            .style("opacity", 1)

            var prev_height = 0;
            legend.append("circle")
            .attr("cx", 70)
            .attr("cy", function(d, i){ prev_height += Math.sqrt(d / Math.PI)*2 + 20; return label_start/4 + prev_height;})
            .style("fill", function(d, i) { var c = d3.color(color); c.opacity = 0.8; return c.toString(); })
            .style("stroke", "white")
            .style("stroke-width", "3px")
            .transition()
            .duration(function(d, i){ return 750 + 100 * i})
            .attr("r", function(d){ return Math.sqrt(d / Math.PI);})

            prev_height = 0;
            legend.append("text")
            .attr("class", "legendLabel")
            .attr("x", 150)
            .attr("y", function(d, i){ prev_height += Math.sqrt(d / Math.PI)*2 + 20; return label_start/4 + prev_height;})
            .text(function(d, i){ return d3.format(",.2f")(areaScale.invert(d)); })
            .style("opacity", 0)
            .style("stroke", "none")
            .transition()
            .duration(function(d, i){ return 500 + 250 * i})
            .style("opacity", 1);
        } else if (this.current_state == "layout") {
            // var keys = sortStateByValue();
            // var stateNames = {};
            // this.data.forEach(function(s){ stateNames[s.STATE] = s.STNAME; });

            // keys.forEach(function(d, i){
            //     var loc = locationScale(i);

            //     legend.append("text")
            //     .attr("x", loc[0])
            //     .attr("y", loc[1] + 50)
            //     .text((i+1) + ". " + stateNames[d])
            //     .style("stroke", "none")
            //     .style("text-anchor", "middle")
            //     .style("font-size", "16px")
            //     .style("opacity", 0)
            //     .transition()
            //     .duration(500 + 50 * i)
            //     .style("opacity", 1);
            // });
        }
    }

    // Initially set the data for the column
    this.set_data(this.column);
    this.set_compared_to_data(this.compared_to);
    this.update_scale();
}
