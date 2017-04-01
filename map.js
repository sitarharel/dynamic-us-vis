
var bubblemap = function(){

  function bm(){
    simulation = d3.forceSimulation()
        .force("x_pos", d3.forceX(d => d.root_x))
        .force("y_pos", d3.forceY(d => d.root_y))
        .force("collision", d3.forceCollide(d => d.r))
        .force("charge", d3.forceManyBody())

    nodedata = gennodes(states);

    function reboot(c) {
      node = svg
        .selectAll(".node")
        .data(nodedata);
      
      node.exit().remove();

      // var ndata = nodedata.filter(d => curr_state != d.id).concat(c);
      
      node = svg
        .selectAll(".node")
        .data(nodedata);

      node.exit().remove();

      var node_vis = node
        .enter().append("path")
        .merge(node)
        .attr("class", "node")
        .attr("d", (s) => circlepath(s.r))
        .style("fill", function(d,i) { return d.fill})
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
        .on("click", (d) => {
          if(d.id > 100) return;
          var curr_state = d.id; 
          console.log(curr_state);
          // reboot(gennodes(counties(curr_state), 2, {id: d.id}))
        }); 

      simulation
          .nodes(nodedata)
          .on("tick", ticked);

      simulation.force("x_pos").strength((d) => d.parent_id ? 1.5 : 0.5);
      simulation.force("y_pos").strength((d) => d.parent_id ? 1.5 : 0.5);
      simulation.force("charge").strength((d) => d.parent_id ? -7 : 0);

      function ticked() {
        simulation.force("collision").radius((d) => {return d.parent_id ? d.r : d.r + 1})
        simulation.force("x_pos").x((d) => d.root_x)
        simulation.force("y_pos").y((d) => d.root_y)

        node_vis
        .attr("transform", function(d) { 
          return "translate(" + (d.x) + "," + (d.y) + ")"
        })
        // .attr("d", (d) => d.d);
        // node_vis
        //     // .style("opacity", function(d) { return d.id == curr_state ? 0 : 1; })
        //     .attr("r", (d) => d.r)
        //     .style("fill", (d) => d.fill)
        //     .attr("cx", (d) => d.x)
        //     .attr("cy", (d) => d.y);
      }

      simulation.alpha(1).restart();
    }
    reboot([]);

    return bm;
  }

  /* sets the map's topology to be topo - should be topojson formatted US states and counties
   * sets the geo projection to be proj (defaults to Albers USA) */
  bm.topology = function(topo, proj){
    if(!topo) return topology;
    topology = topo;
    states = topojson.feature(topology, topology.objects.states)
    counties = topojson.feature(topology, topology.objects.counties)

    if(proj) projection = proj;
    else projection = d3.geoAlbersUsa();
    pathGenerator = d3.geoPath().projection(projection);
    projection.fitExtent([[0,0], [width, height]], states);

    return bm;
  }

  bm.svg = function(s){
    if(!s) return svg;
    svg = s;
    width = +svg.attr("width");
    height = +svg.attr("height");
    return bm;
  }

  /* inputted data should look like this: 
   * {
   *   "states": [array mapping FIPS to data], 
   *   "counties" [array mapping county FIPS to data]
   * }
   */
  bm.data = function(d){
    if(!d) return data;
    data = d;
    return bm;  
  }

  /* f is a function that maps data to location 
   * ex: sort((d, i) => { return {x: i * 10, y: 50}; }) 
   */
  bm.sort = function(f, duration){
      // console.log(node);
    nodedata.forEach((d, i) => {
      var upd = f(d, i);
      d.root_x = upd.x;
      d.root_y = upd.y;
      // if(upd.shape) transize()
    });
    simulation.alphaTarget(0.5).restart();

    return bm;
  }

  bm.size = function(f, duration){
    return bm.tween(f, "r", duration, d3.interpolateNumber);
  }

  bm.shape = function(f, duration){
    node.enter()
    .transition().duration(duration)
    .tween("d", f);

    return bm;
  }

  bm.tween = function(f, attr, duration, interpolator){
    node.enter()
    .transition().duration(duration)
    .tween("datum", dataTween(f, attr, interpolator));
    
    simulation.alphaTarget(0.5).restart();
    return bm;
  }

  /* f is a function that generates the tween's "to" value */
  function dataTween(f, attr, interpolator){
    interpolator = interpolator || d3.interpolateNumber;
    return function(d){
      var i = interpolator(d[attr], f(d));
      return function(t){
        d[attr] = i(t);
        // console.log(d[attr])
        return d[attr];
      }
    }
  }

  function gennodes(topo, inv_size, parent){
    inv_size = inv_size || 2;

    return topo.features.map((d) => { 
    var center = pathGenerator.centroid(d);
    return {
      d: circlepath(Math.sqrt(pathGenerator.area(d))/inv_size),
      r: Math.sqrt(pathGenerator.area(d))/inv_size, 
      area: pathGenerator.area(d), 
      origin_area: pathGenerator.area(d), 
      x: parent && parent.x ? parent.x : center[0], 
      y: parent && parent.y ? parent.y : center[1], 
      root_x: center[0], 
      root_y: center[1],
      geo_origin_x: center[0], 
      geo_origin_y: center[1],
      id: d.id,
      fill: "steelblue",
      parent_id: parent ? parent.id : null,
      origin_shape: pathGenerator(d)
    }}).filter(d => d.x);
  }

  function circlepath(r, x, y){
    x = x || 0;
    y = y || 0;
    var p = d3.path();
    p.arc(x, y, r, 0, Math.PI*2);
    return p.toString();
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return bm;
}