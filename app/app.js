const canvas = document.querySelector("#graph");
const ctx = canvas.getContext("2d");
const stage = document.querySelector(".graph-stage");
const detailPanel = document.querySelector("#detail-panel");
const loading = document.querySelector("#loading");
const groupFilter = document.querySelector("#group-filter");
const searchInput = document.querySelector("#search");
const dataList = document.querySelector("#node-list");
const stats = document.querySelector("#graph-stats");
const snapshotSelect = document.querySelector("#snapshot-select");
const embedMode = document.documentElement.classList.contains("embed-mode");
const embedControlsButton = document.querySelector("#embed-controls-button");
const embedOpenLink = document.querySelector("#embed-open-link");

const state = {
  data: null,
  nodes: [],
  edges: [],
  nodeById: new Map(),
  groupLocations: new Map(),
  logoImages: new Map(),
  selected: null,
  hover: null,
  selectedGroup: "all",
  showOwnership: true,
  showFamily: true,
  sizeByValue: true,
  width: 0,
  height: 0,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  camera: { x: 0, y: 0, scale: 1 },
  pointer: { x: 0, y: 0, downX: 0, downY: 0 },
  dragNode: null,
  panning: false,
  alpha: 1,
  didInitialFit: false,
  renderStarted: false,
  manifest: null,
  currentSnapshot: null,
};

const palette = {
  person: { fill: "#f4b968", stroke: "#ffd39a", glow: "rgba(255,189,105,.32)" },
  family: { fill: "#f18462", stroke: "#ffb08f", glow: "rgba(255,126,92,.28)" },
  holding: { fill: "#8f80d8", stroke: "#bdb0ff", glow: "rgba(155,136,232,.27)" },
  company: { fill: "#47c5c0", stroke: "#8de7e2", glow: "rgba(84,214,208,.25)" },
  public: { fill: "#5f91b8", stroke: "#9cc7e4", glow: "rgba(95,145,184,.28)" },
};

const subtypeLabels = {
  person: "Persona",
  family: "Famiglia",
  holding: "Holding",
  listed_holding: "Holding quotata",
  trust: "Trust",
  foundation: "Fondazione",
  cooperative: "Cooperativa",
  state: "Stato / amministrazione centrale",
  municipality: "Comune",
  listed_company: "Società quotata",
  private_company: "Società privata",
};

const mapBounds = {
  minLongitude: 6.2,
  maxLongitude: 18.9,
  minLatitude: 36.3,
  maxLatitude: 47.2,
  width: 1420,
  height: 1220,
};

function geoToWorld(latitude, longitude) {
  return {
    x: ((longitude - mapBounds.minLongitude) / (mapBounds.maxLongitude - mapBounds.minLongitude) - 0.5) * mapBounds.width,
    y: ((mapBounds.maxLatitude - latitude) / (mapBounds.maxLatitude - mapBounds.minLatitude) - 0.5) * mapBounds.height,
  };
}

function nodePalette(node) {
  if (node.category === "subject") {
    if (["state", "municipality"].includes(node.subtype)) return palette.public;
    return node.subtype === "family" ? palette.family : palette.person;
  }
  if (["holding", "listed_holding", "trust"].includes(node.subtype)) return palette.holding;
  return palette.company;
}

function formatValue(value) {
  if (value == null) return "Valore non stimato";
  if (value >= 10) return `€ ${value.toLocaleString("it-IT", { maximumFractionDigits: 1 })} mld`;
  if (value >= 1) return `€ ${value.toLocaleString("it-IT", { maximumFractionDigits: 2 })} mld`;
  return `€ ${(value * 1000).toLocaleString("it-IT", { maximumFractionDigits: 0 })} mln`;
}

function radiusFor(node) {
  if (!state.sizeByValue) return node.category === "subject" ? 19 : 16;
  const value = node.value_eur_bn;
  if (value == null) return 10;
  return Math.max(10, Math.min(47, 8 + Math.sqrt(value / 126) * 70));
}

function isVisibleNode(node) {
  return state.selectedGroup === "all" || node.groups.includes(state.selectedGroup);
}

function isVisibleEdge(edge) {
  const kindVisible = edge.kind === "owns" ? state.showOwnership : state.showFamily;
  if (!kindVisible) return false;
  return isVisibleNode(edge.source) && isVisibleNode(edge.target);
}

function deterministic(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function initializeGraph(data) {
  groupFilter.replaceChildren(new Option("Tutto il campione", "all"));
  dataList.replaceChildren();
  state.selected = null;
  state.hover = null;
  state.selectedGroup = "all";
  state.didInitialFit = false;
  state.alpha = 1;
  state.camera = { x: 0, y: 0, scale: 1 };
  state.data = data;
  state.groupLocations = new Map(data.group_locations.map((location) => {
    const point = geoToWorld(location.latitude, location.longitude);
    return [location.group_name, {
      ...location,
      mapX: point.x + location.offset_x * 1.72,
      mapY: point.y + location.offset_y * 1.42,
      cityX: point.x,
      cityY: point.y,
    }];
  }));

  state.logoImages = new Map();
  Object.entries(data.logos).forEach(([nodeId, logo]) => {
    if (!logo.asset_path) return;
    const image = new Image();
    image.decoding = "async";
    image.src = logo.asset_path;
    image.addEventListener("load", () => { state.alpha = Math.max(state.alpha, 0.04); });
    state.logoImages.set(nodeId, image);
  });

  const groups = [...new Set(data.nodes.flatMap((node) => node.groups))].sort((a, b) => a.localeCompare(b));
  const anchors = new Map();
  groups.forEach((group) => {
    const location = state.groupLocations.get(group);
    anchors.set(group, { x: location.mapX, y: location.mapY });
    const option = document.createElement("option");
    option.value = group;
    option.textContent = `${group} · ${location.city}`;
    groupFilter.append(option);
  });

  state.nodes = data.nodes.map((node) => {
    const anchor = anchors.get(node.groups[0]) || { x: 0, y: 0 };
    const theta = deterministic(`${node.id}-angle`) * Math.PI * 2;
    const spread = 48 + deterministic(`${node.id}-radius`) * 104;
    return {
      ...node,
      x: anchor.x + Math.cos(theta) * spread,
      y: anchor.y + Math.sin(theta) * spread,
      vx: 0,
      vy: 0,
      fixed: false,
      r: radiusFor(node),
      anchor,
    };
  });
  state.nodeById = new Map(state.nodes.map((node) => [node.id, node]));

  state.edges = data.edges.map((edge) => ({
    ...edge,
    source: state.nodeById.get(edge.owner_id || edge.person_a_id),
    target: state.nodeById.get(edge.owned_id || edge.person_b_id),
  }));

  for (const node of state.nodes.slice().sort((a, b) => a.label.localeCompare(b.label))) {
    const option = document.createElement("option");
    option.value = node.label;
    dataList.append(option);
  }

  updateStats();
  selectNode(null);
  loading.classList.add("hidden");
}

function resize() {
  const rect = stage.getBoundingClientRect();
  state.width = rect.width;
  state.height = rect.height;
  canvas.width = Math.round(rect.width * state.dpr);
  canvas.height = Math.round(rect.height * state.dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  if (!state.didInitialFit && state.nodes.length) fitView();
}

function worldToScreen(x, y) {
  return {
    x: (x + state.camera.x) * state.camera.scale + state.width / 2,
    y: (y + state.camera.y) * state.camera.scale + state.height / 2,
  };
}

function screenToWorld(x, y) {
  return {
    x: (x - state.width / 2) / state.camera.scale - state.camera.x,
    y: (y - state.height / 2) / state.camera.scale - state.camera.y,
  };
}

function simulate() {
  const nodes = state.nodes.filter(isVisibleNode);
  const edges = state.edges.filter(isVisibleEdge);
  const alpha = state.alpha;
  if (alpha < 0.002 || nodes.length === 0) return;

  for (let i = 0; i < nodes.length; i += 1) {
    const a = nodes[i];
    if (a.fixed) continue;
    a.vx += (a.anchor.x - a.x) * 0.0032 * alpha;
    a.vy += (a.anchor.y - a.y) * 0.0032 * alpha;
    for (let j = i + 1; j < nodes.length; j += 1) {
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distanceSq = dx * dx + dy * dy;
      if (distanceSq < 0.01) {
        dx = 0.1;
        dy = 0.1;
        distanceSq = 0.02;
      }
      const distance = Math.sqrt(distanceSq);
      const minimum = a.r + b.r + 18;
      const repulsion = Math.min(3.1, (1100 + minimum * 32) / distanceSq * alpha);
      const fx = (dx / distance) * repulsion;
      const fy = (dy / distance) * repulsion;
      if (!a.fixed) { a.vx -= fx; a.vy -= fy; }
      if (!b.fixed) { b.vx += fx; b.vy += fy; }

      if (distance < minimum) {
        const push = Math.min(3.0, (minimum - distance) * 0.065 * alpha);
        if (!a.fixed) { a.vx -= (dx / distance) * push; a.vy -= (dy / distance) * push; }
        if (!b.fixed) { b.vx += (dx / distance) * push; b.vy += (dy / distance) * push; }
      }
    }
  }

  for (const edge of edges) {
    const a = edge.source;
    const b = edge.target;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const ideal = edge.kind === "family" ? 112 : 104 + (a.r + b.r) * 0.5;
    const strength = edge.kind === "family" ? 0.0024 : 0.0032;
    const pull = (distance - ideal) * strength * alpha;
    const fx = (dx / distance) * pull;
    const fy = (dy / distance) * pull;
    if (!a.fixed) { a.vx += fx; a.vy += fy; }
    if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
  }

  for (const node of nodes) {
    if (node.fixed) continue;
    node.vx *= 0.82;
    node.vy *= 0.82;
    node.vx = Math.max(-4, Math.min(4, node.vx));
    node.vy = Math.max(-4, Math.min(4, node.vy));
    node.x += node.vx;
    node.y += node.vy;
  }
  state.alpha *= 0.982;
}

function drawArrow(edge, sourcePoint, targetPoint) {
  const sourceRadius = edge.source.r * state.camera.scale;
  const targetRadius = edge.target.r * state.camera.scale;
  const dx = targetPoint.x - sourcePoint.x;
  const dy = targetPoint.y - sourcePoint.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / distance;
  const uy = dy / distance;
  const start = { x: sourcePoint.x + ux * sourceRadius, y: sourcePoint.y + uy * sourceRadius };
  const end = { x: targetPoint.x - ux * (targetRadius + 4), y: targetPoint.y - uy * (targetRadius + 4) };
  const active = state.selected && (edge.source.id === state.selected.id || edge.target.id === state.selected.id);
  const dimmed = state.selected && !active;
  const lineAlpha = dimmed ? 0.08 : active ? 0.82 : 0.28;
  const width = Math.max(0.7, Math.min(4.2, 0.7 + edge.percentage / 35)) * Math.min(1.25, state.camera.scale);

  ctx.save();
  ctx.strokeStyle = `rgba(255, 189, 105, ${lineAlpha})`;
  ctx.fillStyle = `rgba(255, 189, 105, ${Math.min(1, lineAlpha + 0.18)})`;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  const arrowSize = Math.max(4, Math.min(8, 5.2 * state.camera.scale));
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - ux * arrowSize - uy * arrowSize * 0.58, end.y - uy * arrowSize + ux * arrowSize * 0.58);
  ctx.lineTo(end.x - ux * arrowSize + uy * arrowSize * 0.58, end.y - uy * arrowSize - ux * arrowSize * 0.58);
  ctx.closePath();
  ctx.fill();

  if (state.camera.scale > 0.54 && !dimmed && (active || state.selectedGroup !== "all" || state.camera.scale > 1.25)) {
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    const label = `${edge.percentage.toLocaleString("it-IT", { maximumFractionDigits: 3 })}%`;
    ctx.font = `${active ? 700 : 600} ${active ? 10 : 8}px Inter, sans-serif`;
    const metrics = ctx.measureText(label);
    ctx.fillStyle = "rgba(7, 16, 21, .88)";
    ctx.fillRect(mx - metrics.width / 2 - 3, my - 6, metrics.width + 6, 12);
    ctx.fillStyle = active ? "#ffd39a" : "#a89576";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, mx, my);
  }
  ctx.restore();
}

function drawFamily(edge, sourcePoint, targetPoint) {
  const active = state.selected && (edge.source.id === state.selected.id || edge.target.id === state.selected.id);
  const dimmed = state.selected && !active;
  const alpha = dimmed ? 0.06 : active ? 0.9 : 0.35;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 125, 134, ${alpha})`;
  ctx.lineWidth = active ? 1.8 : 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(sourcePoint.x, sourcePoint.y);
  ctx.lineTo(targetPoint.x, targetPoint.y);
  ctx.stroke();
  ctx.setLineDash([]);
  if (active && state.camera.scale > 0.52) {
    const mx = (sourcePoint.x + targetPoint.x) / 2;
    const my = (sourcePoint.y + targetPoint.y) / 2;
    ctx.font = "600 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(7, 16, 21, .9)";
    const width = ctx.measureText(edge.relation_type).width;
    ctx.fillRect(mx - width / 2 - 4, my - 7, width + 8, 14);
    ctx.fillStyle = "#ffabb1";
    ctx.fillText(edge.relation_type, mx, my);
  }
  ctx.restore();
}

function drawTerritory() {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const visibleGroups = [...state.groupLocations.values()].filter((location) =>
    state.selectedGroup === "all" || location.group_name === state.selectedGroup
  );
  const cities = new Map();
  visibleGroups.forEach((location) => {
    if (!cities.has(location.city)) cities.set(location.city, location);
    const city = worldToScreen(location.cityX, location.cityY);
    const anchor = worldToScreen(location.mapX, location.mapY);
    ctx.beginPath();
    ctx.moveTo(city.x, city.y);
    ctx.lineTo(anchor.x, anchor.y);
    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = state.selectedGroup === "all" ? "rgba(126, 179, 170, .065)" : "rgba(255, 189, 105, .27)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.setLineDash([]);
  });

  cities.forEach((location) => {
    const point = worldToScreen(location.cityX, location.cityY);
    const active = state.selectedGroup !== "all";
    ctx.beginPath();
    ctx.arc(point.x, point.y, active ? 3.1 : 2.2, 0, Math.PI * 2);
    ctx.fillStyle = active ? "#ffbd69" : "rgba(120, 192, 181, .55)";
    ctx.fill();
    if (state.camera.scale > 0.48 || active) {
      ctx.font = `${active ? 700 : 600} ${active ? 10 : 8}px Inter, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = active ? "rgba(255, 223, 179, .95)" : "rgba(137, 170, 169, .48)";
      ctx.fillText(location.city.toUpperCase(), point.x + 6, point.y - 1);
    }
  });

  ctx.font = "700 8px Inter, sans-serif";
  ctx.letterSpacing = "1px";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(132, 167, 169, .38)";
  ctx.fillText("PROSSIMITÀ TERRITORIALE · ANCORE MORBIDE", 18, 24);
  ctx.restore();
}

function roundedRectPath(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawLogo(node, point, r, showInside) {
  if (node.category !== "organization" || r < 7) return;
  const logo = state.data.logos[node.id];
  if (!logo) return;
  const image = state.logoImages.get(node.id);
  const size = Math.max(11, Math.min(showInside ? 23 : 18, r * (showInside ? 0.72 : 1.0)));
  const x = point.x - size / 2;
  const y = showInside ? point.y - r * 0.56 : point.y - size / 2;

  ctx.save();
  roundedRectPath(x, y, size, size, size * 0.28);
  ctx.fillStyle = "rgba(255, 255, 255, .94)";
  ctx.fill();
  ctx.clip();
  if (image?.complete && image.naturalWidth) {
    const padding = size * 0.13;
    ctx.drawImage(image, x + padding, y + padding, size - padding * 2, size - padding * 2);
  } else {
    ctx.fillStyle = logo.background;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.max(6, size * (logo.mark.length > 2 ? 0.29 : 0.38))}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(logo.mark, point.x, y + size / 2 + 0.5);
  }
  ctx.restore();
}

function wrapLabel(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function drawNode(node) {
  if (!isVisibleNode(node)) return;
  const point = worldToScreen(node.x, node.y);
  const r = node.r * state.camera.scale;
  if (point.x + r < -30 || point.x - r > state.width + 30 || point.y + r < -30 || point.y - r > state.height + 30) return;
  const colors = nodePalette(node);
  const selected = state.selected?.id === node.id;
  const hovered = state.hover?.id === node.id;
  const neighbor = state.selected && state.edges.some((edge) =>
    isVisibleEdge(edge) &&
    ((edge.source.id === state.selected.id && edge.target.id === node.id) ||
      (edge.target.id === state.selected.id && edge.source.id === node.id))
  );
  const dimmed = state.selected && !selected && !neighbor;

  ctx.save();
  ctx.globalAlpha = dimmed ? 0.18 : 1;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = selected || hovered ? 25 : Math.min(14, r * 0.45);
  const gradient = ctx.createRadialGradient(point.x - r * 0.28, point.y - r * 0.32, r * 0.05, point.x, point.y, r);
  gradient.addColorStop(0, colors.stroke);
  gradient.addColorStop(0.25, colors.fill);
  gradient.addColorStop(1, `${colors.fill}b8`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = selected ? 2.4 : hovered ? 1.6 : 0.8;
  ctx.strokeStyle = selected ? "#fff0d2" : colors.stroke;
  ctx.stroke();

  if (selected) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 210, 151, .32)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const showInside = r >= 22 && state.camera.scale >= 0.57;
  drawLogo(node, point, r, showInside);
  const labelLines = wrapLabel(node.label, showInside ? Math.max(9, Math.floor(r / 2.3)) : 20);
  ctx.textAlign = "center";
  if (showInside) {
    const fontSize = Math.max(8, Math.min(11, r * 0.25));
    ctx.font = `650 ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = "rgba(5, 13, 17, .9)";
    ctx.textBaseline = "middle";
    const logoOffset = node.category === "organization" ? r * 0.16 : 0;
    const startY = point.y + logoOffset - ((labelLines.length - 1) * fontSize * 0.45) - (node.value_eur_bn != null ? 2 : 0);
    labelLines.forEach((line, index) => ctx.fillText(line, point.x, startY + index * fontSize * 1.08));
    if (node.value_eur_bn != null && r > 28) {
      ctx.font = `700 ${Math.max(7, fontSize - 2)}px Inter, sans-serif`;
      ctx.fillStyle = "rgba(6, 17, 21, .68)";
      ctx.fillText(formatValue(node.value_eur_bn).replace("€ ", "€"), point.x, startY + labelLines.length * fontSize * 1.08 + 2);
    }
  } else if (state.camera.scale >= 0.48 && (state.selectedGroup !== "all" || selected || hovered)) {
    ctx.font = `${selected ? 700 : 600} ${selected ? 10 : 9}px Inter, sans-serif`;
    ctx.fillStyle = selected ? "#f8e6c9" : "#bccacc";
    ctx.textBaseline = "top";
    const startY = point.y + r + 6;
    labelLines.slice(0, 2).forEach((line, index) => ctx.fillText(line, point.x, startY + index * 10));
  }
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, state.width, state.height);
  simulate();
  drawTerritory();
  const visibleEdges = state.edges.filter(isVisibleEdge);
  for (const edge of visibleEdges.filter((item) => item.kind === "family")) {
    drawFamily(edge, worldToScreen(edge.source.x, edge.source.y), worldToScreen(edge.target.x, edge.target.y));
  }
  for (const edge of visibleEdges.filter((item) => item.kind === "owns")) {
    drawArrow(edge, worldToScreen(edge.source.x, edge.source.y), worldToScreen(edge.target.x, edge.target.y));
  }
  for (const node of state.nodes.filter(isVisibleNode).sort((a, b) => a.r - b.r)) drawNode(node);

  if (!state.didInitialFit && state.alpha < 0.18) {
    fitView();
    state.didInitialFit = true;
  }
  window.requestAnimationFrame(render);
}

function nodeAt(screenX, screenY) {
  const world = screenToWorld(screenX, screenY);
  const nodes = state.nodes.filter(isVisibleNode).sort((a, b) => b.r - a.r);
  return nodes.find((node) => Math.hypot(node.x - world.x, node.y - world.y) <= node.r + 5 / state.camera.scale) || null;
}

function fitView() {
  const nodes = state.nodes.filter(isVisibleNode);
  if (!nodes.length) return;
  const territoryPoints = state.selectedGroup === "all"
    ? [...state.groupLocations.values()].flatMap((location) => [
        { x: location.cityX, y: location.cityY },
        { x: location.mapX, y: location.mapY },
      ])
    : [];
  const minX = Math.min(...nodes.map((node) => node.x - node.r), ...territoryPoints.map((point) => point.x - 18));
  const maxX = Math.max(...nodes.map((node) => node.x + node.r), ...territoryPoints.map((point) => point.x + 18));
  const minY = Math.min(...nodes.map((node) => node.y - node.r), ...territoryPoints.map((point) => point.y - 18));
  const maxY = Math.max(...nodes.map((node) => node.y + node.r), ...territoryPoints.map((point) => point.y + 18));
  const graphWidth = Math.max(1, maxX - minX);
  const graphHeight = Math.max(1, maxY - minY);
  state.camera.scale = Math.max(0.28, Math.min(1.25, Math.min((state.width - 90) / graphWidth, (state.height - 90) / graphHeight)));
  state.camera.x = -(minX + maxX) / 2;
  state.camera.y = -(minY + maxY) / 2;
}

function updateStats() {
  const nodes = state.nodes.filter(isVisibleNode);
  const edges = state.edges.filter(isVisibleEdge);
  stats.innerHTML = `<strong>${nodes.length}</strong> nodi&nbsp;&nbsp;·&nbsp;&nbsp;<strong>${edges.length}</strong> relazioni`;
}

function sourceLink(sourceId, label = "Fonte del nodo") {
  const source = state.data.sources[sourceId];
  return `
    <a class="source-link" href="${source.url}" target="_blank" rel="noreferrer">
      <strong>${source.title}</strong>
      <small>${label} · ${source.publisher} ↗</small>
    </a>`;
}

function relationSourceLink(sourceId) {
  const source = state.data.sources[sourceId];
  return `<a class="relation-source" href="${source.url}" target="_blank" rel="noreferrer" title="${source.title}">Fonte della relazione ↗</a>`;
}

function relationHtml(edge, selected) {
  const other = edge.source.id === selected.id ? edge.target : edge.source;
  if (edge.kind === "owns") {
    const direction = edge.source.id === selected.id ? `Possiede ${other.label}` : `Posseduta da ${other.label}`;
    return `
      <div class="relation-card">
        <strong>${direction}</strong>
        <span class="percentage">${edge.percentage.toLocaleString("it-IT", { maximumFractionDigits: 3 })}%</span>
        <small>${edge.note || "Relazione di proprietà."}</small>
        ${relationSourceLink(edge.source_id)}
      </div>`;
  }
  return `
    <div class="relation-card">
      <strong>${other.label}</strong>
      <span class="percentage">${edge.relation_type}</span>
      <small>${edge.note || "Legame familiare."}</small>
      ${relationSourceLink(edge.source_id)}
    </div>`;
}

function selectNode(node) {
  state.selected = node;
  document.documentElement.classList.toggle("has-selection", Boolean(node));
  if (!node) {
    detailPanel.innerHTML = `
      <div class="empty-detail">
        <span class="empty-orbit"><i></i></span>
        <p class="eyebrow">DETTAGLIO</p>
        <h2>Seleziona un nodo</h2>
        <p>Vedrai valore, tipo, relazioni e fonte del dato.</p>
      </div>`;
    return;
  }
  const colors = nodePalette(node);
  const related = state.edges.filter((edge) => isVisibleEdge(edge) && (edge.source.id === node.id || edge.target.id === node.id));
  const ownership = related.filter((edge) => edge.kind === "owns");
  const family = related.filter((edge) => edge.kind === "family");
  const location = state.groupLocations.get(node.groups[0]);
  const logo = node.category === "organization" ? state.data.logos[node.id] : null;
  detailPanel.innerHTML = `
    <button class="detail-close" type="button" aria-label="Chiudi il dettaglio">×</button>
    <div class="detail-head">
      <div class="detail-kicker"><span style="background:${colors.fill}"></span>${subtypeLabels[node.subtype] || node.subtype}</div>
      ${logo ? `<div class="detail-logo" style="--logo-bg:${logo.background}">${logo.asset_path ? `<img src="${logo.asset_path}" alt="" />` : `<span>${logo.mark}</span>`}</div>` : ""}
      <h2>${node.label}</h2>
      <div class="location-pill"><span></span>${location.city} · ${location.region}</div>
      <p>${node.description}</p>
    </div>
    <div class="value-card">
      <span>Valore usato nel grafo</span>
      <strong>${formatValue(node.value_eur_bn)}</strong>
      <small>${node.value_basis || "Nessuna stima disponibile per questo nodo."}</small>
    </div>
    ${ownership.length ? `<section class="detail-section"><h3>Proprietà</h3>${ownership.map((edge) => relationHtml(edge, node)).join("")}</section>` : ""}
    ${family.length ? `<section class="detail-section"><h3>Famiglia</h3>${family.map((edge) => relationHtml(edge, node)).join("")}</section>` : ""}
    <section class="detail-section">
      <h3>Fonte principale</h3>
      ${sourceLink(node.source_id)}
    </section>
  `;
}

function setToggle(button, active) {
  button.classList.toggle("active", active);
  button.setAttribute("aria-pressed", String(active));
}

canvas.addEventListener("pointerdown", (event) => {
  if (embedMode && document.documentElement.classList.contains("controls-open")) {
    document.documentElement.classList.remove("controls-open");
    embedControlsButton.setAttribute("aria-expanded", "false");
  }
  canvas.setPointerCapture(event.pointerId);
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  state.pointer = { x, y, downX: x, downY: y };
  const node = nodeAt(x, y);
  if (node) {
    state.dragNode = node;
    node.fixed = true;
  } else {
    state.panning = true;
  }
  canvas.classList.add("dragging");
});

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (state.dragNode) {
    const world = screenToWorld(x, y);
    state.dragNode.x = world.x;
    state.dragNode.y = world.y;
    state.dragNode.vx = 0;
    state.dragNode.vy = 0;
    state.alpha = Math.max(state.alpha, 0.08);
  } else if (state.panning) {
    state.camera.x += (x - state.pointer.x) / state.camera.scale;
    state.camera.y += (y - state.pointer.y) / state.camera.scale;
  } else {
    state.hover = nodeAt(x, y);
    canvas.style.cursor = state.hover ? "pointer" : "grab";
  }
  state.pointer.x = x;
  state.pointer.y = y;
});

canvas.addEventListener("pointerup", (event) => {
  const moved = Math.hypot(state.pointer.x - state.pointer.downX, state.pointer.y - state.pointer.downY) > 5;
  if (!moved) selectNode(nodeAt(state.pointer.x, state.pointer.y));
  state.dragNode = null;
  state.panning = false;
  canvas.classList.remove("dragging");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointerleave", () => {
  if (!state.dragNode && !state.panning) state.hover = null;
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const before = screenToWorld(x, y);
  const factor = Math.exp(-event.deltaY * 0.0012);
  state.camera.scale = Math.max(0.2, Math.min(3.2, state.camera.scale * factor));
  const after = screenToWorld(x, y);
  state.camera.x += after.x - before.x;
  state.camera.y += after.y - before.y;
}, { passive: false });

groupFilter.addEventListener("change", () => {
  state.selectedGroup = groupFilter.value;
  state.selected = null;
  selectNode(null);
  state.nodes.forEach((node) => { node.fixed = false; node.r = radiusFor(node); });
  state.alpha = 0.65;
  window.setTimeout(fitView, 360);
  updateStats();
});

searchInput.addEventListener("change", () => {
  const query = searchInput.value.trim().toLocaleLowerCase("it");
  const node = state.nodes.find((item) => item.label.toLocaleLowerCase("it") === query)
    || state.nodes.find((item) => item.label.toLocaleLowerCase("it").includes(query));
  if (!node) return;
  if (!isVisibleNode(node)) {
    state.selectedGroup = "all";
    groupFilter.value = "all";
    updateStats();
  }
  selectNode(node);
  state.camera.scale = Math.max(state.camera.scale, 1.05);
  state.camera.x = -node.x;
  state.camera.y = -node.y;
  if (embedMode) {
    document.documentElement.classList.remove("controls-open");
    embedControlsButton.setAttribute("aria-expanded", "false");
  }
});

embedControlsButton.addEventListener("click", () => {
  const isOpen = document.documentElement.classList.toggle("controls-open");
  embedControlsButton.setAttribute("aria-expanded", String(isOpen));
});

detailPanel.addEventListener("click", (event) => {
  if (event.target.closest(".detail-close")) selectNode(null);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !embedMode) return;
  document.documentElement.classList.remove("controls-open");
  embedControlsButton.setAttribute("aria-expanded", "false");
  if (state.selected) selectNode(null);
});

document.querySelector("#toggle-ownership").addEventListener("click", (event) => {
  state.showOwnership = !state.showOwnership;
  setToggle(event.currentTarget, state.showOwnership);
  updateStats();
});

document.querySelector("#toggle-family").addEventListener("click", (event) => {
  state.showFamily = !state.showFamily;
  setToggle(event.currentTarget, state.showFamily);
  updateStats();
});

document.querySelector("#size-value").addEventListener("click", () => {
  state.sizeByValue = true;
  document.querySelector("#size-value").classList.add("active");
  document.querySelector("#size-uniform").classList.remove("active");
  state.nodes.forEach((node) => { node.r = radiusFor(node); node.fixed = false; });
  state.alpha = 0.45;
});

document.querySelector("#size-uniform").addEventListener("click", () => {
  state.sizeByValue = false;
  document.querySelector("#size-uniform").classList.add("active");
  document.querySelector("#size-value").classList.remove("active");
  state.nodes.forEach((node) => { node.r = radiusFor(node); node.fixed = false; });
  state.alpha = 0.45;
});

document.querySelector("#reset-view").addEventListener("click", fitView);
window.addEventListener("resize", resize);

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function snapshotById(snapshotId) {
  return state.manifest.snapshots.find((snapshot) => snapshot.id === snapshotId);
}

async function loadSnapshot(snapshotId, updateUrl = true) {
  const snapshot = snapshotById(snapshotId);
  if (!snapshot) throw new Error(`Snapshot sconosciuto: ${snapshotId}`);

  snapshotSelect.disabled = true;
  loading.classList.remove("hidden");
  const loadingText = loading.querySelector("p");
  if (loadingText) loadingText.textContent = `Caricamento snapshot ${snapshot.year}…`;

  const data = await fetchJson(`../data/${snapshot.graph_path}`);
  state.currentSnapshot = snapshot.id;
  snapshotSelect.value = snapshot.id;
  const fullViewUrl = new URL("./", window.location.href);
  fullViewUrl.searchParams.set("snapshot", snapshot.id);
  embedOpenLink.href = fullViewUrl.toString();
  initializeGraph(data);
  resize();
  window.setTimeout(fitView, 480);

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("snapshot", snapshot.id);
    window.history.replaceState({}, "", url);
  }

  snapshotSelect.disabled = state.manifest.snapshots.length < 2;
  if (!state.renderStarted) {
    state.renderStarted = true;
    render();
  }
}

async function bootstrap() {
  try {
    state.manifest = await fetchJson("../data/snapshots.json");
    const snapshots = state.manifest.snapshots.slice().sort((a, b) => b.id.localeCompare(a.id));
    snapshotSelect.replaceChildren();
    snapshots.forEach((snapshot) => {
      const option = new Option(snapshot.label, snapshot.id);
      snapshotSelect.append(option);
    });

    const requested = new URL(window.location.href).searchParams.get("snapshot");
    const initial = snapshotById(requested) || snapshotById(state.manifest.default_snapshot) || snapshots[0];
    if (!initial) throw new Error("Nessuno snapshot disponibile");
    await loadSnapshot(initial.id, Boolean(requested));
  } catch (error) {
    loading.innerHTML = `<p>Impossibile caricare il dataset: ${error.message}</p>`;
    snapshotSelect.disabled = true;
  }
}

snapshotSelect.addEventListener("change", async () => {
  try {
    await loadSnapshot(snapshotSelect.value);
  } catch (error) {
    loading.innerHTML = `<p>Impossibile caricare lo snapshot: ${error.message}</p>`;
  }
});

bootstrap();
