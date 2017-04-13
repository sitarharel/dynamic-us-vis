var map;
var state;
d3.queue()
.defer(d3.json, "us.json")
.defer(d3.csv, "countypop.csv")
.await(function(err, us, pop){
    if (err) throw err;
    var data = "CENSUS2010POP";
    var counties = pop.reduce((a, x) => {a[+x.COUNTY + (1000*x.STATE)] = +x[data]; return a}, []);
    var states = pop.reduce((a, x) => {a[+x.STATE] ? a[+x.STATE] += +x[data] : a[+x.STATE] = +x[data]; return a}, [])
    var svg = d3.select("body").append("svg").attr("width", 600).attr("height", 400);
    
    map = bubblemap().svg(svg).topology(us)();
    
    state = new State(svg, map, pop);

    var tools = d3.select("body").append("div").attr("class", "toolbar");

    tools.append("button").text("DATA = CENSUS2010POP").on("click", () => {
      state.set_data("CENSUS2010POP");
    });
    tools.append("button").text("DATA = DEATHS2012").on("click", () => {
      state.set_data("DEATHS2012");
    });
    tools.append("button").text("STATE").on("click", () => {
      state.set_map_state("default");
    });
    tools.append("button").text("CIRCLE").on("click", () => {
      state.set_map_state("circle");
    });
    tools.append("button").text("LAYOUT").on("click", () => {
      state.set_map_state("layout");
    });
});
