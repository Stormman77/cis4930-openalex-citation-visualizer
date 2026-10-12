import * as d3 from 'd3';

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#chart-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const g = svg.append("g");

const zoom = d3.zoom().on("zoom", (e) => g.attr("transform", e.transform));
svg.call(zoom);

// Create the tooltip container
const tooltip = d3.select("body").append("div")
  .style("position", "absolute")
  .style("background", "rgba(0, 0, 0, 0.8)")
  .style("color", "#fff")
  .style("padding", "8px 12px")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("font-size", "14px")
  .style("z-index", "1000")
  .style("font-family", "sans-serif")
  .style("max-width", "300px");

d3.json("http://127.0.0.1:5001/api/network").then(data => {
  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-30))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = g.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(data.links)
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.value));

  const node = g.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(data.nodes)
    .join("circle")
    .attr("r", 6)
    .attr("fill", "#782F40")
    .call(drag(simulation))
    // Add hover events for the tooltip
    .on("mouseover", (event, d) => {
       tooltip.transition().duration(200).style("opacity", 1);
       tooltip.html(`<strong>${d.title}</strong><br/>Year: ${d.year}`)
         .style("left", (event.pageX + 15) + "px")
         .style("top", (event.pageY - 25) + "px");
       d3.select(event.currentTarget).attr("stroke", "#CEB888").attr("stroke-width", 3);
    })
    .on("mousemove", (event) => {
       tooltip.style("left", (event.pageX + 15) + "px")
         .style("top", (event.pageY - 25) + "px");
    })
    .on("mouseout", (event, d) => {
       tooltip.transition().duration(200).style("opacity", 0);
       d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 1.5);
    });

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  });
});

function drag(simulation) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}