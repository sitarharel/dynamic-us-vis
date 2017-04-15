var map;
var state;
d3.queue()
.defer(d3.json, "us.json")
.defer(d3.csv, "statedata.csv")
.await(function(err, us, pop){
    if (err) throw err;
    var svg = d3.select("body").append("svg").attr("width", 1200).attr("height", 800);
    
    map = bubblemap().svg(svg).topology(us)();
    
    state = new State(svg, map, pop);

    var tools = d3.select("body").append("div").attr("class", "toolbar");

    tools.append("select")
      .on("change", function(){ state.set_data(d3.select(this).property("value")); })
      .selectAll("option")
      .data(Object.keys(pop[0]).slice(7))
      .enter()
      .append("option")
      .text(function(d){ return d; });

    tools.append("select")
      .on("change", function(){ state.set_compared_to_data(d3.select(this).property("value")); })
      .selectAll("option")
      .data(Object.keys(pop[0]).slice(7))
      .enter()
      .append("option")
      .text(function(d){ return d; });

    tools.append("button").text("STATE").on("click", () => {
      state.set_map_state("default");
    });
    tools.append("button").text("CIRCLE").on("click", () => {
      state.set_map_state("circle");
    });
    tools.append("button").text("LAYOUT").on("click", () => {
      state.set_map_state("layout");
    });
    tools.append("button").text("GRAPH").on("click", () => {
      state.set_map_state("graph");
    });
    tools.append("button").text("GRAPH_CIRCLE").on("click", () => {
      state.set_map_state("graph_circle");
    });
});
