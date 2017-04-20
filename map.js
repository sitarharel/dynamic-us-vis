
var bubblemap = function(){

  function bm(){
    simulation = d3.forceSimulation()
    .force("collision", d3.forceCollide(d => d.no_clip ? 0 : Math.sqrt(d.area/Math.PI) ))
    .force("x_pos", d3.forceX(d => d.root[0]))
    .force("y_pos", d3.forceY(d => d.root[1]))


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
    .on("click", (d) => {
      d.sw = 0;
      hovertool.body.style("visibility", "hidden")
      click_handler(d);
    })
    .on("mouseover", function(d){ 
      // console.log(if()d3.event)
      if(!d.no_hover && !d3.event.buttons){
        hovertool.body.remove().exit();
        // hovertool = {width: 200, height: 100, xoffset: 60, yoffset: 120};
        createHT(hovertool);
        hovertool.body.style("visibility", "visible")
        d.sw = 2;
      }
    })
    .on("mousemove", updateHover)
    .on("mouseout", function(d){ 
      d.sw = 0;
      hovertool.body.style("visibility", "hidden")
    });

    textv = svg.selectAll(".node_description").data(nodedata);

    text_vis = textv.enter().append("text")
    .merge(textv)
    .style("text-anchor", "middle")
    .text((d) => d.text)
    .attr("x", d => d.x)
    .attr("y", d => d.y + 200);

    simulation.nodes(nodedata).on("tick", on_tick);
    simulation.force("x_pos").strength((d) => 0.08);
    simulation.force("y_pos").strength((d) => 0.08);
    // simulation.alphaDecay(0.1);
    simulation.velocityDecay(0.4);
    simulation.alpha(1).restart();
    setInterval(on_tick, 750);

    // this gets called every tick. used to do force stuff but also for reactive updating
    function on_tick() {
      simulation.force("collision").radius((d) => {return d.no_clip ? 0 : Math.sqrt(d.area/Math.PI) + 2})
      simulation.force("x_pos").x((d) => d.root[0])
      simulation.force("y_pos").y((d) => d.root[1])

      // set the node's location. (node paths should be centered around d.geo_origin_area)
      node_vis.attr("transform", function(d) { 
        var scale = Math.sqrt(d.area/d.origin_area);
        // if(d.bound_scale) scale = Math.sqrt(d.area/d.origin_area);
        return "translate(" + d.x + ", " + d.y + ") scale("+ scale +") translate(" + (-d.geo_origin[0]) + ", " + (-d.geo_origin[1]) + ")";
      })
    .style("stroke-width", function(d) { 
        // if(d.style.stroke_width >= 2) console.log(d.name);
        // if(d.bound_scale) scale = Math.sqrt(d.area/d.origin_area);
        // if(d.style.stroke_width - d.psw != 0) console.log(d.name + ": " + d.style.stroke_width - d.psw); 
        // d.psw = d.stroke_width;
        // if(d.sw) return d.sw / Math.sqrt(d.area/d.origin_area)
        return (d.style.stroke_width + d.sw) / Math.sqrt(d.area/d.origin_area);
      });

    text_vis
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y + Math.sqrt(d.area/Math.PI) + 23)
    .text((d) => d.text);

      if(click_handler != node_vis.on("click"))
        node_vis.on("click", click_handler)

      // Set the node style for every style attribute
      Object.keys(node_vis.datum().style).forEach((key) => {
        if(key == "stroke_width") return;
        node_vis.style(key.replace(/_/g, '-'), d => d.style[key])
      });

    }

    // The following is code for the hovering tooltip

    function generatesHTPaths(ht){
      ht.xoffset = ht.width/2;
      var arrow_offset = ht.width/2, 
        arrow_w = 8, 
        arrow_h = 10;
        var w = ht.width, h = ht.height, 
          arrow_r_x = (arrow_offset + arrow_w),
          arrow_l_x = (arrow_offset - arrow_w),
          arrow_m_x = (arrow_offset),
          arrow_m_y = (ht.height + arrow_h);
        var rad = 15;
        w1 = w-rad;
        h1 = rad;
        h2 = h-rad;
        ht.bpath = "M"+rad+",0 L" + arrow_l_x + "," + 0 + " " + arrow_m_x + "," + 
            (-arrow_h) + " " + arrow_r_x + ",0 " + 
            w1 + ",0 " +
            "A"+rad+","+rad+" 0 0,1 "+w+","+h1+
            "L"+w+","+h2+
            "A"+rad+","+rad+" 0 0,1 "+w1+","+h+
            "L"+rad+","+h+
            "A"+rad+","+rad+" 0 0,1 "+0+","+h2+
            "L0"+ "," + h1 + 
            "A"+rad+","+rad+" 0 0,1 "+rad+",0"+
            " Z";
        ht.tpath = "M"+rad+",0 L" + w1 + ",0 " + 
        "A"+rad+","+rad+" 0 0,1 "+w+","+h1 +
        "L"+ w + "," + h2 + 
        "A"+rad+","+rad+" 0 0,1 "+w1+","+h+
        "L" + arrow_r_x + "," + h + " " + arrow_m_x + "," + arrow_m_y + " " + arrow_l_x + "," + 
          h + " "+rad+"," + h + 
        "A"+rad+","+rad+" 0 0,1 "+"0,"+h2+
        "L0,"+rad+
        "A"+rad+","+rad+" 0 0,1 "+rad+",0"+
          " Z";
    }

    hovertool = {
      width: 300,
      height: 120,
      xoffset: 150,
      yoffset: 175
    };

    generatesHTPaths(hovertool);
    createHT(hovertool);

    function createHT(hovertool){
      hovertool.body = svg.append("g").attr("class","hovertool")
      .style("fill", "#3b4951")
      .style("visibility", "hidden");
      
      hovertool.frame = hovertool.body.append("path")
      .attr("d", hovertool.tpath)
      .attr("stroke-width",'2px');

      hovertool.title = hovertool.body.append("text").attr("class","httitle")
      .style("text-anchor", "middle")
      .attr("x", hovertool.width / 2)
      .attr("y", 20);

      hovertool.bodytext = hovertool.body.append("text").attr("class","htentry")
      .attr("x", 10)
      .attr("y", 50);

      hovertool.bodytext2 = hovertool.body.append("text").attr("class","htentry")
      .attr("x", 10)
      .attr("y", 70);

      hovertool.bodytext3 = hovertool.body.append("text").attr("class","htentry")
      .attr("x", 10)
      .attr("y", 100);

      hovertool.bodytext4 = hovertool.body.append("text").attr("class","htentry")
      .attr("x", 10)
      .attr("y", 120);
    }

    function mkBox(g, text1, text2, text3, text4, title) {
      var dim1 = text1.node().getBBox();
      var dim2 = text2.node().getBBox();
      var dim3 = text3.node().getBBox();
      var dim4 = text4.node().getBBox();
      g.width = Math.max(dim1.width+20,dim2.width+20,dim3.width+20,dim4.width+20,110);
      g.height = 70+(dim2.height+dim3.height+dim4.height);
      g.yoffset = 86+(dim2.height+dim3.height+dim4.height);
      generatesHTPaths(g);
      title.attr("x",g.width/2);
    }
    
    function updateHover(d){
      var x = d3.mouse(svg.node())[0], y = d3.mouse(svg.node())[1];

      hovertool.bodytext.text(d.tooltip);
      hovertool.bodytext2.text(d.tooltip2);
      hovertool.bodytext3.text(d.tooltip3);
      hovertool.bodytext4.text(d.tooltip4);
      mkBox(hovertool,hovertool.bodytext,hovertool.bodytext2,hovertool.bodytext3,hovertool.bodytext4,hovertool.title);
      hovertool.title.text(d.name);

      if(y < hovertool.yoffset) {
        hovertool.is_bottom = true;
        hovertool.frame.attr("d", hovertool.bpath);
        hovertool.body.attr("transform", "translate(" + (x - hovertool.xoffset)
          + "," + (y + (hovertool.yoffset - hovertool.height)) + ")");
      }else{
        hovertool.is_bottom = false;
        hovertool.frame.attr("d", hovertool.tpath);
        hovertool.body.attr("transform", "translate(" + (x - hovertool.xoffset)
          + "," + (y - hovertool.yoffset) + ")");
      } 
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
    click_handler = (d) => console.log(d);
    // var badstates = [11];
    // states.filter()
    if(proj) projection = proj;
    else projection = d3.geoAlbersUsa();
    pathGenerator = d3.geoPath().projection(projection);
    var vb = svg.attr('viewBox').split(/\s+|,/);
    wPadding = (+vb[2] - width)/2;
    hPadding = (+vb[3] - height)/2;
    projection.fitExtent([[wPadding,hPadding], [width+wPadding, height+hPadding]], states);

    return bm;
  }

  bm.svg = function(s, w, h){
    if(!s) return svg;
    svg = s;
    var vb = svg.attr('viewBox').split(/\s+|,/);
    width = w ? w : +vb[2];
    height = h ? h : +vb[3];
    return bm;
  }

  /* f is a function that maps data to location 
   * ex: location((d, i) => { return [i * 10, 50]; }) 
   */
  bm.location = function(f, duration){
    nodedata.forEach((d, i) => d.root = f(d, i));
    simulation.alphaTarget(1).restart();
    return bm;
  }

    /* f is a function that takes in node data and mutates it. */
  bm.forEach = function(f){
    if(!f) return;
    nodedata.forEach(f);
    // simulation.alphaTarget(0.1).restart();
    return bm;
  }

  bm.onClick = function(f){
    if(!f) return click_handler;
    click_handler = f;
    return bm;
  }

  bm.shape = function(f, duration){
    node_vis.transition().duration(duration).attr("d", f);
    simulation.alphaTarget(1).restart();
    return bm;
  }

  bm.tween = function(attrs, duration){
    simulation.alphaTarget(1).restart();
    if(!Array.isArray(attrs)) attrs = [attrs];
    var tween_func = function(d){
      return function(t){
        return attrs.forEach((a) => {
          dataTween(d, a.f, a.style ? a.style.replace(/-/g, '_') : a.attr, a.interpolator, a.style)(t);
        });
      }
    }
    node.enter() // change to node_vis
    .transition().duration(duration)
    .tween("datum", tween_func);

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
      tooltip: "This is a tooltip",
      name: "",
      text: "",
      root: center, // roots are the locations that objects are attracted to
      geo_origin: center, // geo_origin is the offset value to the center of the shape in the path
                          // ex: a square from -5,-5 to 15,15 would have geo_origin = [5, 5]
      id: d.id, // id - usually the FIPS code for each state
      no_clip: false, // whether or not it should collide with others
      no_drag: false, // whether or not user should be able to interact with nodes
      state_shape: pathGenerator(d), // shape of the state
      origin_shape: d,
      no_hover: false,
      psw: 0,
      sw: 0,
      style: {
        fill: "none",
        stroke: "white",
        stroke_width: 0,
        fill_opacity: 1
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

  /* This generates a path for a circle that is actually a set of lines with the
   * property that it has the same number of arcs as topology [topo]. This
   * enables simple path interpolation between the two. */
  function mergablepath(topo, r, x, y){
    x = x || 0;
    y = y || 0;

    var len = ((pathGenerator(topo) || "").match(/L|M/g) || []).length
    // if(topo.id == 2) console.log(topo.id + ": " + len);
    var angleoffset = 2 * Math.PI / len;
    var angle = 0;
    var res = "M";
    for (var i = 0; i < len - 1; i++){
      res = res + "" + (x + r * Math.cos(angle)).toFixed(4) + 
      "," + (y + r * Math.sin(angle)).toFixed(4) + "L"
      angle += angleoffset;
    }
    res = res +  "" + (x + r * Math.cos(angle)).toFixed(4) + 
      "," + (y + r * Math.sin(angle)).toFixed(4) + "Z"  
    return res;
  }

  function dragstarted(d) {
    if(d.no_drag) return;
    hovertool.body.style("visibility", "hidden");
    if (!d3.event.active) simulation.alphaTarget(1).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    if(d.no_drag) return;
    hovertool.body.style("visibility", "hidden");
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