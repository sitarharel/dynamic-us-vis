
d3.queue()
.defer(d3.json, "us.json")
// .defer(d3.csv, "gunownership.txt")
.await(function(err, us){
    if (err) throw err;
    var svg = d3.select("#test")
    .append("svg")
    .attr("width", 600)
    .attr("height", 400);

    var width = +svg.attr("width"),
    height = +svg.attr("height");

    var color = function(t) {return d3.interpolateRainbow(t/50)};

    // d3.scaleQuantize()
    //     .domain([1,50])
    //     .range(Array.apply(null, Array(50)).map((_,i) => "hsl(100, 60%, " + (80 - i)+ "%)"));

    var simulation = {};
    simulation.states = d3.forceSimulation()
        .force("x_pos", d3.forceX(d => d.origin_x))
        .force("y_pos", d3.forceY(d => d.origin_y))
        .force("collision", d3.forceCollide(d => d.r))
        // .force("charge", d3.forceManyBody().strength(10))


    var counties = function(state){
      var c = topojson.feature(us,us.objects.counties);
      c.features = c.features.filter((d) => {return Math.floor(d.id/1000) == state});
      return c;
    }
    // console.log(counties(47))

    var cstate = 1;
    var states = topojson.feature(us, us.objects.states);
    // states.features = states.features.concat(counties(cstate).features).filter((d) => d.id != cstate)
    // var states = counties(47);
    var projection = d3.geoAlbersUsa();
    var pathGenerator = d3.geoPath().projection(projection);
    projection.fitExtent([[2,2], [width - 2, height - 2]], states);

    var paths = svg.selectAll("path.state").data(states.features);

    var shapes = paths.enter().append("g").attr("class", "state")
    .merge(paths);

    // shapes.append("path")
    // .attr("id", (state) => state.id)
    // .attr("d", (state) => pathGenerator(state))
    // .style("stroke", "white")
    // .style("stroke-width", 0.3)
    // .style("fill", (state) => "green")
    // .style("opacity", "0.15");

    var gennodes = function(topo, size, origin){
      size = size || 2;
      return topo.features.map((d) => { return {
        r: Math.sqrt(pathGenerator.area(d))/size, 
        area: pathGenerator.area(d), 
        origin_area: pathGenerator.area(d), 
        x: origin ? origin.x : pathGenerator.centroid(d)[0], 
        y: origin ? origin.y : pathGenerator.centroid(d)[1], 
        origin_x: pathGenerator.centroid(d)[0], 
        origin_y: pathGenerator.centroid(d)[1],
        id: d.id,
        shape: pathGenerator(d)
      }}).filter((d) => d.x);
    }

    var dats = gennodes(states)
    var counts = [];
  //   var links = dats.map((d, i) => {
  //     return {
  //       id: i,
  //       root: {
  //         x: +d.x, 
  //         y: +d.y
  //       },
  //       target: d
  //     }
  // });

    // var node = svg.append("g")
    // .attr("class", "nodes")
    // .data(data)


    function tranSize(node, to, dur, attrib){
      dur = dur || 1000;
      attrib = attrib || "r";
      d3.transition().duration(dur)
      .tween("datum", function(){
        var i = d3.interpolateNumber(node[attrib], to);
        return function(t) {
          node[attrib] = i(t);
        };
      });
    }



    //  var node = svg.append("g")
    // .attr("class", "nodes")
    // .selectAll("path")
    // .data(dats)
    // .enter().append("path")
    // .attr("r", (d) => d.r)
    // .attr("d", (d) => d.shape)
    // .attr("fill", function(d,i) { 
    //   return "royalblue";
    //   // return color(i/2);
    // })
    // .call(d3.drag()
    //   .on("start", dragstarted)
    //   .on("drag", dragged)
    //   .on("end", dragended))
    // .on("click", (d) => tranSize(d, 25, 500, "r"));

  // node.append("title")
  //     .text(function(d) { return d.id; });

var curr_state = -1;

  var node = svg
    .selectAll("circle#node")
    .data(dats);

  var node_vis = node
    .enter().append("circle")
    // .merge(node)
    .attr("r", (d) => d.r)
    .style("fill", function(d,i) { return color(d.id); })
    .style("opacity", function(d) { return d.id == curr_state ? 0 : 1; })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on("click", (d) => {
      curr_state = d.id; 
      reboot(gennodes(counties(curr_state), 2, {x: d.x, y: d.y}))
    }); 
  
  node.exit().remove();

  var county = svg
    .selectAll(".county");
  var county_vis;
function reboot(c) {
  // svg.selectAll("#county").remove();
  counts = c;
  // console.log(c)
  county = svg.selectAll(".county").data(c);

  county.exit().remove();
  
  county_vis = county.enter()
    .append("circle")
    .attr("class", "county")
    .merge(county)
    .attr("r", (d) => d.r)
    .style("fill", function(d,i) { return color(curr_state); })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on("click", (d) => tranSize(d, Math.random()*50)); 

  function tocked() {
    simulation.counties.force("collision").radius((d) => d.r + 0.3);
    county_vis
        .attr("r", (d) => d.r)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);
   }

  simulation.counties = d3.forceSimulation().nodes(counts)
      .force("x_pos", d3.forceX(d => d.origin_x))
      .force("y_pos", d3.forceY(d => d.origin_y))
      .force("collision", d3.forceCollide(d => d.r))
      .on("tick", tocked);

  simulation.counties.force("x_pos").strength(0.5);
  simulation.counties.force("y_pos").strength(0.5);

  simulation.counties.alpha(1).restart();
}


  simulation.states
      .nodes(dats)
      .on("tick", ticked);

  simulation.states.force("x_pos").strength(0.5);
  simulation.states.force("y_pos").strength(0.5);


function ticked() {
    simulation.states.force("collision").radius((d) => d.r + 1)

    node_vis
    .style("opacity", function(d) { return d.id == curr_state ? 0 : 1; })
        .attr("r", function(d) { return d.r})
        .attr("cx", function(d) { return d.x})
        .attr("cy", function(d) { return d.y});
   
    // node.attr("transform", function(d) { return "translate(" + (d.x - d.origin_x) + "," + (d.y - d.origin_y) + ")"});
   
   //  node.attr("transform-origin", (d) => "" + (d.origin_x) + " " + (d.origin_y));
   //  node.attr("transform", function(d) { 
   //    // d.area = d.r **2;
   //    d.r = Math.sqrt(d.r)/2 + 2;
   //    var factor = d.area/d.origin_area; 
   //    // factor = 2;
   //    // console.log(factor);
   //    return "translate(" + (d.x - d.origin_x)*(1 - factor) + "," + (d.y - d.origin_y)*(1 - factor) + ") scale(" + factor + ")";
   //   // return "scale(" + factor + ")"
   // });
  }


reboot([]);

function dragstarted(d) {
  if (!d3.event.active){
    simulation.states.alphaTarget(0.3).restart();
    simulation.counties.alphaTarget(0.3).restart();
  } 
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active){
    simulation.states.alphaTarget(0);
    simulation.counties.alphaTarget(0);
  }
  d.fx = null;
  d.fy = null;
}


});

