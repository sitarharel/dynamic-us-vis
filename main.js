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
    
    map = bubblemap().svg(svg)
    .topology(us);

    map();

    var tools = d3.select("body").append("div").attr("class", "toolbar");

    tools.append("button").text("layout-ify").on("click", () => {
     map.shape((d) => { return d.origin_d}, 500);
     map.size((d) => {d.bound_scale = true; return 1000}, 300);
     map.location((d, i) => [(d.id%10) * 50 + 50, Math.floor(d.id/10) * 60 + 50]);
    });

    tools.append("button").text("circle-ify").on("click", () => {
      map.shape((d) => d.d, 200);
      map.size((d) => {d.bound_scale = false; return d.origin_area}, 200);
      map.location((d, i) => [d.geo_origin_x, d.geo_origin_y])
    });

    tools.append("button").text("state-ify").on("click", () => {
      map.shape((d) => d.origin_d, 1000);
      // map.size((d) => {d.bound_scale = false; return d.origin_area}, 200);
      map.location((d, i) => [d.geo_origin_x, d.geo_origin_y])
    });

});
