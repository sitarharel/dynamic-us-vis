var map;
var state;

var state_button = d3.select("#STATE_button");
var circle_button = d3.select("#CIRCLE_button");
var layout_button = d3.select("#LAYOUT_button");
var graph_button = d3.select("#GRAPH_button");
var info_button = d3.select("#INFO_button");
var graph_circle_button = d3.select("#GRAPH_CIRCLE_button");
var select_x = d3.select("#x_axis");
var select_y = d3.select("#y_axis");
var info_box = document.getElementById('info'); 



d3.queue()
.defer(d3.json, "us.json")
.defer(d3.csv, "statedata.csv")
.defer(d3.csv,"units.csv")
.await(function(err, us, pop, units){
    if (err) throw err;
    var svg = d3.select("#statesmap")
    .attr("viewBox", "0 0 1500 800")
    .attr("width", "92%").attr("height", "auto");

    map = bubblemap().svg(svg, 1000, 800).topology(us)();
    state = new State(svg, map, pop, units, 1000, 800);

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
      .on("change", function(){state.set_compared_to_data(d3.select(this).property("value")); })
      .selectAll("option")
      .data(Object.keys(pop[0]).slice(7))
      .enter()
      .append("option")
      .text(function(d){ return d; })
      .property("selected", function(d){ return d === "STARBUCKS"; });
      disable_axis();

     state_button.on("click", () => {
      state.set_map_state("default");
      disable_axis();
    });
    circle_button.on("click", () => {
      state.set_map_state("circle");
      disable_axis();
    });
    layout_button.on("click", () => {
      state.set_map_state("layout");
      disable_axis();
    });
    graph_button.on("click", () => {
      state.set_map_state("graph");
      enable_axis();
    });
    graph_circle_button.on("click", () => {
      state.set_map_state("graph_circle");
      enable_axis();
    });

    // $("#INFO_button").click(function(){
    //   $(this).toggleClass("active");
    //   $("#info").slideToggle(500);
    // });

    info_button.on("click",maxHeightSlide);

    // map.onClick((d) => state.set_examine_state(d.id));

});

function disable_axis(){
  var htmlStyles = window.getComputedStyle(document.querySelector("html"));
  var dis = htmlStyles.getPropertyValue("--disable-color");
  select_y.attr("disabled",true)
  .style("color",dis)
  .style("border-color",dis);
}

function enable_axis(){
  var htmlStyles = window.getComputedStyle(document.querySelector("html"));
  var en = htmlStyles.getPropertyValue("--text-color");
  // SO APPARENTLY SETTING IT AS FALSE WON'T ACTUALLY MAKE IT FALSE, WEIRD
  select_y.attr("disabled",null)
  .style("color",en)
  .style("border-color",en);
}

function maxHeightSlide() {
    if(info_box.style.maxHeight !== "400px") {
      info_box.style.maxHeight = "400px";
      // info_button.className = "active";
    } else {
      info_box.style.maxHeight = "0px";
    }
} 
