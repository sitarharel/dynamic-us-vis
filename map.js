
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

      node = svg
        .selectAll(".node")
        .data(nodedata);

      node.exit().remove();

      node_vis = node
        .enter().append("path")
        .merge(node)
        .attr("class", "node")
        .attr("d", (s) => s.d)
        // .style("fill", "none")
        .style("fill", function(d,i) { return d.fill})
        // .style("stroke", "black")
        .style("fill-rule", "nonzero")
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
        .on("click", (d) => {
          if(d.id > 100) return;
          var curr_state = d.id; 
          console.log(d);
          // reboot(gennodes(counties(curr_state), 2, {id: d.id}))
        }); 

      simulation
          .nodes(nodedata)
          .on("tick", ticked);

      simulation.force("x_pos").strength((d) => d.parent_id ? 1.5 : 0.5);
      simulation.force("y_pos").strength((d) => d.parent_id ? 1.5 : 0.5);
      simulation.force("charge").strength((d) => d.parent_id ? -7 : 0);

      function ticked() {
        simulation.force("collision").radius((d) => {return d.no_clip ? 0 : Math.sqrt(d.area/Math.PI)})
        simulation.force("x_pos").x((d) => d.root_x)
        simulation.force("y_pos").y((d) => d.root_y)

        node_vis
        .attr("transform", function(d) { 
          var scale = Math.sqrt(d.area/d.geo_origin_area);
          if(d.bound_scale) scale = Math.sqrt(d.area/d.bound_origin_area);
          return "translate(" + d.x + ", " + d.y + ") scale("+ scale +") translate(" + (-d.geo_origin_x) + ", " + (-d.geo_origin_y) + ")";
        })

        // .attr("d", (d) => d.d);
        // node_vis
        //     // .style("opacity", function(d) { return d.id == curr_state ? 0 : 1; })
        //     .attr("r", (d) => d.r)
        //     .style("fill", (d) => d.fill)
        //     .attr("cx", (d) => d.x)
        //     .attr("cy", (d) => d.y);
// 
            // debugs.attr("r", (d) => 5)
            // .attr("cx", (d) => d.x)
            // .attr("cy", (d) => d.y);
           
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
    // var badstates = [11];
    // states.filter()
    if(proj) projection = proj;
    else projection = d3.geoAlbersUsa();
    pathGenerator = d3.geoPath().projection(projection);
    projection.fitExtent([[0,0], [width, height]], states);

    centerStatePath = function(state_d){
      var trans = projection.translate();
      var center = pathGenerator.centroid(state_d).map(d => -d);
      center[0] += width/2;
      center[1] += height/2;
      var res = d3.geoPath().projection(projection.translate(center))(state_d);
      // console.log(geoPath)

    // svg.append("rect")
    // .attr("x", bounds[0][0])
    // .attr("y", bounds[0][1])
    // .attr("width", (bounds[1][0]-bounds[0][0]))
    // .attr("height", (bounds[1][1]-bounds[0][1]))
    // .style("fill", "none")
    // .style("stroke", "black");
    // svg.append("circle")
    // .attr("cx", center[0])
    // .attr("cy", center[1])
    // .attr("r", 5)
    // .style("fill", "yellow")
    // .style("stroke", "black");

      projection.translate(trans);
      return res;
    }

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
   * ex: location((d, i) => { return [i * 10, 50]; }) 
   */
  bm.location = function(f, duration){
    nodedata.forEach((d, i) => {
      var upd = f(d, i);
      d.root_x = upd[0];
      d.root_y = upd[1];
    });
    simulation.alphaTarget(0.5).restart();

    return bm;
  }

  bm.size = function(f, duration){
    bm.tween(f, "area", duration, d3.interpolateNumber);
    return bm;
  }

  bm.shape = function(f, duration){
    node_vis
    .transition().duration(duration)
    .attr("d", f);

    return bm;
  }

  bm.tween = function(f, attr, duration, interpolator){
    node.enter() // change to node_vis
    .transition().duration(duration)
    .tween("datum", dataTween(f, attr, interpolator));
    // console.log("tweening " + attr);
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
    // var npath = centerStatePath(d);
    var center = pathGenerator.centroid(d);
    // console.log(npath);
    var bounds = pathGenerator.bounds(d);
    // var center = [(bounds[1][0]+bounds[0][0])/2, (bounds[1][1]+bounds[0][1])/2]
    var bound_size = (bounds[1][0]-bounds[0][0]) * (bounds[1][1]-bounds[0][1])

    return {
      d: mergablepath(d, Math.sqrt(pathGenerator.area(d)/Math.PI), center[0], center[1]),
      r: Math.sqrt(pathGenerator.area(d)/Math.PI), 
      area: pathGenerator.area(d), 
      origin_area: pathGenerator.area(d),
      geo_origin_area: pathGenerator.area(d),
      bound_origin_area: bound_size,
      bound_scale: false,
      x: center[0], 
      y: center[1], 
      root_x: center[0], 
      root_y: center[1],
      geo_origin_x: center[0], 
      geo_origin_y: center[1],
      id: d.id,
      is_circle: true,
      no_clip: false,
      fill: "royalblue",
      parent_id: parent ? parent.id : null,
      origin_d: pathGenerator(d),
      origin_shape: d
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
    // var angle = -Math.PI * 3 / 4;
    var angle = 0;
    var res = "M ";
    for (var i = 0; i < len - 1; i++){
      res = res + " " + (x + r * Math.cos(angle)) + 
      " " + (y + r * Math.sin(angle)) + " L "
      angle += angleoffset;
    }
    res = res +  " " + (x + r * Math.cos(angle)) + 
      " " + (y + r * Math.sin(angle)) + " Z"    // centroid = polygon.centroid(-1 / (6 * area)),
    // console.log(res);
    return res;
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