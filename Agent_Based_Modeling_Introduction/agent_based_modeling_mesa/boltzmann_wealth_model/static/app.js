const SUMMARY_CARDS = [
  ["population", "Population", "number"],
  ["total_wealth", "Total Wealth", "number"],
  ["average_wealth", "Avg Wealth", "number1"],
  ["gini", "Gini", "number3"],
  ["richest_wealth", "Richest Agent", "number"],
  ["zero_wealth_share", "Zero-Wealth Share", "percent"],
  ["top10_wealth_share", "Top 10% Wealth", "percent"],
];

const METRIC_LABELS = {
  mean_final_gini: "Mean final Gini",
  mean_top10_wealth_share: "Mean top 10% wealth share",
  mean_zero_wealth_share: "Mean zero-wealth share",
  mean_richest_wealth: "Mean richest-agent wealth",
};

const LOWER_IS_BETTER_METRICS = new Set([
  "mean_final_gini",
  "mean_top10_wealth_share",
  "mean_zero_wealth_share",
  "mean_richest_wealth",
]);

let playTimer = null;
let lastSensitivityResult = null;

function paramPayload() {
  return {
    n: Number(document.getElementById("n").value),
    width: Number(document.getElementById("width").value),
    height: Number(document.getElementById("height").value),
    seed: Number(document.getElementById("seed").value),
    max_steps: Number(document.getElementById("max_steps").value),
  };
}

function formatValue(value, kind) {
  if (kind === "percent") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (kind === "number3") {
    return value.toFixed(3);
  }
  if (kind === "number1") {
    return value.toFixed(1);
  }
  if (kind === "number") {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  }
  return String(value);
}

function formatHeatmapValue(metric, value) {
  if (metric === "mean_richest_wealth") {
    return Math.round(value).toString();
  }
  return `${(value * 100).toFixed(1)}%`;
}

function heatmapColorDomain(metric, domainMin, domainMax) {
  const adjustedMax = domainMax === domainMin ? domainMin + 1e-9 : domainMax;
  if (LOWER_IS_BETTER_METRICS.has(metric)) {
    return [adjustedMax, domainMin];
  }
  return [domainMin, adjustedMax];
}

async function readJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

async function resetModel() {
  stopPlay();
  const res = await fetch("/api/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paramPayload()),
  });
  render(await readJsonResponse(res));
}

async function stepModel(n = 1) {
  const res = await fetch(`/api/step?n=${n}`, { method: "POST" });
  render(await readJsonResponse(res));
}

function stopPlay() {
  if (playTimer) {
    window.clearInterval(playTimer);
    playTimer = null;
  }
  document.getElementById("play-btn").textContent = "Play";
}

function togglePlay() {
  const btn = document.getElementById("play-btn");
  if (playTimer) {
    stopPlay();
    return;
  }
  btn.textContent = "Pause";
  playTimer = window.setInterval(() => stepModel(1), Number(document.getElementById("play-interval").value));
}

function render(state) {
  if (state.error) {
    alert(state.error);
    return;
  }

  if (!state.running) {
    stopPlay();
  }

  document.getElementById("step-value").textContent = state.step;
  document.getElementById("hero-gini").textContent = state.summary.gini.toFixed(3);
  renderSummary(state.summary);
  renderGrid(state);
  renderChart(state.history);
  renderHistogram(state.wealth_histogram);
}

function renderSummary(summary) {
  const container = document.getElementById("summary-cards");
  container.innerHTML = SUMMARY_CARDS.map(([key, label, kind]) => `
    <div class="summary-card">
      <span>${label}</span>
      <strong>${formatValue(summary[key], kind)}</strong>
    </div>
  `).join("");
}

function renderGrid(state) {
  const svg = d3.select("#grid");
  svg.selectAll("*").remove();
  const box = svg.node().getBoundingClientRect();
  const cell = Math.min(box.width / state.width, box.height / state.height);
  svg.attr("viewBox", `0 0 ${state.width * cell} ${state.height * cell}`);

  const cells = [];
  for (let x = 0; x < state.width; x++) {
    for (let y = 0; y < state.height; y++) {
      cells.push({ x, y });
    }
  }

  svg.selectAll("rect.bg-cell")
    .data(cells, (d) => `${d.x}-${d.y}`)
    .join("rect")
    .attr("class", "bg-cell")
    .attr("x", (d) => d.x * cell)
    .attr("y", (d) => d.y * cell)
    .attr("width", cell)
    .attr("height", cell)
    .attr("fill", "rgba(125, 86, 53, 0.08)")
    .attr("stroke", "rgba(92, 66, 46, 0.07)");

  const wealthExtent = d3.extent(state.agents, (d) => d.wealth);
  const domainMin = wealthExtent[0] ?? 0;
  const domainMax = wealthExtent[1] ?? 0;
  const radius = d3.scaleLinear().domain([domainMin, domainMax || domainMin + 1]).range([cell * 0.18, cell * 0.42]);
  const color = d3.scaleSequential(d3.interpolateYlOrBr).domain([
    domainMin,
    domainMax === domainMin ? domainMin + 1e-9 : domainMax,
  ]);

  svg.selectAll("circle.agent")
    .data(state.agents, (_, i) => i)
    .join("circle")
    .attr("class", "agent")
    .attr("cx", (d) => d.x * cell + cell / 2)
    .attr("cy", (d) => d.y * cell + cell / 2)
    .attr("r", (d) => radius(d.wealth))
    .attr("fill", (d) => color(d.wealth))
    .attr("stroke", "rgba(127, 59, 16, 0.55)")
    .attr("stroke-width", 1.2)
    .append("title")
    .text((d) => `Wealth: ${d.wealth}`);

  renderGridLegend(domainMin, domainMax, color);
}

function renderGridLegend(minWealth, maxWealth, colorScale) {
  const legend = document.getElementById("grid-legend");

  legend.innerHTML = `
    <div class="grid-legend-card">
      <div>
        <h3>Wealth Legend</h3>
        <p>Agent color shows current wealth.</p>
      </div>
      <div class="legend-gradient" style="background: linear-gradient(90deg, ${colorScale(minWealth)} 0%, ${colorScale(maxWealth === minWealth ? minWealth + 1e-9 : (minWealth + maxWealth) / 2)} 50%, ${colorScale(maxWealth === minWealth ? minWealth + 1e-9 : maxWealth)} 100%);" aria-hidden="true"></div>
      <div class="legend-labels">
        <span>${formatValue(minWealth, "number")}</span>
        <span>${formatValue(maxWealth, "number")}</span>
      </div>
    </div>
  `;
}

function renderChart(history) {
  const svg = d3.select("#chart");
  svg.selectAll("*").remove();

  const box = svg.node().getBoundingClientRect();
  const margin = { top: 14, right: 20, bottom: 34, left: 46 };
  const width = box.width - margin.left - margin.right;
  const height = box.height - margin.top - margin.bottom;
  svg.attr("viewBox", `0 0 ${box.width} ${box.height}`);

  const x = d3.scaleLinear().domain([0, Math.max(1, history.steps.length - 1)]).range([0, width]);
  const y = d3.scaleLinear().domain([0, Math.max(0.01, d3.max(history.gini) || 0.01)]).nice().range([height, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(6));
  g.append("g").call(d3.axisLeft(y).ticks(5));

  const line = d3.line().x((_, i) => x(i)).y((d) => y(d));
  g.append("path")
    .datum(history.gini)
    .attr("fill", "none")
    .attr("stroke", "#b75a20")
    .attr("stroke-width", 3)
    .attr("d", line);
}

function renderHistogram(histogram) {
  const svg = d3.select("#histogram");
  svg.selectAll("*").remove();

  const box = svg.node().getBoundingClientRect();
  const margin = { top: 14, right: 20, bottom: 34, left: 42 };
  const width = box.width - margin.left - margin.right;
  const height = box.height - margin.top - margin.bottom;
  svg.attr("viewBox", `0 0 ${box.width} ${box.height}`);

  const x = d3.scaleBand().domain(histogram.map((d) => String(d.wealth))).range([0, width]).padding(0.15);
  const y = d3.scaleLinear().domain([0, d3.max(histogram, (d) => d.count) || 1]).nice().range([height, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y).ticks(5));
  g.selectAll("rect.bar")
    .data(histogram)
    .join("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(String(d.wealth)))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.count))
    .attr("rx", 10)
    .attr("fill", "#3e9b6d");
}

function sensitivityAxisSpec(prefix) {
  return {
    min: Number(document.getElementById(`sens-${prefix}-min`).value),
    max: Number(document.getElementById(`sens-${prefix}-max`).value),
    step: Number(document.getElementById(`sens-${prefix}-step`).value),
  };
}

async function runSensitivityAnalysis() {
  const btn = document.getElementById("sensitivity-btn");
  const status = document.getElementById("sensitivity-status");
  btn.disabled = true;
  status.textContent = "Running...";

  const payload = {
    fixed_params: paramPayload(),
    n: sensitivityAxisSpec("n"),
    n_steps: sensitivityAxisSpec("steps"),
    replications: Number(document.getElementById("sens-replications").value),
  };

  try {
    const res = await fetch("/api/sensitivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) {
      status.textContent = `Error: ${data.error || res.statusText}`;
      return;
    }
    lastSensitivityResult = data;
    status.textContent = `Done: ${data.n_runs} runs in ${data.elapsed_seconds}s.`;
    renderHeatmap();
  } catch (err) {
    status.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    btn.disabled = false;
  }
}

function renderHeatmap() {
  if (!lastSensitivityResult) return;

  const metric = document.getElementById("sensitivity-metric").value;
  const agentCountValues = lastSensitivityResult.agent_count_values;
  const stepValues = lastSensitivityResult.step_values;
  const matrix = lastSensitivityResult.metrics[metric];

  const svg = d3.select("#sensitivity-heatmap");
  svg.selectAll("*").remove();

  const box = svg.node().getBoundingClientRect();
  const margin = { top: 42, right: 18, bottom: 52, left: 72 };
  const width = box.width - margin.left - margin.right;
  const height = box.height - margin.top - margin.bottom;
  svg.attr("viewBox", `0 0 ${box.width} ${box.height}`);

  const xLabels = stepValues.map(String);
  const yLabels = agentCountValues.map(String);
  const x = d3.scaleBand().domain(xLabels).range([0, width]).padding(0.06);
  const y = d3.scaleBand().domain(yLabels).range([0, height]).padding(0.06);

  const flat = matrix.flat().filter((value) => value !== null && value !== undefined);
  const domainMin = d3.min(flat);
  const domainMax = d3.max(flat);
  const color = d3.scaleSequential(d3.interpolateRdYlGn).domain(heatmapColorDomain(metric, domainMin, domainMax));

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  for (let i = 0; i < agentCountValues.length; i++) {
    for (let j = 0; j < stepValues.length; j++) {
      const value = matrix[i][j];
      const fill = color(value);
      const cx = x(xLabels[j]);
      const cy = y(yLabels[i]);
      g.append("rect")
        .attr("x", cx)
        .attr("y", cy)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("rx", 14)
        .attr("fill", fill);

      const rgb = d3.rgb(fill);
      const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      g.append("text")
        .attr("class", "heatmap-cell-label")
        .attr("x", cx + x.bandwidth() / 2)
        .attr("y", cy + y.bandwidth() / 2)
        .attr("fill", luminance > 0.58 ? "#2b2118" : "#fffaf4")
        .text(formatHeatmapValue(metric, value));
    }
  }

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", box.height - 10)
    .attr("text-anchor", "middle")
    .text("Simulation steps");

  svg.append("text")
    .attr("transform", `translate(20,${margin.top + height / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .text("Agent count");

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 20)
    .attr("font-weight", 700)
    .text(METRIC_LABELS[metric]);
}

document.getElementById("reset-btn").addEventListener("click", resetModel);
document.getElementById("step-btn").addEventListener("click", () => stepModel(1));
document.getElementById("play-btn").addEventListener("click", togglePlay);
document.getElementById("play-interval").addEventListener("input", (event) => {
  document.getElementById("play-interval-value").textContent = event.target.value;
  if (playTimer) {
    stopPlay();
    togglePlay();
  }
});
document.getElementById("sensitivity-btn").addEventListener("click", runSensitivityAnalysis);
document.getElementById("sensitivity-metric").addEventListener("change", renderHeatmap);

resetModel();
