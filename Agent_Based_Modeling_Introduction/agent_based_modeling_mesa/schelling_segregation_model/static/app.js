const COLORS = {
  0: "#3b82f6",
  1: "#f97316",
  pct_happy: "#22d3ee",
  mean_steps_to_converge: "#f59e0b",
  convergence_rate: "#22d3ee",
  mean_final_pct_happy: "#16a34a",
};

let playTimer = null;

function paramPayload() {
  return {
    width: Number(document.getElementById("width").value),
    height: Number(document.getElementById("height").value),
    density: Number(document.getElementById("density").value),
    minority_pc: Number(document.getElementById("minority_pc").value),
    homophily: Number(document.getElementById("homophily").value),
    radius: Number(document.getElementById("radius").value),
  };
}

async function resetModel() {
  const playBtn = document.getElementById("play-btn");
  playBtn.disabled = false;
  playBtn.textContent = "Play";
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
  if (!state.running) {
    stopPlay();
    document.getElementById("play-btn").textContent = "Converged";
    document.getElementById("play-btn").disabled = true;
  }
}

function stopPlay() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

function togglePlay() {
  const btn = document.getElementById("play-btn");
  if (playTimer) {
    stopPlay();
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
    .map(([label, value]) => {
      const display = typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value;
      return `<div><strong>${label}:</strong> ${display}</div>`;
    })
    .join("");
}

function renderGrid(state) {
  const svg = d3.select("#grid");
  const box = svg.node().getBoundingClientRect();
  const cell = Math.min(box.width / state.width, box.height / state.height);
  svg.attr("viewBox", `0 0 ${state.width * cell} ${state.height * cell}`);

  const allCells = [];
  for (let x = 0; x < state.width; x++) {
    for (let y = 0; y < state.height; y++) {
      allCells.push({ x, y });
    }
  }
  const bgSel = svg.selectAll("rect.bg-cell").data(allCells, (d) => `${d.x}-${d.y}`);
  bgSel
    .join("rect")
    .attr("class", "bg-cell")
    .attr("x", (d) => d.x * cell)
    .attr("y", (d) => d.y * cell)
    .attr("width", cell)
    .attr("height", cell)
    .attr("fill", "#1e293b")
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 0.5);

  const agentSel = svg.selectAll("rect.agent").data(state.agents, (d, i) => i);
  agentSel
    .join("rect")
    .attr("class", "agent")
    .attr("x", (d) => d.x * cell + cell * 0.1)
    .attr("y", (d) => d.y * cell + cell * 0.1)
    .attr("width", cell * 0.8)
    .attr("height", cell * 0.8)
    .attr("rx", cell * 0.15)
    .attr("fill", (d) => COLORS[d.type])
    .attr("stroke", (d) => (d.happy ? "none" : "#ef4444"))
    .attr("stroke-width", (d) => (d.happy ? 0 : 2));
}

function renderChart(history) {
  const svg = d3.select("#chart");
  const box = svg.node().getBoundingClientRect();
  const margin = { top: 10, right: 20, bottom: 30, left: 45 };
  const width = box.width - margin.left - margin.right;
  const height = box.height - margin.top - margin.bottom;
  svg.attr("viewBox", `0 0 ${box.width} ${box.height}`);

  const x = d3.scaleLinear().domain([0, Math.max(1, history.steps.length - 1)]).range([0, width]);
  const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

  let g = svg.select("g.plot-area");
  if (g.empty()) {
    g = svg.append("g").attr("class", "plot-area");
    g.append("g").attr("class", "x-axis");
    g.append("g").attr("class", "y-axis");
    g.append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", -32)
      .attr("x", -10)
      .attr("text-anchor", "end")
      .text("% happy");
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

  const path = g.selectAll("path.series").data([history.pct_happy]);
  path
    .join("path")
    .attr("class", "series")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", COLORS.pct_happy)
    .attr("d", (d) => line(d));
}

const METRIC_LABELS = {
  mean_steps_to_converge: "Mean steps to converge",
  convergence_rate: "Convergence rate",
  mean_final_pct_happy: "Mean final % happy",
};

let lastSensitivityResult = null;

function sensitivityAxisSpec(prefix) {
  return {
    min: Number(document.getElementById(`sens-${prefix}-min`).value),
    max: Number(document.getElementById(`sens-${prefix}-max`).value),
    step: Number(document.getElementById(`sens-${prefix}-step`).value),
  };
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

async function runSensitivityAnalysis() {
  const btn = document.getElementById("sensitivity-btn");
  const status = document.getElementById("sensitivity-status");
  btn.disabled = true;
  status.textContent = "Running...";

  const payload = {
    fixed_params: paramPayload(),
    homophily: sensitivityAxisSpec("homophily"),
    minority_pc: sensitivityAxisSpec("minority"),
    replications: Number(document.getElementById("sens-replications").value),
    steps: Number(document.getElementById("sens-steps").value),
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
    const message = err instanceof Error ? err.message : String(err);
    status.textContent = `Error: Could not reach sensitivity endpoint. ${message}`;
  } finally {
    btn.disabled = false;
  }
}

function renderHeatmap() {
  if (!lastSensitivityResult) return;

  const metric = document.getElementById("sensitivity-metric").value;
  const homophilyValues = lastSensitivityResult.homophily_values;
  const minorityValues = lastSensitivityResult.minority_pc_values;
  const matrix = lastSensitivityResult.metrics[metric];

  const svg = d3.select("#sensitivity-heatmap");
  svg.selectAll("*").remove();

  if (!matrix) return;

  const box = svg.node().getBoundingClientRect();
  const margin = { top: 40, right: 20, bottom: 50, left: 70 };
  const width = box.width - margin.left - margin.right;
  const height = box.height - margin.top - margin.bottom;
  svg.attr("viewBox", `0 0 ${box.width} ${box.height}`);

  const xLabels = minorityValues.map(String);
  const yLabels = homophilyValues.map(String);
  const x = d3.scaleBand().domain(xLabels).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(yLabels).range([0, height]).padding(0.05);

  const flat = matrix.flat().filter((v) => v !== null && v !== undefined);
  const color = d3.scaleSequential(d3.interpolateViridis).domain([Math.min(...flat), Math.max(...flat)]);
  const isRate = metric.endsWith("_rate");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  for (let i = 0; i < homophilyValues.length; i++) {
    for (let j = 0; j < minorityValues.length; j++) {
      const value = matrix[i][j];
      const cx = x(xLabels[j]);
      const cy = y(yLabels[i]);

      if (value === null || value === undefined) {
        g.append("rect")
          .attr("x", cx)
          .attr("y", cy)
          .attr("width", x.bandwidth())
          .attr("height", y.bandwidth())
          .attr("fill", "#475569");
        g.append("text")
          .attr("class", "heatmap-cell-label")
          .attr("x", cx + x.bandwidth() / 2)
          .attr("y", cy + y.bandwidth() / 2)
          .attr("fill", "#e2e8f0")
          .text("N/A");
        continue;
      }

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
    .text("Fraction Minority");

  svg
    .append("text")
    .attr("transform", `translate(16,${margin.top + height / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .text("Homophily");

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

document.getElementById("sensitivity-btn").addEventListener("click", runSensitivityAnalysis);
document.getElementById("sensitivity-metric").addEventListener("change", renderHeatmap);

resetModel();
