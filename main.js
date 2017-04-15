var map;
var state;

var state_button = d3.select("#STATE_button");
var circle_button = d3.select("#CIRCLE_button");
var layout_button = d3.select("#LAYOUT_button");
var graph_button = d3.select("#GRAPH_button");
var graph_circle_button = d3.select("#GRAPH_CIRCLE_button");
var select_x = d3.select("#x_axis");
var select_y = d3.select("#y_axis");


d3.queue()
.defer(d3.json, "us.json")
.defer(d3.csv, "statedata.csv")
.await(function(err, us, pop){
    if (err) throw err;
    var svg = d3.select("#statesmap").attr("width", 1500).attr("height", 800);
    

    map = bubblemap().svg(svg, 1000, 800).topology(us)();

    state = new State(svg, map, pop, 1000, 800);


    document.documentElement.style.setProperty('--main-color',state.get_color(
          Object.keys(state.data[0]).indexOf(state.column)));


    var tools = d3.select("body").append("div").attr("class", "toolbar");

    select_x
      .on("change", function(){ 
        state.set_data(d3.select(this).property("value")); 
       document.documentElement.style.setProperty('--main-color',state.get_color(
          Object.keys(state.data[0]).indexOf(state.column)));
     })
      .selectAll("option")
      .data(Object.keys(pop[0]).slice(7))
      .enter()
      .append("option")
      .text(function(d){ return d; });

    select_y
      .on("change", function(){ state.set_compared_to_data(d3.select(this).property("value")); })
      .selectAll("option")
      .data(Object.keys(pop[0]).slice(7))
      .enter()
      .append("option")
      .text(function(d){ return d; });

     state_button.on("click", () => {
      state.set_map_state("default");
    });
    circle_button.on("click", () => {
      state.set_map_state("circle");
    });
    layout_button.on("click", () => {
      state.set_map_state("layout");
    });
    graph_button.on("click", () => {
      state.set_map_state("graph");
    });
    graph_circle_button.on("click", () => {
      state.set_map_state("graph_circle");
    });
    map.onClick((d) => state.set_examine_state(d.id));

});
