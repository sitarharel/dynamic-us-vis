var map;
d3.queue()
.defer(d3.json, "us.json")
.defer(d3.csv, "countypop.csv")
.await(function(err, us, pop){
    if (err) throw err;
    var data = "CENSUS2010POP";
    var counties = pop.reduce((a, x) => {a[+x.COUNTY + (1000*x.STATE)] = +x[data]; return a}, []);
    var states = pop.reduce((a, x) => {a[+x.STATE] ? a[+x.STATE] += +x[data] : a[+x.STATE] = +x[data]; return a}, [])
    var svg = d3.select("body").append("svg").attr("width", 600).attr("height", 400);
    
    map = bubblemap().svg(svg).topology(us);
    
    map().shape((d) => {d.no_clip = true; return d.state_shape}, 0)

    var tools = d3.select("body").append("div").attr("class", "toolbar");

    tools.append("button").text("layout-ify").on("click", () => {
      map.shape((d) => {return d.state_shape}, 500)
      .location((d, i) => [(d.id%10) * 50 + 50, Math.floor(d.id/10) * 60 + 50])
      .tween([
        {style: "opacity", f: (d) => 0.5}, 
        {attr: "area", f: (d) => {d.no_clip = true; d.bound_scale = true; return 1000}},
        {style: "fill", interpolator: d3.interpolateRgb, f: (d) => "green"}
      ], 500);
    });

    tools.append("button").text("circle-ify").on("click", () => {
      map.shape((d) => d.circle_path, 200)
      .location((d) => d.geo_origin)
      .tween([
        {style: "opacity", f: (d) => 1}, 
        {attr: "area", f: (d) => { d.no_clip = false; d.bound_scale = false; return d.origin_area}},
        {style: "fill", interpolator: d3.interpolateRgb, f: (d) => "royalblue"}
      ], 300)
    });

    tools.append("button").text("state-ify").on("click", () => {
      map.shape((d) => d.state_shape, 1000)
      .location((d) => d.geo_origin)
      .tween({style: "fill", interpolator: d3.interpolateRgb, f: (d) => "purple"}, 1000)
    });

});
