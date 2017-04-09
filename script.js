function ExtinctionScale(svg, width) {
  this.svg = svg;
  this.width = width;
  this.scales;
  this.scale_highlighter;
  this.scale_color = "#e04f5f";
  this.level = 0;
  this.levels = ["Least Concern", "Near Threatened", "Vulnerable", 
                 "Endangered", "Critically Endangered",
                 "Extinct in the Wild"];

  this.create = function(){
    var _this = this;
    this.scale_highlighter = this.svg
      .append("circle")
      .attr("cx", width / (this.levels.length * 2) - 5)
      .attr("cy", 35 )
      .attr("r", 35 )
      .attr("fill", this.scale_color);

    this.scales = this.svg.selectAll("g")
      .data(this.levels)
      .enter()
      .append("g")
      .attr("data-level", function(d, i){
        return i;
      })
      .attr("transform", function(d, i){
        var height = _this.levels[i].indexOf(" ") > -1 ? 20 : 28;
        return "translate(" + i * _this.width / _this.levels.length + ", " + height + ")";
      })
      
    this.scales.append("foreignObject")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width / _this.levels.length - 10)
      .attr("height", 65)
      .attr("font-size", 12)
      .style("text-align", "center")
      .style("vertical-align", "middle")
      .text(function(d){ return d });

    this.svg.append("path")
      .attr("d", "M 0 10 L 500 10 M 0 60 L 500 60")
      .attr("stroke", this.scale_color);

    this.set_level("Least Concern");
  }

  this.set_level = function(status) {
    var _this = this;
    var width = this.width / this.levels.length;
    var level = this.levels.indexOf(status);
    this.scale_highlighter.transition()
      .duration(1000)
      .attr('cx', level * width + width / 2 - 5);

    this.scales.transition()
      .delay(500)
      .style("color", function(){
        return d3.select(this).attr("data-level") == level ? "white" : "black";
      })
      .style("font-weight", function(){
        return d3.select(this).attr("data-level") == level ? "700" : "400";
      });
  }
}

function SpeciesDetail(data, extinction_scale) {
  this.data = data;
  this.extinction_scale = extinction_scale;

  this.show = function(species_index) {
    var species = this.data[species_index];

    d3.select("#species_image").attr("src", species.image);
    d3.select("#species_description").text(species.description);
    d3.select("#species_population").text(species.population);
    d3.select("#species_habitat").text(species.habitat);
    d3.select("#species_scientific_name").text(species.scientific_name);

    d3.select("#species_detail").transition()
      .duration(1000)
      .style("display", "block")
      .style("opacity", 1);

    extinction_scale.set_level(species.status);
  }

  this.hide = function() {
    d3.select("#species_detail").transition()
      .duration(1000)
      .style("opacity", 0)
      .style("display", "none");
  }
}

function SpeciesList(data, species_detail) {
  this.data = data;
  this.species_detail = species_detail;
  this.showing = true;
  this.width = 500;
  this.item_height = 75;
  this.svg = d3.select('#menu')
    .append('svg')
    .attr('width', '100%')
    .attr('height', this.item_height * data.length);

  this.create = function() {
    var _this = this;
    var svg = this.svg;
    var width = this.width;
    var item_height = this.item_height;
    this.data.forEach(function(d, i) {
      var g = svg.append('g')
        .attr('class', 'select_item')
        .attr('data-id', i)
        .attr('width', width)
        .attr('height', item_height)
        .attr('transform', 'translate(0,' + item_height * i + ')')
        .attr('opacity', 1);
      
      var text = g.append('text')
        .text(d.name)
        .attr('font-size', '1.5em')
        .attr('dominant-baseline', 'middle')
        .attr('x', 125)
        .attr('y', item_height / 2);

      g.append('image')
        .attr('xlink:href', d.icon)
        .attr('x', 25)
        .attr('y', 0)
        .attr('width', item_height)
        .attr('height', item_height)
        .attr('clip-path', 'circle(30px at center)')

      var arrow = g.append("image")
        .attr("xlink:href", "http://www.i2symbol.com/images/symbols/technical/down_arrowhead_u2304_icon_256x256.png")
        .attr("width", 50)
        .attr("height", 50)
        .attr("x", 450)
        .attr("y", 10)
        .attr("display", "none")

      g.on("click", function(){ _this.click(_this, i, g, arrow) });
    });
  }

  this.click = function(_this, i, g,  arrow) {
    _this.showing = _this.showing ? false : true;

    d3.selectAll('.select_item')
    .transition()
    .duration(function(){
      return Math.abs(1 - d3.select(this).attr('data-id')) * 75;
    })
    .attr('transform', function(){
      var new_height = _this.showing ? _this.item_height * d3.select(this).attr('data-id') : 50;
      return 'translate(0,' + new_height + ')';
    })
    .attr('opacity', function(){
      var new_opacity = _this.showing ? 1 : (d3.select(this).attr('data-id') == i ? 1 : 0);
      return new_opacity;
    })
    .delay(function(){
      return Math.abs(1 - d3.select(this).attr('data-id')) * 20
    })
    .attr("display", function(){
      var display = _this.showing ? "block" : (d3.select(this).attr('data-id') == i ? "block" : "none");
      return display;
    });

    if (_this.showing){
      arrow.attr("display", "none");
      _this.species_detail.hide();
    }
    else{
      arrow.attr("display", "block");
      _this.species_detail.show(i)
    };
  }
}