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
                {style: "opacity", f: (d) => 0.8}, 
                {attr: "area", f: (d) => { d.no_clip = false; d.bound_scale = false; return areaScale(this.get_data(d.id)); }},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color}
            ],
            "tween_duration": 300
        },
        "layout": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d, i) => { return locationScale(this.get_data(d.id)) },
            "tween": [
                {style: "opacity", f: (d) => 1}, 
                {attr: "area", f: (d) => {d.no_clip = false; d.bound_scale = true; return width * 4}},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => color}
            ],
            "tween_duration": 500
        }
    }

    this.column = "CENSUS2010POP";
    this.current_state = "layout";
    this.map_options = state_mapping[this.current_state];

    var columnData = {};

    this.set_map_state = function(state_name, options) {
        // Set the current state
        this.current_state = state_name;

        // Retrieve options of this state_name and overwrite existing values with
        // values from data-specific options, if any
        var stateOptions = state_mapping[state_name] || state_mapping["default"];
        stateOptions = Object.assign(stateOptions, options || {});
        this.map_options = stateOptions;

        // Transform the map based on options given
        this.map.shape(stateOptions.shape, stateOptions.shape_duration)
            .location(stateOptions.location)
            .tween(stateOptions.tween, stateOptions.tween_duration);
    }

    this.get_color = function(n) {
        return colors[n % colors.length];
    }

    this.set_domains = function(extent) {
        areaScale.domain(extent);
        opacityScale.domain(extent);
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

        // Change domains to reflect data changes
        this.set_domains(d3.extent(Object.values(columnData)));

        // Pick a color for this dataset
        color = this.get_color(Object.keys(this.data[0]).indexOf(column));

        // Transform map with new data
        this.set_map_state(this.current_state, options);
    }

    // Initially set the data for the column
    this.set_data(this.column);
}