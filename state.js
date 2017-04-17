function State(svg, map, data, units, width, height) {
    this.svg = svg;
    this.map = map;
    this.data = data;
    this.units = units;

    var colors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#7b46ff"];
    var color = colors[0];

    width = width ? width : +svg.attr("width");
    height = height ? height : +svg.attr("height");
    var horizontal_offset = (+svg.attr("width") - width)/2;
    var vertical_offset = (+svg.attr("height") - height)/2;
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
    var areaScale = d3.scaleLinear().range([2500, 12500]);
    var opacityScale = d3.scaleLog().range([0.1, 0.9]);
    var graphXScale = d3.scaleLinear().range([width * 0.1, width * 0.9]);
    var graphYScale = d3.scaleLinear().range([height * 0.9, height * 0.1]);

    // this should definitely be temporary.
    var cleanData = data.reduce((a,x) => {a[+x.STATE] = x; return a},[]);
    map.forEach((d) => d.name = cleanData[d.id].STNAME);

    var state_mapping = {
        "default": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d) => d.geo_origin,
            "tween": [
                {style: "opacity", f: (d) => { return opacityScale(this.get_data(d.id)); }},
                {attr: "area", f: (d) => d.origin_area},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "stroke-width", f: (d) => 0}
            ],
            "forEach": (d) => {d.no_clip = true; d.no_drag = true; d.bound_scale = false; 
                d.tooltip = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip2 = ""},
            "tween_duration": 1000
        },
        "circle": {
            "shape": (d) => d.circle_path,
            "shape_duration": 200,
            "location": (d) => d.geo_origin,
            "tween": [
                {style: "opacity", f: (d) => 0.8},
                {attr: "area", f: (d) => areaScale(+this.get_data(d.id))},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "stroke-width", f: (d) => 3}
            ],
            "forEach": (d) => {d.no_clip = false; d.no_drag = false; d.bound_scale = false; 
                d.tooltip = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip2 = ""},
            "tween_duration": 300
        },
        "layout": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d, i) => { return locationScale(this.get_data(d.id)) },
            "tween": [
                {attr: "area", f: (d) => width * 4 },
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "opacity", f: (d) => 1}, 
                {style: "stroke-width", f: (d) => 1}
            ],
            "forEach": (d) => {d.no_clip = false; d.no_drag = false; d.bound_scale = true; 
                d.tooltip = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip2 = ""},
            "tween_duration": 500
        },
        "graph": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d) => { return [graphXScale(this.get_data(d.id)), graphYScale(this.get_compared_to_data(d.id))]; },
            "tween": [
                {style: "opacity", f: (d) => 0.8}, 
                {attr: "area", f: (d) => width / 2 },
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "stroke-width", f: (d) => 0}
            ],
            "forEach": (d) => {d.no_clip = true; d.no_drag = true; d.bound_scale = false; 
                d.tooltip = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip2 = cleanData[d.id][this.compared_to]+" "+ units[0][this.compared_to]},
            "tween_duration": 500
        },
        "graph_circle": {
            "shape": (d) => d.circle_path,
            "shape_duration": 500,
            "location": (d) => { return [graphXScale(this.get_data(d.id)), graphYScale(this.get_compared_to_data(d.id))]; },
            "tween": [
                {style: "opacity", f: (d) => 0.8}, 
                {attr: "area", f: (d) => 50},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "stroke-width", f: (d) => 0}
            ],
            "forEach": (d) => {d.no_clip = true; d.no_drag = true; d.bound_scale = false; 
                d.tooltip = cleanData[d.id][this.column]+" "+ units[0][this.column];
                d.tooltip2 = cleanData[d.id][this.compared_to]+" "+ units[0][this.compared_to]},
            "tween_duration": 500
        },
    }

    this.column = "POPULATION (2010)";
    this.compared_to = "STARBUCKS";
    this.current_state = "default";
    this.previous_state = this.current_state;
    this.map_options = state_mapping[this.current_state];



    var columnData = {};
    var comparedToData = {};

    this.set_map_state = function(state_name, options) {
        // Set the current state
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
            .forEach(stateOptions.forEach);

        // Draw or remove axes as necessary
        if (this.current_state == "graph" || this.current_state == "graph_circle") this.draw_axises();
        else this.remove_axises();
   
    }

    this.set_examine_state = function(id){
        // console.log(svg);
        var datas = svg.append("g");
        Object.keys(cleanData[id]).forEach((key) => {
            console.log(key);
        })
        // (cleanData[id])

        this.map.shape((d) => d.state_shape, 500)
            .location((d) => { 
                if(d.id == id) return [horizontal_offset + width/2, vertical_offset + height/2];
                var sigma = d.index/50 * 2 * Math.PI;
                var radius = 500;
                return [horizontal_offset + width/2 + Math.cos(sigma) * radius,
                    vertical_offset + height/2 + Math.sin(sigma) * radius]; 
            }).tween([
                {style: "opacity", f: (d) => 0.8}, 
                {attr: "area", f: (d) => {
                    if(d.id == id) return 75000;
                    return 0;
                }},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color},
                {style: "stroke-width", f: (d) => d.id == id ? 2 : 0}
            ], 500)
            .forEach((d) => {d.no_clip = true; d.no_drag = false; d.bound_scale = true;});

        this.remove_axises();
    }

    this.get_color = function(n) {
        return colors[n % colors.length];
    }

    this.set_domains = function() {
        var extent = d3.extent(Object.values(columnData)) || [0, 1];
        areaScale = d3.scaleLinear().range([2500, 12500]).domain(extent);
        opacityScale = d3.scaleLinear().range([0.1, 0.9]).domain(extent);
        graphXScale = d3.scaleLinear().range([horizontal_offset + width * 0.1, horizontal_offset + width - width * 0.1]).domain(extent);

        if (this.current_state == "layout")
            opacityScale = d3.scaleLinear().range([0.9,0.1]).domain([0, Object.values(columnData).length]);

    }

    this.get_data = function(state_fips) {
        // Look up data for set column for this state based on its fips code (d.id)
        if (this.current_state != "layout"){
            return columnData[+state_fips];
        }

        // If the state is layout, then get the ranking instead of the actual data
        var keys = [];
        for(var key in columnData) keys.push(key);
        keys.sort(function(a,b){return columnData[b]-columnData[a]});
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
        graphYScale = d3.scaleLinear().range([vertical_offset + height - height * 0.1, vertical_offset + height * 0.1]).domain(extent);

        this.set_map_state(this.current_state);
    }

    this.remove_axises = function() {
        this.svg.selectAll(".graph-axis").remove();
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
    }

    this.create_scale = function() {
        var legend = svg.selectAll("g.legend")
        .data([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
        .enter().append("g")
        .attr("class", "legend");

        var ls_w = 20, ls_h = 20;

        legend.append("rect")
        .attr("x", 50)
        .attr("y", function(d, i){ return height - (i*ls_h) - 2*ls_h - 350;})
        .attr("width", ls_w)
        .attr("height", ls_h)
        .style("fill", function(d, i) { return color; })
        .style("stroke", "none")
        .style("opacity", function(d) { return d; });

        legend.append("text")
        .attr("class", "legendLabel")
        .attr("x", 80)
        .attr("y", function(d, i){ return height - (i*ls_h) - ls_h - 4 - 350;})
        .text(function(d, i){ return d3.format(",.2f")(opacityScale.invert(d)); });
    }

    this.update_scale = function() {
        if (this.current_state == "default") {
            svg.selectAll("g.legend")
            .transition()
            .duration(500)
            .style("display", "block")

            svg.selectAll("g.legend rect")
            .transition()
            .duration(this.previous_state == "default" ? this.map_options.tween_duration : 0)
            .style("fill", function(d){ return color;});

            svg.selectAll(".legendLabel")
            .text(function(d){ return d3.format(",.2f")(opacityScale.invert(d)); })
        } else {
            svg.selectAll("g.legend")
            .transition()
            .duration(500)
            .style("display", "none")
        }
    }

    // Initially set the data for the column
    this.set_data(this.column);
    this.set_compared_to_data(this.compared_to);
    this.create_scale();
}
