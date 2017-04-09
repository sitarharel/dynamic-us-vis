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
    tools.append("button").text("state-ify").on("click", () => {
     map.shape((d) => { return d.origin_d}, 500);
     map.sort((d, i) => [(i%10) * 100, Math.floor(i/10) * 100]);
    })
    tools.append("button").text("circle-ify").on("click", () => {
        map.shape((d) => { return d.d}, 00);
        map.sort((d, i) => [d.geo_origin_x, d.geo_origin_y])
      })

    // map.size((d) => d.r + 5, 1000);
});
