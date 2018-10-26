var data = undefined;       //we're sure the data is undefined at the beginning
var margin = {top: 20, right: 20, bottom: 30, left: 40};        //define the margin of barchart

//function for drawing the legend on graph
function legend(element, keys, z) {
    var legendRectSize = 15;    //size of the rectangle
    var svg = d3.select('#'+element).append('svg')      //create the svg element in the correct div
        .attr('width', 400)     //width of the svg
        .attr('height', 30);    //height of the svg

    var legend = svg.selectAll('.legend')       //select the svg
        .data(keys)     //set the data array
        .enter()        //creates placeholders for our group elements
        .append('g')    //append element to "g"
        .attr('class', 'legend')    //add the class "legend"
        .attr('transform', function (d, i) {        //add a transform
            var horz = 0 + i * 110 + 10;
            var vert = 0;
            return 'translate(' + horz + ',' + vert + ')';
        });

    legend.append('rect')       //add a new rectangle
        .attr('width', legendRectSize)      //set the width
        .attr('height', legendRectSize)     //set the height
        .style('fill', function (d) {       //fill with color
            return z(d)
        })
        .style('stroke', function (d) {     //set the color of the stroke
            return z(d)
        });


    legend.append('text')       //add text to the legend
        .attr('x', legendRectSize + 5)  //set the x position of text
        .attr('y', 15)                  //set the y position of text
        .text(function (d) {            //set the text
            return d;
        });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//create a TreeMap chart
function treemap(element, primary, secondary) {     //element is which element of the data we need, primary are the color and secondary the data shown up


    $("#treemap_" + element).html("");  //select the good div in index.html, and clean it
    $("#legend_" + element).html("");
    var svg = d3.select("#treemap_" + element).append("svg").attr("width", 1000).attr("height", 500);       //set the svg
    var width = +svg.attr("width") - margin.left - margin.right;        //add the margin
    var height = +svg.attr("height") - margin.top - margin.bottom;
    var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");     //add the transform attribut

    if (data === undefined) {       //do nothing if data is undefined
        return;
    }

    var color = d3.scaleOrdinal()           //set the color pattern of the chart
        .range(["#e74c3c","#85c1e9","#7d3c98","#a04000"]);

    var nested_data = d3.nest()     //group data (work like "GROUP BY" on SQL)
        .key(function (d) {     //first key
            return d[primary];
        })
        .key(function (d) {     //second key

            return d[secondary];
        })
        .rollup(function (d) {      //rollup group and count the following element
            return d.length;
        })
        .entries(data);     //return the data

    console.log("TREEMAP DATA");
    console.log(nested_data);

    keys = nested_data.map(function (d) {       //organize the data
        return d.key;
    });

    color.domain(keys);     //apply color
    legend("legend_" + element, keys, color);       //create the legend on the chart (color with element)

    var treemap = d3.treemap()      //create the empty TreeMap
        .size([width, height])
        .padding(1)
        .round(true);

    var root = d3.hierarchy({values: nested_data}, function (d) {       //sort the element for the TreeMap
        return d.values;
    })
        .sum(function (d) {
            return d.value;
        })
        .sort(function (a, b) {
            return b.value - a.value;
        });

    treemap(root);      //fill data for the TreeMap

    var nodes = g.selectAll(".tm")      //place legend for different element
        .data(root.leaves())
        .enter().append("g")
        .attr('transform', function (d) {
            return 'translate(' + [d.x0, d.y0] + ')'
        })
        .attr("class", "tm");

    nodes.append("rect")            //add the rectangle
        .attr("width", function (d) {       //set the width
            return d.x1 - d.x0;
        })
        .attr("height", function (d) {      //set the height
            return d.y1 - d.y0;
        })
        .attr("fill", function (d) {        //fill with color
            return color(d.parent.data.key);
        });

    nodes.append("text")        //add the text
        .attr("class", "tm_text")
        .attr('dx', 4)
        .attr('dy', 14)
        .text(function (d) {
            return d.data.key + " " + d.data.value;
        });

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//create a Bar chart
function bar_chart(element, property) {
    $("#" + element).html("");      //select the good div in index.html, and empty it
    var svg = d3.select("#" + element).append("svg").attr("width", 400).attr("height", 400);        //set the svg
    var width = +svg.attr("width") - margin.left - margin.right;        //add the margin
    var height = +svg.attr("height") - margin.top - margin.bottom;
    var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");     //add the transform attribut

    var nested_data = d3.nest()     //group data (work like "GROUP BY" on SQL)
        .key(function (d) {     //first key
            return d[property];
        })
        .rollup(function (d) {      //rollup group and count the following element
            return {
                size: d.length, total_time: d3.sum(d, function (d) {
                    return d.time;
                })
            };
        })
        .entries(data);     //return the data

    nested_data = nested_data.sort(function (a, b) {    //organize the data
        return d3.ascending(a.key, b.key)
    });


    console.log("BARCHART DATA");
    console.log(nested_data);

    var x = d3.scaleBand()      //define the width of each rect
        .rangeRound([0, width])
        .paddingInner(0.1);

    var y = d3.scaleLinear()        //define the height of each rect
        .rangeRound([height, 0]);

    var z = d3.scaleOrdinal()       //define the color range for the rect
        .range(["#e74c3c","#85c1e9","#7d3c98","#a04000"]);

    if (property === "time") {      //arrange depending of the property
        x.domain([0, d3.max(nested_data.map(function (d) {      //set the x domain
            return +d.key;
        })) + 1]);
    } else {
        x.domain(nested_data.map(function (d) {
            return d.key;
        }));

    }

    y.domain([0, d3.max(nested_data, function (d) {    //set the y domain
        return d.value.size;
    })]);
    z.domain(nested_data.map(function (d) {         //set the z domain
        return d.key;
    }));

    g.selectAll(".bar")     //create the rect on the chart
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
        })
    .on("mouseover", function(d){       //animation on mouseover

        d3.select(".tooltip")
            .style("display", "block")

        d3.select(this)
            .transition().duration(100)
            .attr("y", y(d.value.size) - 10)
    })
        .on("mouseout", function(d){        //return at default position on mouseout
            d3.select(".tooltip")
                .style("display", "none");

            d3.select(this)
                .transition().duration(100)
                .attr("y", y(d.value.size))
        });

    g.append("g")           //set the legend
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axes")
        .call(d3.axisBottom(x));

    g.append("g")           //set the legend
        .attr("class", "axis")
        .attr("class", "axes")
        .call(d3.axisLeft(y).ticks(null, "s"))

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function bar_chart_time(element, property) {
    $("#" + element).html("");
    var svg = d3.select("#" + element).append("svg").attr("width", 400).attr("height", 400);
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

    var x = d3.scaleLinear()
        .rangeRound([0, width]);


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
            return y(d.value.size);
        })
        .attr("height", function (d) {
            return height - y(d.value.size);
        })
        .attr("width", function (d) {
            return (x(1)-x(0))*0.9;

        })
        .style("fill", function (d) {
            return z(d.key)
        });

    g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axes")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis")
        .attr("class", "axes")
        .call(d3.axisLeft(y).ticks(null, "s"))

}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//function for selecting and showing data
function bar_chart_datatime(element, property) {
    $("#" + element).html("");
    d3.select("#" + element).append("text").text(property);

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Main Function
$(function () {
    console.log("READY");

    //data from google spreadsheet
    var URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfeT9lPtJ5ia2XsopWVdvl98Oy7Bu6xL9SVQBEh32OXC8Qk4MKYxr2TcGSSTkAs7kAMfjF83IEGhQ-";
    URL += "/pub?single=true&output=csv";       //make it to a csv format

    //use d3 on the csv
    d3.csv(URL, function (d) {
        data = d;
        time_all = 0;       //variable for the "Données" section
        time_joe = 0;
        time_current = 0;
        data.forEach(function (d) {     //for each element on the csv
            d.time = +d.time;       //convert the time into number
            time_all += d.time;     //add time to the total
            if (d.who == "Joe"){    //count only Joe's time
                time_joe += d.time;
            }
            if (d.status == "DOING"){       //count only time for "DOING" element
                time_current += d.time;
            }
        });
        console.log(time_all);

        //we call the function here
        bar_chart("bcp", "priority");
        bar_chart("bcs", "status");
        bar_chart("bcw", "who");
        bar_chart_time("bct","time");
        treemap("status", "status", "who");
        treemap("who", "who", "status");

        bar_chart_datatime("time_all",time_all);
        bar_chart_datatime("time_joe",time_joe);
        bar_chart_datatime("time_current",time_current);

    });

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//script for the navbutton

$(document).ready(function(){
    // au clic sur un lien
    $('a').on('click', function(evt){
        // bloquer le comportement par défaut: on ne rechargera pas la page
        evt.preventDefault();
        // enregistre la valeur de l'attribut  href dans la variable target
        var target = $(this).attr('href');
        /* le sélecteur $(html, body) permet de corriger un bug sur chrome
        et safari (webkit) */
        $('html, body')
        // on arrête toutes les animations en cours
            .stop()
            /* on fait maintenant l'animation vers le haut (scrollTop) vers
             notre ancre target */
            .animate({scrollTop: $(target).offset().top}, 1000 );
    });
});