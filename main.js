var data = undefined;
var margin = {top: 20, right: 20, bottom: 30, left: 40};

function legend(element, keys, z) {
    var legendRectSize = 15;
    var svg = d3.select('#'+element).append('svg')
        .attr('width', 400)
        .attr('height', 30);

    var legend = svg.selectAll('.legend')
        .data(keys)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function (d, i) {
            var horz = 0 + i * 110 + 10;
            var vert = 0;
            return 'translate(' + horz + ',' + vert + ')';
        });

    legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', function (d) {
            return z(d)
        })
        .style('stroke', function (d) {
            return z(d)
        });

    legend.append('text')
        .attr('x', legendRectSize + 5)
        .attr('y', 15)
        .text(function (d) {
            return d;
        });
}

function treemap(element) {

    $("#treemap_" + element).html("");
    $("#legend_" + element).html("");
    var svg = d3.select("#treemap_" + element).append("svg").attr("width", 600).attr("height", 300);
    var width = +svg.attr("width") - margin.left - margin.right;
    var height = +svg.attr("height") - margin.top - margin.bottom;
    var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    if (data === undefined) {
        return;
    }

    var color = d3.scaleOrdinal()
        .range(["#e74c3c","#85c1e9","#7d3c98","#a04000"]);

    var nested_data = d3.nest()
        .key(function (d) {
            return d.status;
        })
        .key(function (d) {
            return d.who;
        })
        .rollup(function (d) {
            return d.length;
        })
        .entries(data);

    console.log("TREEMAP DATA");
    console.log(nested_data);

    keys = nested_data.map(function (d) {
        return d.key;
    });

    color.domain(keys);
    legend("legend_" + element, keys, color);

    var treemap = d3.treemap()
        .size([width, height])
        .padding(1)
        .round(true);

    var root = d3.hierarchy({values: nested_data}, function (d) {
        return d.values;
    })
        .sum(function (d) {
            return d.value;
        })
        .sort(function (a, b) {
            return b.value - a.value;
        });

    treemap(root);

    var nodes = g.selectAll(".tm")
        .data(root.leaves())
        .enter().append("g")
        .attr('transform', function (d) {
            return 'translate(' + [d.x0, d.y0] + ')'
        })
        .attr("class", "tm");

    nodes.append("rect")
        .attr("width", function (d) {
            return d.x1 - d.x0;
        })
        .attr("height", function (d) {
            return d.y1 - d.y0;
        })
        .attr("fill", function (d) {
            return color(d.parent.data.key);
        });

    nodes.append("text")
        .attr("class", "tm_text")
        .attr('dx', 4)
        .attr('dy', 14)
        .text(function (d) {
            return d.data.key + " " + d.data.value;
        });

}

function bar_chart(element, property) {
    $("#" + element).html("");
    var svg = d3.select("#" + element).append("svg").attr("width", 300).attr("height", 300);
    var width = +svg.attr("width") - margin.left - margin.right;
    var height = +svg.attr("height") - margin.top - margin.bottom;
    var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var nested_data = d3.nest()
        .key(function (d) {
            return d[property];
        })
        .rollup(function (d) {
            return {
                size: d.length, total_time: d3.sum(d, function (d) {
                    return d.time;
                })
            };
        })
        .entries(data);

    nested_data = nested_data.sort(function (a, b) {
        return d3.ascending(a.key, b.key)
    });


    console.log("BARCHART DATA");
    console.log(nested_data);

    var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var z = d3.scaleOrdinal()
        .range(["#e74c3c","#85c1e9","#7d3c98","#a04000"]);

    if (property === "time") {
        x.domain([0, d3.max(nested_data.map(function (d) {
            return +d.key;
        })) + 1]);
    } else {
        x.domain(nested_data.map(function (d) {
            return d.key;
        }));

    }

    y.domain([0, d3.max(nested_data, function (d) {
        return d.value.size;
    })]);
    z.domain(nested_data.map(function (d) {
        return d.key;
    }));

    g.selectAll(".bar")
        .data(nested_data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            return x(d.key)
        })
        .attr("y", function (d) {
            return y(d.value.size)
        })
        .attr("height", function (d) {
            return height - y(d.value.size);
        })
        .attr("width", function (d) {
            return x.bandwidth();
        })
        .style("fill", function (d) {
            return z(d.key)
        });

    g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"))
}

$(function () {
    console.log("READY");

    var URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfeT9lPtJ5ia2XsopWVdvl98Oy7Bu6xL9SVQBEh32OXC8Qk4MKYxr2TcGSSTkAs7kAMfjF83IEGhQ-";
    URL += "/pub?single=true&output=csv";


    d3.csv(URL, function (d) {
        data = d;
        data.forEach(function (d) {
            d.time = +d.time;
        });
        bar_chart("bcs", "status");
        bar_chart("bcw", "who");
        treemap("status");

    });

});