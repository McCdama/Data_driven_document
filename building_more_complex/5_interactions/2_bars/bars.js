async function drawBars() {
  // 1. Access data

  const dataset = await d3.json("./../../my_weather_data.json");

  // 2. Create chart dimensions

  const width = 600;
  let dimensions = {
    width: width,
    height: width * 0.6,
    margin: {
      top: 30,
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

  // init static elements
  bounds.append("g").attr("class", "bins");
  bounds.append("line").attr("class", "mean");
  bounds
    .append("g")
    .attr("class", "x-axis")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .append("text")
    .attr("class", "x-axis-label");

  const metricAccessor = (d) => d.humidity;
  const yAccessor = (d) => d.length;

  // 4. Create scales

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, metricAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  const binsGenerator = d3
    .bin()
    .domain(xScale.domain())
    .value(metricAccessor)
    .thresholds(12);

  const bins = binsGenerator(dataset);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(bins, yAccessor)])
    .range([dimensions.boundedHeight, 0])
    .nice();

  // 5. Draw data

  const barPadding = 1;

  let binGroups = bounds.select(".bins").selectAll(".bin").data(bins);

  binGroups.exit().remove();

  const newBinGroups = binGroups.enter().append("g").attr("class", "bin");

  newBinGroups.append("rect");
  newBinGroups.append("text");

  // update binGroups to include new points
  binGroups = newBinGroups.merge(binGroups);

  const barRects = binGroups
    .select("rect")
    .attr("x", (d) => xScale(d.x0) + barPadding)
    .attr("y", (d) => yScale(yAccessor(d)))
    .attr("height", (d) => dimensions.boundedHeight - yScale(yAccessor(d)))
    .attr("width", (d) =>
      d3.max([0, xScale(d.x1) - xScale(d.x0) - barPadding])
    );

  const mean = d3.mean(dataset, metricAccessor);

  const meanLine = bounds
    .selectAll(".mean")
    .attr("x1", xScale(mean))
    .attr("x2", xScale(mean))
    .attr("y1", -20)
    .attr("y2", dimensions.boundedHeight);

  // draw axes
  const xAxisGenerator = d3.axisBottom().scale(xScale);

  const xAxis = bounds.select(".x-axis").call(xAxisGenerator);

  const xAxisLabel = xAxis
    .select(".x-axis-label")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .text("Humidity");

  // 7. Set up interactions
  formatHumidity = d3.format(".2f"); //https://github.com/d3/d3-format
  binGroups
    .select("rect")
    .on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave);

  const tooltip = d3.select("#tooltip");
  function onMouseEnter(e, datum) {
    console.log(e.currentTarget);
    tooltip.select("#count").text(yAccessor(datum));
    /* update the range value to mactch the hovered bar */
    tooltip
      .select("#range")
      .text([formatHumidity(datum.x0), formatHumidity(datum.x1)].join(" - "));
    /* Positioning the tooltip horizontally above a bar when hover over it. */
    /* Note: the tooltip is located at thee top of left of the WRAPPER.
     * Since the bars are within the bounnds, they are shifted by the margin we specified.
     */
    /* get the x position of the tooltip:
     * 1- the bar's x position in the chart (xScale(datum.x0)).
     * 2- half of the bar's width ((xScale(datum.x1) - xScale(datum.x0)) / 2).
     * 3- the marin by which the bounds are shifted right (dimensions.margin.left?).
     */

    const x =
      xScale(datum.x0) +
      (xScale(datum.x1) - xScale(datum.x0)) / 2 +
      dimensions.margin.left;
    /* calculating the tooltip's y position don't take into account the bar's dimensions,
     * because we want to place it above the bar.
     */
    const y = yScale(yAccessor(datum)) + dimensions.margin.top;
    /* we're working with a normal xHTML div, we'll use the CSS translate prop. */
    /* tooltip.style("transform", `translate(` + `${x}px,` + `${y}px` + `)`); */ // not working well
    /* .getBoundingClientRect() to find the tooltip size. */
    /* ways to shift absoultly positioned elements using CSS prop
  - top, bottom: percentage of the parent's height // left, right: percentage of the parent's width
  - margins: percentage of the parent's width
  - transform: translate():  percentage of the specified element.*/
    /* HOW WE CAN TRANSLATE VALUE USING A PIXEL AMOUNT AND A WIDTH --> calc() to calculte the offset based on values with differents units */
    tooltip.style(
      "transform",
      `translate(` + `calc( -50% + ${x}px),` + `calc(-100% + ${y}px)` + `)`
    ); // PERFECT :)

    /* Hide the tooltip when not hovering over */
    tooltip.style("opacity", 1);
  }
  function onMouseLeave() {
    tooltip.style("opacity", 0);
  }
}
drawBars();
