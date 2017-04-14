function State(svg, map, data) {
    this.svg = svg;
    this.map = map;
    this.data = data;

    var colors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    var color = colors[0];

    var width = +svg.attr("width");
    var height = +svg.attr("height");
    var locationColumns = 9;
    var locationRows = 7;
    var locationCoordinates = [];
    // Break the svg down into squares with locationColumns columns and locationRows rows
    for(var y = height * 0.1; y < height - height * 0.1; y += (height - height * 0.1) / locationRows) {
        for(var x = width * 0.1; x < width - width * 0.1; x += (width - width * 0.1) / locationColumns) {
            locationCoordinates.push([x, y]);
        }
    }
    var locationScale = function(d) { return locationCoordinates[d]; }
    var areaScale = d3.scaleLinear().range([2500, 12500]);
    var opacityScale = d3.scaleLog().range([0.1, 0.9]);
    var graphXScale = d3.scaleLinear().range([width * 0.1, width - width * 0.1]);
    var graphYScale = d3.scaleLinear().range([height - height * 0.1, height * 0.1]);

    var state_mapping = {
        "default": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d) => d.geo_origin,
            "tween": [
                {style: "opacity", f: (d) => { return opacityScale(this.get_data(d.id)); }},
                {attr: "area", f: (d) => {d.no_clip = true; d.bound_scale = false; return d.origin_area }},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color}
            ],
            "tween_duration": 1000
        },
        "circle": {
            "shape": (d) => d.circle_path,
            "shape_duration": 200,
            "location": (d) => d.geo_origin,
            "tween": [
                {style: "opacity", f: (d) => { return opacityScale(this.get_data(d.id)); }},
                {attr: "area", f: (d) => { d.no_clip = false; d.bound_scale = false; return areaScale(+this.get_data(d.id)); }},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color}
            ],
            "tween_duration": 300
        },
        "layout": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d, i) => { return locationScale(this.get_data(d.id)) },
            "tween": [
                {style: "opacity", f: (d) => { return opacityScale(this.get_data(d.id)); }},
                {attr: "area", f: (d) => {d.no_clip = false; d.bound_scale = true; return width * 4}},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color}
            ],
            "tween_duration": 500
        },
        "graph": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d) => { return [graphXScale(this.get_data(d.id)), graphYScale(this.get_compared_to_data(d.id))]; },
            "tween": [
                {style: "opacity", f: (d) => 0.8}, 
                {attr: "area", f: (d) => {d.no_clip = true; d.bound_scale = false; return width / 2 }},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color}
            ],
            "tween_duration": 1000
        },
    }

    this.column = "CENSUS2010POP";
    this.compared_to = "CENSUS2010POP";
    this.current_state = "layout";
    this.map_options = state_mapping[this.current_state];

    var columnData = {};
    var comparedToData = {};

    this.set_map_state = function(state_name, options) {
        // Set the current state
        this.current_state = state_name;

        // Change domains to reflect data changes
        this.set_domains();

        // Retrieve options of this state_name and overwrite existing values with
        // values from data-specific options, if any
        var stateOptions = state_mapping[state_name];
        stateOptions = Object.assign(stateOptions, options || {});
        this.map_options = stateOptions;

        // Transform the map based on options given
        this.map.shape(stateOptions.shape, stateOptions.shape_duration)
            .location(stateOptions.location)
            .tween(stateOptions.tween, stateOptions.tween_duration);

        if (this.current_state == "graph") this.draw_axises();
        else this.remove_axises();
    }

    this.get_color = function(n) {
        return colors[n % colors.length];
    }

    this.set_domains = function() {
        var extent = d3.extent(Object.values(columnData)) || [0, 1];
        areaScale = d3.scaleLinear().range([2500, 12500]).domain(extent);
        opacityScale = d3.scaleLinear().range([0.1, 0.9]).domain(extent);
        graphXScale = d3.scaleLinear().range([width * 0.1, width - width * 0.1]).domain([Math.min(0, extent[0]), extent[1]]);

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
        color = this.get_color(Object.keys(this.data[0]).indexOf(column));

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
        graphYScale = d3.scaleLinear().range([height - height * 0.1, height * 0.1]).domain([Math.min(0, extent[0]), extent[1]]);

        this.set_map_state(this.current_state);
    }

    this.remove_axises = function() {
        this.svg.selectAll(".graph-axis").remove();
    }

    this.draw_axises = function() {
        this.remove_axises();
        this.svg.append("g")
            .attr("class", "graph-axis")
            .attr("transform", "translate(0," + (height - height * 0.1) + ")")
            .call(d3.axisBottom(graphXScale));
        this.svg.append("g")
            .attr("class", "graph-axis")
            .attr("transform", "translate(" + (width * 0.1) + ",0)")
            .call(d3.axisLeft(graphYScale));

        this.svg.append("text")
            .attr("class", "graph-axis")
            .attr("y", height - height * 0.05 )
            .attr("x", (width / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(this.column);

        this.svg.append("text")
            .attr("class", "graph-axis")
            .attr("transform", "rotate(-90)")
            .attr("y", width * 0.01)
            .attr("x", 0 - height / 2)
            .style("text-anchor", "middle")
            .text(this.compared_to)
    }

    // Initially set the data for the column
    this.set_data(this.column);
    this.set_compared_to_data(this.compared_to);
}