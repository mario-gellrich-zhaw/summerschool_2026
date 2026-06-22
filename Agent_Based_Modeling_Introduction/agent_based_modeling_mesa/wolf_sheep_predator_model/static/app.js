const COLORS = {
  wolf: "#ef4444",
  sheep: "#06b6d4",
  grass_grown: "#16a34a",
  grass_bare: "#92400e",
  Wolves: "#f59e0b",
  Sheep: "#06b6d4",
  Grass: "#16a34a",
};

const ANIMAL_SYMBOLS = {
  wolf: "\u{1F43A}", // wolf face
  sheep: "\u{1F411}", // sheep
};

let playTimer = null;

function paramPayload() {
  return {
    width: Number(document.getElementById("width").value),
    height: Number(document.getElementById("height").value),
    initial_sheep: Number(document.getElementById("initial_sheep").value),
    initial_wolves: Number(document.getElementById("initial_wolves").value),
    sheep_reproduce: Number(document.getElementById("sheep_reproduce").value),
    wolf_reproduce: Number(document.getElementById("wolf_reproduce").value),
    wolf_gain_from_food: Number(document.getElementById("wolf_gain_from_food").value),
    sheep_gain_from_food: Number(document.getElementById("sheep_gain_from_food").value),
    grass_regrowth_time: Number(document.getElementById("grass_regrowth_time").value),
    grass: document.getElementById("grass").checked,
  };
}

async function resetModel() {
  const res = await fetch("/api/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paramPayload()),
  });
  const state = await res.json();
  render(state);
}

async function stepModel(n = 1) {
  const res = await fetch(`/api/step?n=${n}`, { method: "POST" });
  const state = await res.json();
  render(state);
}

function togglePlay() {
  const btn = document.getElementById("play-btn");
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
    btn.textContent = "Play";
    return;
  }
  btn.textContent = "Pause";
  const interval = Number(document.getElementById("play-interval").value);
  playTimer = setInterval(() => stepModel(1), interval);
}

function render(state) {
  document.getElementById("step-value").textContent = state.step;
  renderCounts(state.counts);
  renderGrid(state);
  renderChart(state.history);
}

function renderCounts(counts) {
  const el = document.getElementById("counts");
  el.innerHTML = Object.entries(counts)
    .map(
      ([label, value]) =>
        `<div style="color:${COLORS[label] || "#e2e8f0"}"><strong>${label}:</strong> ${value}</div>`
    )
    .join("");
}

function renderGrid(state) {
  const svg = d3.select("#grid");
  const box = svg.node().getBoundingClientRect();
  const cell = Math.min(box.width / state.width, box.height / state.height);
  svg.attr("viewBox", `0 0 ${state.width * cell} ${state.height * cell}`);

  const grass = state.agents.filter((a) => a.type === "grass");
  const animals = state.agents.filter((a) => a.type !== "grass");

  const grassSel = svg.selectAll("rect.grass").data(grass, (d) => `${d.x}-${d.y}`);
  grassSel
    .join("rect")
    .attr("class", "grass")
    .attr("x", (d) => d.x * cell)
    .attr("y", (d) => d.y * cell)
    .attr("width", cell)
    .attr("height", cell)
    .attr("fill", (d) => (d.fully_grown ? COLORS.grass_grown : COLORS.grass_bare));

  const animalSel = svg
    .selectAll("text.animal")
    .data(animals, (d, i) => i);
  animalSel
    .join("text")
    .attr("class", "animal")
    .attr("x", (d) => d.x * cell + cell / 2)
    .attr("y", (d) => d.y * cell + cell / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("font-size", cell * 0.85)
    .text((d) => ANIMAL_SYMBOLS[d.type]);
}

function renderChart(history) {
  const svg = d3.select("#chart");
  const box = svg.node().getBoundingClientRect();
  const margin = { top: 10, right: 110, bottom: 30, left: 45 };
  const width = box.width - margin.left - margin.right;
  const height = box.height - margin.top - margin.bottom;
  svg.attr("viewBox", `0 0 ${box.width} ${box.height}`);

  const seriesNames = Object.keys(history).filter((k) => k !== "steps");
  const maxY = Math.max(1, ...seriesNames.flatMap((name) => history[name]));

  const x = d3.scaleLinear().domain([0, Math.max(1, history.steps.length - 1)]).range([0, width]);
  const y = d3.scaleLinear().domain([0, maxY]).range([height, 0]);

  let g = svg.select("g.plot-area");
  if (g.empty()) {
    g = svg.append("g").attr("class", "plot-area");
    g.append("g").attr("class", "x-axis");
    g.append("g").attr("class", "y-axis");
  }
  g.attr("transform", `translate(${margin.left},${margin.top})`);

  g.select(".x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));
  g.select(".y-axis").call(d3.axisLeft(y).ticks(5));

  const line = d3
    .line()
    .x((_, i) => x(i))
    .y((d) => y(d));

  const paths = g.selectAll("path.series").data(seriesNames, (d) => d);
  paths
    .join("path")
    .attr("class", "series")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", (name) => COLORS[name] || "#e2e8f0")
    .attr("d", (name) => line(history[name]));

  const legend = svg.selectAll("g.legend").data([null]);
  const legendG = legend.join("g").attr("class", "legend").attr("transform", `translate(${width + margin.left + 10},${margin.top})`);
  const items = legendG.selectAll("g.legend-item").data(seriesNames, (d) => d);
  const itemsEnter = items.join("g").attr("class", "legend-item").attr("transform", (_, i) => `translate(0,${i * 24})`);
  itemsEnter.selectAll("rect").data((d) => [d]).join("rect").attr("width", 12).attr("height", 12).attr("fill", (d) => COLORS[d] || "#e2e8f0");
  itemsEnter.selectAll("text").data((d) => [d]).join("text").attr("x", 16).attr("y", 10).text((d) => d);
}

const METRIC_LABELS = {
  mean_final_wolves: "Mean final wolves",
  mean_final_sheep: "Mean final sheep",
  mean_final_grass: "Mean final grass patches",
  wolves_extinct_rate: "Wolf extinction rate",
  sheep_extinct_rate: "Sheep extinction rate",
  grass_extinct_rate: "Grass extinction rate",
};

let lastSensitivityResult = null;

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
    initial_sheep: sensitivityAxisSpec("sheep"),
    initial_wolves: sensitivityAxisSpec("wolf"),
    replications: Number(document.getElementById("sens-replications").value),
    steps: Number(document.getElementById("sens-steps").value),
  };

  try {
    const res = await fetch("/api/sensitivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      status.textContent = `Error: ${data.error || res.statusText}`;
      return;
    }
    lastSensitivityResult = data;
    status.textContent = `Done: ${data.n_runs} runs in ${data.elapsed_seconds}s.`;
    renderHeatmap();
  } catch (err) {
    status.textContent = `Error: ${err}`;
  } finally {
    btn.disabled = false;
  }
}

function renderHeatmap() {
  if (!lastSensitivityResult) return;

  const metric = document.getElementById("sensitivity-metric").value;
  const sheepValues = lastSensitivityResult.initial_sheep_values;
  const wolfValues = lastSensitivityResult.initial_wolves_values;
  const matrix = lastSensitivityResult.metrics[metric];

  const svg = d3.select("#sensitivity-heatmap");
  svg.selectAll("*").remove();

  if (!matrix) {
    svg
      .append("text")
      .attr("x", 10)
      .attr("y", 20)
      .text("No grass data for this run (grass regrowth was disabled).");
    return;
  }

  const box = svg.node().getBoundingClientRect();
  const margin = { top: 40, right: 20, bottom: 50, left: 70 };
  const width = box.width - margin.left - margin.right;
  const height = box.height - margin.top - margin.bottom;
  svg.attr("viewBox", `0 0 ${box.width} ${box.height}`);

  const xLabels = wolfValues.map(String);
  const yLabels = sheepValues.map(String);
  const x = d3.scaleBand().domain(xLabels).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(yLabels).range([0, height]).padding(0.05);

  const flat = matrix.flat();
  const color = d3.scaleSequential(d3.interpolateViridis).domain([Math.min(...flat), Math.max(...flat)]);
  const isRate = metric.endsWith("_rate");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  for (let i = 0; i < sheepValues.length; i++) {
    for (let j = 0; j < wolfValues.length; j++) {
      const value = matrix[i][j];
      const cx = x(xLabels[j]);
      const cy = y(yLabels[i]);
      const fill = color(value);
      g.append("rect")
        .attr("x", cx)
        .attr("y", cy)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", fill);

      const rgb = d3.rgb(fill);
      const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      g.append("text")
        .attr("class", "heatmap-cell-label")
        .attr("x", cx + x.bandwidth() / 2)
        .attr("y", cy + y.bandwidth() / 2)
        .attr("fill", luminance > 0.55 ? "#0f172a" : "#f8fafc")
        .text(isRate ? value.toFixed(2) : value.toFixed(1));
    }
  }

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));

  svg
    .append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", box.height - 8)
    .attr("text-anchor", "middle")
    .text("Initial Wolves");

  svg
    .append("text")
    .attr("transform", `translate(16,${margin.top + height / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .text("Initial Sheep");

  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", 18)
    .text(METRIC_LABELS[metric]);

  const legendWidth = 120;
  const legendX = margin.left + width - legendWidth;
  const gradientId = "heatmap-gradient";
  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient").attr("id", gradientId).attr("x1", "0%").attr("x2", "100%");
  const stopCount = 10;
  for (let i = 0; i <= stopCount; i++) {
    const t = i / stopCount;
    gradient
      .append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", color(color.domain()[0] + t * (color.domain()[1] - color.domain()[0])));
  }
  svg
    .append("rect")
    .attr("x", legendX)
    .attr("y", 20)
    .attr("width", legendWidth)
    .attr("height", 10)
    .attr("fill", `url(#${gradientId})`);
  svg
    .append("text")
    .attr("x", legendX)
    .attr("y", 12)
    .attr("font-size", 11)
    .text(color.domain()[0].toFixed(2));
  svg
    .append("text")
    .attr("x", legendX + legendWidth)
    .attr("y", 12)
    .attr("text-anchor", "end")
    .attr("font-size", 11)
    .text(color.domain()[1].toFixed(2));
}

document.getElementById("sensitivity-btn").addEventListener("click", runSensitivityAnalysis);
document.getElementById("sensitivity-metric").addEventListener("change", renderHeatmap);

document.getElementById("reset-btn").addEventListener("click", resetModel);
document.getElementById("step-btn").addEventListener("click", () => stepModel(1));
document.getElementById("play-btn").addEventListener("click", togglePlay);
document.getElementById("play-interval").addEventListener("input", (e) => {
  document.getElementById("play-interval-value").textContent = e.target.value;
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = setInterval(() => stepModel(1), Number(e.target.value));
  }
});

resetModel();
