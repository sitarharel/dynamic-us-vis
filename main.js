var map;
d3.queue()
.defer(d3.json, "us.json")
.defer(d3.csv, "countypop.csv")
.await(function(err, us, guns){
    if (err) throw err;
    var data = "CENSUS2010POP";
    var counties = guns.reduce((a, x) => {a[+x.COUNTY + (1000*x.STATE)] = +x[data]; return a}, []);
    var states = guns.reduce((a, x) => {a[+x.STATE] ? a[+x.STATE] += +x[data] : a[+x.STATE] = +x[data]; return a}, [])
    var svg = d3.select("body").append("svg").attr("width", 600).attr("height", 400);
    
    map = bubblemap().svg(svg)
    .topology(us);

    map();

    // map.size((d) => d.r + 5, 10000);
    // mapify(us, {"counties": counties, "states": states});
    // mapify(us, guns.reduce((a, x) => {a[x.FIPS] = +x.Area; return a}, []));
});
