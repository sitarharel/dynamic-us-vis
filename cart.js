function mapify(us, data){
  console.log(data.states);
  data = data.states;
    var svg = d3.select("#test")
    .append("svg")
    .attr("width", 600)
    .attr("height", 400)
    .on("click", setAllSize);

    var width = +svg.attr("width"),
    height = +svg.attr("height");

    var color = function(t) {return d3.interpolateRainbow(t/50)};
    var datascale = d3.scaleLog().domain(d3.extent(data)).range([0,1]);
    // d = datascale;
    var datacolor = function(t){
      return d3.interpolateRgb("blue", "red")(datascale(t));
    } 
    var datasize = function(state){
      return Math.sqrt(d3.scaleLinear().domain(d3.extent(data)).range([2,4000])(data[state]));
    }

    console.log(datacolor(data[48]));
    // console.log(d3.extent(data));
    var color = function(t) {return d3.interpolateRainbow(t/50)};

    var simulation = {};
    simulation.states = d3.forceSimulation()
        .force("x_pos", d3.forceX(d => d.origin_x))
        .force("y_pos", d3.forceY(d => d.origin_y))
        .force("collision", d3.forceCollide(d => d.r))
        .force("charge", d3.forceManyBody())

    var counties = function(state){
      var c = topojson.feature(us,us.objects.counties);
      c.features = c.features.filter((d) => {return Math.floor(d.id/1000) == state});
      return c;
    }

    var states = topojson.feature(us, us.objects.states);

    var projection = d3.geoAlbersUsa();
    var pathGenerator = d3.geoPath().projection(projection);
    projection.fitExtent([[2,2], [width - 2, height - 2]], states);

    // var paths = svg.selectAll("path.state").data(states.features);

    // var shapes = paths.enter().append("g").attr("class", "state")
    // .merge(paths);

    var gennodes = function(topo, size, origin){
      size = size || 2;
      return topo.features.map((d) => { return {
        r: Math.sqrt(pathGenerator.area(d))/size, 
        area: pathGenerator.area(d), 
        origin_area: pathGenerator.area(d), 
        x: origin && origin.x ? origin.x : pathGenerator.centroid(d)[0], 
        y: origin && origin.y ? origin.y : pathGenerator.centroid(d)[1], 
        origin_x: pathGenerator.centroid(d)[0], 
        origin_y: pathGenerator.centroid(d)[1],
        id: d.id,
        parent_id: origin ? origin.id : null,
        shape: pathGenerator(d)
      }}).filter((d) => d.x);
    }

    var dats = gennodes(states)
    // var counts = [];

    function setAllSize(){
      // dats.forEach((d) => tranSize(d, datasize(d.parent_id ? 2 : d.id)))
      dats.forEach((d) => {d.r = datasize(d.parent_id ? 2 : d.id)})
    }

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

  var curr_state = -1;

function reboot(c) {
  var node = svg
    .selectAll(".node")
    .data(dats);
  node.exit().remove();

  var ndata = dats.filter(d => curr_state != d.id).concat(c);
  
  node = svg
    .selectAll(".node")
    .data(ndata);
  node.exit().remove();

  var node_vis = node
    .enter().append("circle")
    .merge(node)
    .attr("class", "node")
    .attr("r", (d) => d.r)
    .style("fill", function(d,i) { return datacolor(d.id); })
    .style("opacity", function(d) { return d.id == curr_state ? 0 : 1; })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on("click", (d) => {
      if(d.id > 100) return;
      curr_state = d.id; 
      // x: d.x, y:d.y,
      reboot(gennodes(counties(curr_state), 2, {id: d.id}))
    }); 

  simulation.states
      .nodes(ndata)
      .on("tick", ticked);

  simulation.states.force("x_pos").strength((d) => d.parent_id ? 1.5 : 0.5);
  simulation.states.force("y_pos").strength((d) => d.parent_id ? 1.5 : 0.5);
  simulation.states.force("charge").strength((d) => d.parent_id ? -7 : 0);


  function ticked() {
      simulation.states.force("collision").radius((d) => {return d.parent_id ? d.r : d.r + 1})

      node_vis
          .style("opacity", function(d) { return d.id == curr_state ? 0 : 1; })
          .attr("r", function(d) { return d.r})
          .attr("cx", function(d) { return d.x})
          .attr("cy", function(d) { return d.y});
    }

    simulation.states.alpha(1).restart();
  }

  reboot([]);

  function dragstarted(d) {
    if (!d3.event.active){
      simulation.states.alphaTarget(0.3).restart();
      // simulation.counties.alphaTarget(0.3).restart();
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
      // simulation.counties.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
  }


}

