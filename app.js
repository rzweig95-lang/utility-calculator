const schedules = {
  hacp: {
    label: "HACP 2026 · Detached House · Standard",
    heating: {
      naturalGas: [68, 77, 87, 96, 106, 116, 126],
      bottledGas: [0, 0, 0, 0, 0, 0, 0],
      electric: [83, 96, 111, 125, 139, 153, 166],
      heatPump: [39, 46, 55, 62, 68, 75, 81],
      fuelOil: [0, 0, 0, 0, 0, 0, 0]
    },
    cooking: {
      naturalGas: [4, 5, 7, 10, 12, 14, 16],
      bottledGas: [0, 0, 0, 0, 0, 0, 0],
      electric: [8, 9, 13, 18, 22, 26, 29]
    },
    waterHeating: {
      naturalGas: [13, 15, 22, 29, 35, 42, 47],
      bottledGas: [0, 0, 0, 0, 0, 0, 0],
      electric: [25, 30, 38, 46, 54, 63, 70],
      fuelOil: [0, 0, 0, 0, 0, 0, 0]
    },
    otherElectric: [44, 51, 72, 92, 112, 132, 148],
    airConditioning: [5, 6, 13, 21, 28, 36, 41],
    water: [43, 46, 66, 101, 136, 172, 190],
    sewer: [63, 68, 99, 147, 194, 242, 269],
    trash: [0, 0, 0, 0, 0, 0, 0],
    range: [18, 18, 18, 18, 18, 18, 18],
    refrigerator: [19, 19, 19, 19, 19, 19, 19],
    gasCustomerCharge: [0, 0, 0, 0, 0, 0, 0]
  },
  acha: {
    label: "ACHA 2026 · Single Family Detached",
    heating: {
      naturalGas: [58, 78, 108, 132, 161, 188, 198],
      bottledGas: [125, 167, 231, 283, 346, 403, 425],
      electric: [94, 125, 172, 211, 257, 299, 317],
      heatPump: [66, 88, 120, 148, 180, 210, 222],
      fuelOil: [116, 155, 213, 262, 320, 372, 393]
    },
    cooking: {
      naturalGas: [7, 9, 10, 12, 15, 17, 20],
      bottledGas: [11, 16, 20, 25, 31, 36, 40],
      electric: [6, 8, 11, 13, 16, 18, 20]
    },
    waterHeating: {
      naturalGas: [16, 21, 25, 30, 34, 39, 44],
      bottledGas: [29, 41, 53, 65, 82, 94, 106],
      electric: [33, 44, 58, 70, 83, 97, 107],
      fuelOil: [28, 39, 50, 61, 78, 89, 100]
    },
    otherElectric: [45, 54, 68, 79, 91, 105, 114],
    airConditioning: [4, 5, 8, 12, 15, 19, 21],
    water: [23, 31, 60, 86, 111, 137, 163],
    sewer: [31, 54, 103, 152, 201, 250, 299],
    trash: [23, 23, 23, 23, 23, 23, 23],
    range: [3, 3, 3, 4, 4, 4, 4],
    refrigerator: [4, 4, 4, 4, 5, 5, 5],
    gasCustomerCharge: [24, 24, 24, 24, 24, 24, 24]
  }
};

const fuelLabels = {
  none: "Owner pays / Not applicable",
  naturalGas: "Natural gas",
  bottledGas: "Bottled gas / propane",
  electric: "Electric",
  heatPump: "Electric heat pump",
  fuelOil: "Fuel oil"
};

const selectOptions = {
  heating: ["none", "naturalGas", "bottledGas", "electric", "heatPump", "fuelOil"],
  cooking: ["none", "naturalGas", "bottledGas", "electric"],
  waterHeating: ["none", "naturalGas", "bottledGas", "electric", "fuelOil"]
};

const ids = ["authority", "bedrooms", "heating", "cooking", "waterHeating", "otherElectric", "airConditioning", "water", "sewer", "trash", "range", "refrigerator"];
const elements = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const paymentStandardFields = ["Efficiency", "One_Bedroom", "Two_Bedroom", "Three_Bedroom", "Four_Bedroom", "Five_Bedroom", "Six_Bedroom"];
const geocodeUrl = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";
const paymentLayerUrl = "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/2026_Payment_Standard_Schedule/FeatureServer/45/query";
let paymentLookup = null;
let calculation = { lines: [], total: 0 };

function currency(amount) {
  return Math.round(amount).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function populateFuelSelect(id) {
  elements[id].replaceChildren(...selectOptions[id].map(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = fuelLabels[value];
    return option;
  }));
}

function addLine(lines, label, amount) {
  if (amount > 0) lines.push({ label, amount });
}

function calculate() {
  const schedule = schedules[elements.authority.value];
  const bedroom = Number(elements.bedrooms.value);
  const lines = [];

  for (const [id, label] of [["heating", "Heating"], ["cooking", "Cooking"], ["waterHeating", "Water heating"]]) {
    const fuel = elements[id].value;
    if (fuel !== "none") addLine(lines, `${label} — ${fuelLabels[fuel]}`, schedule[id][fuel][bedroom]);
  }

  for (const [id, label] of [["otherElectric", "Other electric"], ["airConditioning", "Air conditioning"], ["water", "Water"], ["sewer", "Sewer"], ["trash", "Trash collection"], ["range", "Tenant-supplied range/microwave"], ["refrigerator", "Tenant-supplied refrigerator"]]) {
    if (elements[id].checked) addLine(lines, label, schedule[id][bedroom]);
  }

  const usesNaturalGas = ["heating", "cooking", "waterHeating"].some(id => elements[id].value === "naturalGas");
  if (usesNaturalGas) addLine(lines, "Natural gas customer charge", schedule.gasCustomerCharge[bedroom]);

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  calculation = { lines, total };
  document.getElementById("total").textContent = `$${total.toLocaleString()}`;
  document.getElementById("schedule-note").textContent = schedule.label;
  document.getElementById("breakdown").innerHTML = lines.length
    ? lines.map(line => `<div class="line"><span>${line.label}</span><strong>$${line.amount}</strong></div>`).join("")
    : "No tenant-paid utilities selected.";
  updatePaymentMath(total);
}

function pdfSafe(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(text, maxLength = 78) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= maxLength) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildPdf(textLines) {
  let y = 752;
  const commands = ["BT"];
  for (const line of textLines) {
    const size = line.size || 10;
    const leading = line.leading || size + 5;
    commands.push(`/F1 ${size} Tf`, `1 0 0 1 ${line.x || 54} ${y} Tm`, `(${pdfSafe(line.text)}) Tj`);
    y -= leading;
  }
  commands.push("ET");
  const stream = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function downloadPdf() {
  const bedroom = Number(elements.bedrooms.value);
  const bedroomLabel = bedroom === 0 ? "Efficiency" : `${bedroom} bedroom${bedroom === 1 ? "" : "s"}`;
  const address = document.getElementById("address").value.trim();
  const lines = [
    { text: "SECTION 8 RENT & UTILITY BREAKDOWN", size: 16, leading: 24 },
    { text: `Prepared: ${new Date().toLocaleDateString("en-US")}`, size: 9, leading: 18 },
    { text: "PROPERTY", size: 11, leading: 17 },
    ...wrapText(address || "Address not entered").map(text => ({ text, size: 10, leading: 14 })),
    { text: `${schedules[elements.authority.value].label} | ${bedroomLabel}`, size: 10, leading: 21 }
  ];

  if (paymentLookup) {
    const attrs = paymentLookup.attributes;
    const standard = attrs[paymentStandardFields[bedroom]];
    lines.push(
      { text: "PAYMENT STANDARD", size: 11, leading: 17 },
      { text: `${attrs.PHA_Jurisdiction || "Area"} | Tier ${attrs.F2026_PS_Tier ?? "-"}`, size: 10, leading: 14 },
      { text: `2026 payment standard: ${currency(standard)} per month`, size: 10, leading: 14 },
      { text: `Less tenant-paid utility allowance: ${currency(calculation.total)}`, size: 10, leading: 14 },
      { text: `Estimated maximum contract rent: ${currency(Math.max(0, standard - calculation.total))}`, size: 11, leading: 22 }
    );
  } else {
    lines.push({ text: "Payment standard not included - complete the address lookup to add it.", size: 9, leading: 21 });
  }

  lines.push({ text: "TENANT-PAID UTILITY ALLOWANCE", size: 11, leading: 17 });
  if (calculation.lines.length) {
    calculation.lines.forEach(item => lines.push({ text: `${item.label}: ${currency(item.amount)}`, size: 10, leading: 14 }));
  } else {
    lines.push({ text: "No tenant-paid utilities selected.", size: 10, leading: 14 });
  }
  lines.push(
    { text: `TOTAL MONTHLY UTILITY ALLOWANCE: ${currency(calculation.total)}`, size: 11, leading: 24 },
    { text: "For estimating only. Confirm the final allowance and approved rent with the housing authority.", size: 8, leading: 12 }
  );

  const url = URL.createObjectURL(buildPdf(lines));
  const link = document.createElement("a");
  const slug = (address || "utility-breakdown").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60);
  link.href = url;
  link.download = `${slug || "utility-breakdown"}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function updatePaymentMath(utilityTotal) {
  if (!paymentLookup) return;
  const standard = paymentLookup.attributes[paymentStandardFields[Number(elements.bedrooms.value)]];
  document.getElementById("result-standard").textContent = `${currency(standard)} / mo`;
  document.getElementById("math-standard").textContent = currency(standard);
  document.getElementById("math-utility").textContent = `− ${currency(utilityTotal)}`;
  document.getElementById("math-estimate").textContent = currency(Math.max(0, standard - utilityTotal));
}

function setLookupStatus(message, isError = false) {
  const status = document.getElementById("lookup-status");
  status.textContent = message;
  status.classList.toggle("error", isError);
}

async function lookupPaymentStandard() {
  const address = document.getElementById("address").value.trim();
  if (!address) {
    setLookupStatus("Enter a property address first.", true);
    return;
  }

  const button = document.getElementById("lookup");
  button.disabled = true;
  button.textContent = "Finding…";
  document.getElementById("payment-result").hidden = true;
  setLookupStatus("Matching the address…");

  try {
    const geocodeParams = new URLSearchParams({ SingleLine: address, f: "json", outFields: "Match_addr,Addr_type", maxLocations: "1" });
    const geocodeResponse = await fetch(`${geocodeUrl}?${geocodeParams}`);
    if (!geocodeResponse.ok) throw new Error("The address service did not respond.");
    const geocode = await geocodeResponse.json();
    const candidate = geocode.candidates?.[0];
    if (!candidate || candidate.score < 80) throw new Error("No confident address match was found. Include city, state, and ZIP code.");

    setLookupStatus("Checking the 2026 payment-standard area…");
    const fields = ["MUNICIPALITY", "PGHNhood", "PHA_Jurisdiction", "F2026_PS_Tier", ...paymentStandardFields].join(",");
    const queryParams = new URLSearchParams({
      f: "json",
      where: "1=1",
      geometry: `${candidate.location.x},${candidate.location.y}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: fields,
      returnGeometry: "false"
    });
    const layerResponse = await fetch(`${paymentLayerUrl}?${queryParams}`);
    if (!layerResponse.ok) throw new Error("The payment-standard map did not respond.");
    const layer = await layerResponse.json();
    const feature = layer.features?.[0];
    if (!feature) throw new Error("That address is outside the HACP/ACHA payment-standard map.");

    paymentLookup = feature;
    const attrs = feature.attributes;
    const authority = String(attrs.PHA_Jurisdiction || "").toUpperCase();
    if (authority.includes("HACP")) elements.authority.value = "hacp";
    if (authority.includes("ACHA")) elements.authority.value = "acha";

    document.getElementById("result-tier").textContent = `${attrs.PHA_Jurisdiction || "Area"} · Tier ${attrs.F2026_PS_Tier ?? "—"}`;
    document.getElementById("result-location").textContent = [candidate.address, attrs.PGHNhood || attrs.MUNICIPALITY].filter(Boolean).join(" · ");
    document.getElementById("payment-result").hidden = false;
    setLookupStatus(`Matched at ${Math.round(candidate.score)}% confidence. Housing authority updated automatically.`);
    calculate();
  } catch (error) {
    paymentLookup = null;
    setLookupStatus(error.message || "The lookup could not be completed.", true);
  } finally {
    button.disabled = false;
    button.textContent = "Look up";
  }
}

function reset() {
  elements.heating.value = "none";
  elements.cooking.value = "none";
  elements.waterHeating.value = "none";
  ["otherElectric", "airConditioning", "water", "sewer", "trash", "range", "refrigerator"].forEach(id => elements[id].checked = false);
  calculate();
}

["heating", "cooking", "waterHeating"].forEach(populateFuelSelect);
ids.forEach(id => elements[id].addEventListener("change", calculate));
document.getElementById("reset").addEventListener("click", reset);
document.getElementById("download-pdf").addEventListener("click", downloadPdf);
document.getElementById("lookup").addEventListener("click", lookupPaymentStandard);
document.getElementById("address").addEventListener("keydown", event => {
  if (event.key === "Enter") lookupPaymentStandard();
});
calculate();
