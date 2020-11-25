const URL_BASE = "https://khale.github.io/ipi-heatmaps"

function drawmap(name, desc) {
    // set the dimensions and margins of the graph
    var margin = {top: 80, right: 25, bottom: 30, left: 40},
        width = document.getElementById("ipi_heatmap") - margin.left - margin.right,
        height = document.getElementById("ipi_heatmap") - margin.top - margin.bottom;


    // append the svg object to the body of the page
    var svg = d3.select("#ipi_heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    //Read the data
    var url = URL_BASE + "/machines/" + name + "/" + "data.csv"
    d3.csv(url, function(data) {

        data.forEach(function (d) {
            d.sc      = parseInt(d.sc);
            d.dc      = parseInt(d.dc);
            d.trial   = parseInt(d.trial);
            d.latency = parseInt(d.latency);
        });

        // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
        var myGroups = d3.map(data, function(d){return +d.sc;}).keys().sort(function (a,b) { +a > +b })

        
        var latsByCores = d3.nest()
            .key(function (d) { return parseInt(d.sc); }).sortKeys(d3.ascending)
            .key(function (d) { return parseInt(d.dc); }).sortKeys(d3.ascending)
            .rollup(function (v) { return {
                avg: d3.mean(v, function(d) { return +d.latency; }),
                min: d3.min(v, function(d) { return +d.latency; }),
                max: d3.max(v, function(d) { return +d.latency; }),
                med: d3.median(v, function(d) { return +d.latency; }),
                std: d3.deviation(v, function(d) { return +d.latency; })
            }; })
            .map(data);

        // set up the color scale
        var center = d3.median(data, function(d) { return +d.latency; })
        var start = 0;
        if ((center - 1000) > 0) {
            start = center - 1000;
        }
        var end = center + 1000;

        // Build X scales and axis:
        var x = d3.scaleBand()
            .range([ 0, width ])
            .domain(myGroups)
            .padding(0.05);
        svg.append("g")
            .style("font-size", 12)
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickSize(0))
            .select(".domain").remove()

        // Build Y scales and axis:
        var y = d3.scaleBand()
            .range([ height, 0 ])
            .domain(myGroups)
            .padding(0.05);
        svg.append("g")
            .style("font-size", 12)
            .call(d3.axisLeft(y).tickSize(0))
            .select(".domain").remove()

        // Build color scale
        var myColor = d3.scaleSequential()
            .interpolator(d3.interpolateInferno)
            .domain([start,end])

        // create a tooltip
        var tooltip = d3.select("#ipi_heatmap")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        // Three function that change the tooltip when user hover / move / leave a cell
        var mouseover = function(d) {
            tooltip
                .style("opacity", 1)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)
        }
        var mousemove = function(d) {
            tooltip
                .html("Source core: " + d.sc + "; Destination core: " + d.dc + "<br/>" + 
                    "<ul>" + 
                    "<li>Mean: " + latsByCores.get(d.sc).get(d.dc)['avg'] + "</li>" + 
                    "<li>Median: " + latsByCores.get(d.sc).get(d.dc)['med'] + "</li>" + 
                    "<li>Min: " + latsByCores.get(d.sc).get(d.dc)['min'] + "</li>" + 
                    "<li>Max: " + latsByCores.get(d.sc).get(d.dc)['max'] + "</li>" + 
                    "<li>Stddev: " + latsByCores.get(d.sc).get(d.dc)['std'] + "</li>" +
                    "</ul>")
                .style("left", (d3.mouse(this)[0]+70) + "px")
                .style("top", (d3.mouse(this)[1]) + "px")
        }
        var mouseleave = function(d) {
            tooltip
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.8)
        }


        // add the squares
        svg.selectAll()
            .data(data, function(d) { return +d.sc + ':' + +d.dc})
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(+d.sc) })
            .attr("y", function(d) { return y(+d.dc) })
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("width", x.bandwidth() )
            .attr("height", y.bandwidth() )
            .style("fill", function(d) { return myColor(latsByCores.get(d.sc).get(d.dc)['med'])} )
            .style("stroke-width", 4)
            .style("stroke", "none")
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
    })

    // Add title to graph
    svg.append("text")
        .attr("x", 0)
        .attr("y", -50)
        .attr("text-anchor", "left")
        .style("font-size", "22px")
        .text(name);

    // Add subtitle to graph
    svg.append("text")
        .attr("x", 0)
        .attr("y", -20)
        .attr("text-anchor", "left")
        .style("font-size", "12px")
        .style("fill", "grey")
        .text(desc)
}


let dropdown = $('#machine-dropdown')
dropdown.empty()
dropdown.append('<option selected="true" disabled>Choose Machine</option>');
dropdown.prop('selectedIndex', 0);

const machines_url = URL_BASE + "/machines/machines.json" 

$.getJSON(machines_url, function (d) {
    $.each(d, function(key, entry) {
        dropdown.append($('<option></option>').attr('value', entry.name).text(entry.name));
    })
});


$("#machine-dropdown").change(function() {
    let machineName = $("#machine-dropdown :selected").text();
    const url = URL_BASE + "/machines/" + machineName + "/desc.json"

    $.getJSON(url, function (d)  {
        $.each(d, function (key, entry) {
            let name = entry.name;
            let desc = entry.desc;
            let hm = $("#ipi_heatmap");
            hm.empty();
            drawmap(name, desc);
        })
    });

});
