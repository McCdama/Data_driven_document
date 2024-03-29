async function drawScatter() {
  // 1. Access data

  const dataset = await d3.json("./../../my_weather_data.json");

  const xAccessor = (d) => d.dewPoint;
  const yAccessor = (d) => d.humidity;

  // 2. Create chart dimensions

  const width = d3.min([window.innerWidth * 0.9, window.innerHeight * 0.9]);
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 10,
      right: 10,
      bottom: 50,
      left: 50,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  // 4. Create scales

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();

  const drawDots = (dataset) => {
    // 5. Draw data

    const dots = bounds.selectAll("circle").data(dataset, (d) => d[0]);

    const newDots = dots.enter().append("circle");

    const allDots = newDots
      .merge(dots)
      .attr("cx", (d) => xScale(xAccessor(d)))
      .attr("cy", (d) => yScale(yAccessor(d)))
      .attr("r", 4);

    const oldDots = dots.exit().remove();
  };
  drawDots(dataset);

  // 6. Draw peripherals

  const xAxisGenerator = d3.axisBottom().scale(xScale);

  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  const xAxisLabel = xAxis
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .html("dew point (&deg;F)");

  const yAxisGenerator = d3.axisLeft().scale(yScale).ticks(4);

  const yAxis = bounds.append("g").call(yAxisGenerator);

  const yAxisLabel = yAxis
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 10)
    .text("relative humidity");

  // 7. Set up interactions

  // https://github.com/d3/d3-delaunay
  // create a new Delaunay triangulation; a way to join a set of points to create a triangular mesh.
  // pass d3.Delaunay.from() three params
  const delaunay = d3.Delaunay.from(
    dataset,
    (d) => xScale(xAccessor(d)),
    (d) => yScale(yAccessor(d))
  );
  // now turn the Delaunay triangulation into a voronoi diagram
  const voronoi = delaunay.voronoi();
  /* specify the size of the diagram */
  voronoi.xmax = dimensions.boundedWidth;
  voronoi.ymax = dimensions.boundedHeight;

  // bind data and add a <path> for each.
  bounds
    .selectAll(".voronoi")
    .data(dataset)
    .enter()
    .append("path")
    .attr("class", "voronoi")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .attr("stroke", "salmon") // try to comment it out and see
    /* capture hover event */
    .on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave);
  const tooltip = d3.select("#tooltip");
  function onMouseEnter(e, datum) {
    const dayDot = bounds
      .append("circle")
      .attr("class", "tooltipDot")
      .attr("cx", xScale(xAccessor(datum)))
      .attr("cy", yScale(yAccessor(datum)))
      .attr("r", 7)
      .style("fill", "maroon")
      .style("pointer-events", "none");
  }
  function onMouseLeave() {
    d3.selectAll(".tooltipDot").remove();
    tooltip.style("opacity", 0);
  }
}
drawScatter();
