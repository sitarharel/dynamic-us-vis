
var bubblemap = function(){

  function bm(){
    simulation = d3.forceSimulation()
    .force("collision", d3.forceCollide(d => d.no_clip ? 0 : Math.sqrt(d.area/Math.PI) ))
    .force("x_pos", d3.forceX(d => d.root[0]))
    .force("y_pos", d3.forceY(d => d.root[1]))


    // quick tool for initial hovel label
    // move/change this later when we need to show actual info
    var hovertool = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

    nodedata = gennodes(states);

    node = svg
      .selectAll(".node")
      .data(nodedata);

    node.exit().remove();

    node_vis = node
    .enter().append("path")
    .merge(node)
    .attr("class", "node")
    .attr("d", (s) => s.circle_path)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on("click", (d) => console.log(d))
    .on("mouseover",function(){return hovertool.style("visibility", "visible");})
    .on("mousemove", function(d){return hovertool.style("top",(d3.event.pageY+10)+"px")
      .style("left",(d3.event.pageX+10)+"px").text(d.id);})
    .on("mouseout", function(){return hovertool.style("visibility", "hidden");});

    simulation.nodes(nodedata).on("tick", on_tick);
    simulation.force("x_pos").strength((d) => 0.5);
    simulation.force("y_pos").strength((d) => 0.5);
    simulation.alpha(1).restart();

    // this gets called every tick. used to do force stuff but also for reactive updating
    function on_tick() {
      simulation.force("collision").radius((d) => {return d.no_clip ? 0 : Math.sqrt(d.area/Math.PI)})
      simulation.force("x_pos").x((d) => d.root[0])
      simulation.force("y_pos").y((d) => d.root[1])

      // set the node's location. (node paths should be centered around d.geo_origin_area)
      node_vis.attr("transform", function(d) { 
        var scale = Math.sqrt(d.area/d.geo_origin_area);
        if(d.bound_scale) scale = Math.sqrt(d.area/d.bound_origin_area);
        return "translate(" + d.x + ", " + d.y + ") scale("+ scale +") translate(" + (-d.geo_origin[0]) + ", " + (-d.geo_origin[1]) + ")";
      });

      // Set the node style for every style attribute
      Object.keys(node_vis.datum().style).forEach((key) => {
        node_vis.style(key, d => d.style[key])
      });
    }

    return bm;
  }

  /* sets the map's topology to be topo - should be topojson formatted US states and counties
   * sets the geo projection to be proj (defaults to Albers USA) */
  bm.topology = function(topo, proj){
    if(!topo) return topology;
    topology = topo;
    states = topojson.feature(topology, topology.objects.states)
    counties = topojson.feature(topology, topology.objects.counties)
    // var badstates = [11];
    // states.filter()
    if(proj) projection = proj;
    else projection = d3.geoAlbersUsa();
    pathGenerator = d3.geoPath().projection(projection);
    wPadding = width * 0.1;
    hPadding = height * 0.1;
    projection.fitExtent([[wPadding,hPadding], [width-wPadding, height-hPadding]], states);

    return bm;
  }

  bm.svg = function(s){
    if(!s) return svg;
    svg = s;
    width = +svg.attr("width");
    height = +svg.attr("height");
    return bm;
  }

  /* f is a function that maps data to location 
   * ex: location((d, i) => { return [i * 10, 50]; }) 
   */
  bm.location = function(f, duration){
    nodedata.forEach((d, i) => d.root = f(d, i));
    simulation.alphaTarget(0.5).restart();
    return bm;
  }

  bm.shape = function(f, duration){
    node_vis.transition().duration(duration).attr("d", f);
    return bm;
  }

  bm.tween = function(attrs, duration){
    if(!Array.isArray(attrs)) attrs = [attrs];
    var tween_func = function(d){
      return function(t){
        return attrs.forEach((a) => {
          dataTween(d, a.f, a.style ? a.style : a.attr, a.interpolator, a.style)(t);
        });
      }
    }
    node.enter() // change to node_vis
    .transition().duration(duration)
    .tween("datum", tween_func);
    simulation.alphaTarget(0.5).restart();
    return bm;
  }

  /* this generates a single tweening function for attribute or style attr
   * f is a function that generates the tween's "to" value 
   */
  function dataTween(d, f, attr, interpolator, is_style){
    interpolator = interpolator || d3.interpolateNumber;
    is_style = is_style || false;
      var i = interpolator(is_style ? d.style[attr] : d[attr], f(d));
      return function(t){
        if(is_style) d.style[attr] = i(t);
        else d[attr] = i(t);
      }
  }

  /* generates default node data for states defined by topo */
  function gennodes(topo){
    return topo.features.map((d) => { 
    var bounds = pathGenerator.bounds(d);
    var bound_size = (bounds[1][0]-bounds[0][0]) * (bounds[1][1]-bounds[0][1])
    var center = pathGenerator.centroid(d);

    return {
      circle_path: mergablepath(d, Math.sqrt(pathGenerator.area(d)/Math.PI), center[0], center[1]), // a mergable circle of the path
      area: pathGenerator.area(d), 
      origin_area: pathGenerator.area(d),
      geo_origin_area: pathGenerator.area(d),
      bound_origin_area: bound_size,
      bound_scale: false, // whether to scale state based on bound size or path area
      x: center[0], 
      y: center[1], 
      root: center, // roots are the locations that objects are attracted to
      geo_origin: center, // geo_origin is the offset value to the center of the shape in the path
                          // ex: a square from -5,-5 to 15,15 would have geo_origin = [5, 5]
      id: d.id, // id - usually the FIPS code for each state
      no_clip: false, // whether or not it should collide with others
      no_drag: false, // whether or not user should be able to interact with nodes
      state_shape: pathGenerator(d), // shape of the state
      origin_shape: d, 
      style: {
        fill: "royalblue",
        opacity: 1
      }
    }}).filter(d => d.x && d.id != 11);
  }

  function circlepath(r, x, y){
    x = x || 0;
    y = y || 0;
    var p = d3.path();
    p.arc(x, y, r, 0, Math.PI*2);
    return p.toString();
  }

  function mergablepath(d, r, x, y){
    x = x || 0;
    y = y || 0;
    // var coords = d.geometry.coordinates[0];
    // if(d.geometry.type == "MultiPolygon") {
    //   console.log(d)
    //   coords = d.geometry.coordinates.reduce((a,x) => a.concat(x[0]), []);
    // }
    // var len = coords.length;
    var len = ((pathGenerator(d) || "").match(/L|M/g) || []).length
    var angleoffset = 2 * Math.PI / len;
    var angle = 0;
    var res = "M ";
    for (var i = 0; i < len - 1; i++){
      res = res + " " + (x + r * Math.cos(angle)) + 
      " " + (y + r * Math.sin(angle)) + " L "
      angle += angleoffset;
    }
    res = res +  " " + (x + r * Math.cos(angle)) + 
      " " + (y + r * Math.sin(angle)) + " Z"    // centroid = polygon.centroid(-1 / (6 * area)),
    return res;
  }

  function dragstarted(d) {
    if(d.no_drag) return;
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    if(d.no_drag) return;
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if(d.no_drag) return;
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return bm;
}