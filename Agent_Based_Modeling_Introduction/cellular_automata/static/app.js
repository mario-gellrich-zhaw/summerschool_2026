const SUMMARY_CARDS = [
  ["alive", "Alive Cells", "number"],
  ["dead", "Dead Cells", "number"],
  ["alive_share", "Alive Share", "percent"],
];

let playTimer = null;
let currentRule = document.getElementById("rule").value;

function paramPayload() {
  return {
    width: Number(document.getElementById("width").value),
    height: Number(document.getElementById("height").value),
    initial_fraction_alive: Number(document.getElementById("initial_fraction_alive").value),
    rule: currentRule,
    seed: Number(document.getElementById("seed").value),
  };
}

function formatValue(value, kind) {
  if (kind === "percent") {
    return `${(value * 100).toFixed(1)}%`;
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
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
  currentRule = document.getElementById("rule").value;
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
  document.getElementById("play-btn").textContent = "Run";
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

async function toggleCell(x, y) {
  const res = await fetch("/api/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x, y }),
  });
  render(await readJsonResponse(res));
}

function render(state) {
  if (state.error) {
    alert(state.error);
    return;
  }

  document.getElementById("step-value").textContent = state.step;
  document.getElementById("alive-value").textContent = state.summary.alive;
  currentRule = state.rule || currentRule;
  document.getElementById("rule").value = currentRule;
  renderSummary(state.summary);
  renderGrid(state);
  renderChart(state.history, state.width * state.height);
}

function renderSummary(summary) {
  document.getElementById("summary-cards").innerHTML = SUMMARY_CARDS.map(([key, label, kind]) => `
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

  svg.selectAll("rect.cell")
    .data(state.cells, (d) => `${d.x}-${d.y}`)
    .join("rect")
    .attr("class", "cell")
    .attr("x", (d) => d.x * cell)
    .attr("y", (d) => d.y * cell)
    .attr("width", cell - 1)
    .attr("height", cell - 1)
    .attr("rx", Math.max(1, cell * 0.12))
    .attr("fill", (d) => (d.alive ? "#3fbf52" : "#e7edf6"))
    .attr("stroke", (d) => (d.alive ? "rgba(47,158,68,0.4)" : "rgba(29,125,197,0.16)"))
    .attr("cursor", "pointer")
    .on("click", (_, d) => toggleCell(d.x, d.y));
}

function renderChart(history, population) {
  const svg = d3.select("#chart");
  svg.selectAll("*").remove();

  const box = svg.node().getBoundingClientRect();
  const margin = { top: 14, right: 20, bottom: 34, left: 46 };
  const width = box.width - margin.left - margin.right;
  const height = box.height - margin.top - margin.bottom;
  svg.attr("viewBox", `0 0 ${box.width} ${box.height}`);

  const x = d3.scaleLinear().domain([0, Math.max(1, history.steps.length - 1)]).range([0, width]);
  const y = d3.scaleLinear().domain([0, Math.max(1, population)]).range([height, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(6));
  g.append("g").call(d3.axisLeft(y).ticks(5));

  const area = d3.area().x((_, i) => x(i)).y0(height).y1((d) => y(d));
  g.append("path")
    .datum(history.alive)
    .attr("fill", "rgba(29,125,197,0.18)")
    .attr("d", area);

  const line = d3.line().x((_, i) => x(i)).y((d) => y(d));
  g.append("path")
    .datum(history.alive)
    .attr("fill", "none")
    .attr("stroke", "#1d7dc5")
    .attr("stroke-width", 3)
    .attr("d", line);
}

document.getElementById("reset-btn").addEventListener("click", resetModel);
document.getElementById("step-btn").addEventListener("click", () => stepModel(1));
document.getElementById("play-btn").addEventListener("click", togglePlay);
document.getElementById("rule").addEventListener("change", (event) => {
  currentRule = event.target.value;
});
document.getElementById("play-interval").addEventListener("input", (event) => {
  document.getElementById("play-interval-value").textContent = event.target.value;
  if (playTimer) {
    stopPlay();
    togglePlay();
  }
});

resetModel();