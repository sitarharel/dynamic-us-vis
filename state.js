function State(svg, map, data) {
    this.svg = svg;
    this.map = map;
    this.data = data;

    var state_mapping = {
        "default": {
            "shape": (d) => { return d.state_shape},
            "shape_duration": 500,
            "location": (d) => d.geo_origin,
            "tween": [
                {attr: "area", f: (d) => {d.no_clip = true; d.bound_scale = false; return d.origin_area }}
            ],
            "tween_duration": 1000
        },
        "circle": {
            "shape": (d) => d.circle_path,
            "shape_duration": 200,
            "location": (d) => d.geo_origin,
            "tween": [
                {style: "opacity", f: (d) => 1}, 
                {attr: "area", f: (d) => { d.no_clip = false; d.bound_scale = false; return d.origin_area}},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => "royalblue"}
            ],
            "tween_duration": 300
        },
        "layout": {
            "shape": (d) => d.state_shape,
            "shape_duration": 500,
            "location": (d, i) => [(d.id%10) * 50 + 50, Math.floor(d.id/10) * 60 + 50],
            "tween": [
                {style: "opacity", f: (d) => 0.5}, 
                {attr: "area", f: (d) => {d.no_clip = true; d.bound_scale = true; return 1000}},
                {style: "fill", interpolator: d3.interpolateRgb, f: (d) => "green"}
            ],
            "tween_duration": 500
        }
    }

    var data_mapping = {
        "CENSUS2010POP": {
            "default" : {
                "tween": [
                    {style: "opacity", f: (d) => { return this.get_data(d.id)/10000000;}},
                    {attr: "area", f: (d) => {d.no_clip = true; d.bound_scale = false; return d.origin_area }},
                    {style: "fill", interpolator: d3.interpolateRgb, f: (d) => "green"}
                ],
            },
            "circle" : {
                "tween": [
                    {style: "opacity", f: (d) => 0.8}, 
                    {attr: "area", f: (d) => { d.no_clip = false; d.bound_scale = false; return this.get_data(d.id)/5000}},
                    {style: "fill", interpolator: d3.interpolateRgb, f: (d) => "green"}
                ]
            },
            "layout" : {
                "tween": [
                    {style: "opacity", f: (d) => { return this.get_data(d.id)/10000000;}},
                    {attr: "area", f: (d) => {d.no_clip = true; d.bound_scale = true; return 1000}},
                    {style: "fill", interpolator: d3.interpolateRgb, f: (d) => "green"}
                ]
            }
        },
        "DEATHS2012": {
            "default" : {
                "tween": [
                    {style: "opacity", f: (d) => { return this.get_data(d.id)/200000;}},
                    {attr: "area", f: (d) => {d.no_clip = true; d.bound_scale = false; return d.origin_area }},
                    {style: "fill", interpolator: d3.interpolateRgb, f: (d) => "red"}
                ],
            },
            "circle" : {
                "tween": [
                    {style: "opacity", f: (d) => 0.8}, 
                    {attr: "area", f: (d) => { d.no_clip = false; d.bound_scale = false; return this.get_data(d.id)/75; }},
                    {style: "fill", interpolator: d3.interpolateRgb, f: (d) => "red"}
                ]
            },
            "layout" : {
                "tween": [
                    {style: "opacity", f: (d) => { return this.get_data(d.id)/200000;}},
                    {attr: "area", f: (d) => {d.no_clip = true; d.bound_scale = true; return 1000}},
                    {style: "fill", interpolator: d3.interpolateRgb, f: (d) => "red"}
                ]
            }
        }
    }

    this.column = "CENSUS2010POP";
    this.current_state = "default";
    this.map_options = state_mapping["default"];

    var columnData = {};

    this.set_map_state = function(state_name) {
        // Set the current state
        this.current_state = state_name;

        // Retrieve options of this state_name and overwrite existing values with
        // values from data-specific options, if any
        var stateOptions = state_mapping[state_name] || state_mapping["default"];
        stateOptions = Object.assign(stateOptions, data_mapping[this.column][this.current_state] || {});
        this.map_options = stateOptions;

        // Transform the map based on options given
        this.map.shape(stateOptions.shape, stateOptions.shape_duration)
            .location(stateOptions.location)
            .tween(stateOptions.tween, stateOptions.tween_duration);
    }

    this.get_data = function(state_fips) {
        // Look up data for set column for this state based on its fips code (d.id)
        // TODO: scale
        return columnData[+state_fips];
    }

    this.set_data = function(column) {
        this.column = column;

        // Reset column data and update to reflect the values of the column
        columnData = {};
        this.data.forEach(function(d){
            columnData[+d.STATE] = (columnData[+d.STATE] || 0) + +d[column];
        });

        // Transform map with new data
        this.set_map_state(this.current_state)
    }

    // Initially set the data for the column
    this.set_data(this.column);
}