
let chart;

async function analyze() {
  const birthday = document.getElementById("birthday").value;
  const gender = document.getElementById("gender").value;
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const headcirc = parseFloat(document.getElementById("headcirc").value);
  const type = document.getElementById("type").value;
  const resultDiv = document.getElementById("result");

  if (!birthday) {
    alert("請輸入生日");
    return;
  }

  const today = new Date();
  const birthDate = new Date(birthday);
  const monthAge = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 30.44));
  if (monthAge < 0 || monthAge > 60) {
    alert("僅支援 0～60 月的兒童");
    return;
  }

  // 多類型支援
  const loadDataset = async (datatype, inputValue, color) => {
    const filename = `who_${gender}_${datatype}.json`;
    const res = await fetch(filename);
    const data = await res.json();
    const x = data.x;
    const percentiles = data.percentiles;

    // 找落在哪一段
    const ys = Object.fromEntries(Object.entries(percentiles).map(([key, arr]) => [key, arr[monthAge]]));
    const ordered = ["P3", "P10", "P25", "P50", "P75", "P90", "P97"];
    let percentileLabel = "未知";
    for (let i = 0; i < ordered.length - 1; i++) {
      if (inputValue >= ys[ordered[i]] && inputValue < ys[ordered[i + 1]]) {
        percentileLabel = ordered[i] + "～" + ordered[i + 1];
        break;
      }
    }
    if (inputValue < ys["P3"]) percentileLabel = "低於 P3";
    if (inputValue >= ys["P97"]) percentileLabel = "高於 P97";

    // 更新結果顯示
  const typeLabelMap = {
  height: "身高",
  weight: "體重",
  head: "頭圍",
  height_weight: "身高 + 體重"
  };

  const type = document.getElementById("type").value;
  const typeLabel = typeLabelMap[type] || "未知類型";

  resultDiv.innerHTML = `
    ✔️ 類型：${typeLabel}<br>
    ✔️ 月齡：${ageMonths} 個月<br>
    ✔️ ${typeLabel}：${value} ${unit}<br>
    ✔️ 位於：${percentile}
  `;

    // 整理圖表資料
    const datasets = ordered.map(p => ({
      label: p,
      data: x.map((val, idx) => ({x: val, y: percentiles[p][idx]})),
      fill: false,
      borderColor: color + "55",
      tension: 0.4,
      borderWidth: p === "P50" ? 2 : 1,
      pointRadius: 0,
    }));

    datasets.push({
      label: `你的資料點`,
      data: [{x: monthAge, y: inputValue}],
      borderColor: color,
      backgroundColor: color,
      pointRadius: 6,
      type: "scatter",
    });

    return {datasets, label: data.label, unit_x: data.unit_x, unit_y: data.unit_y};
  };

  resultDiv.innerHTML = ""; // 清空結果

  let allDatasets = [];
  let title = "";

  if (type === "height_weight") {
    if (isNaN(height) || isNaN(weight)) {
      alert("請輸入身高與體重");
      return;
    }
    const heightData = await loadDataset("height", height, "blue");
    const weightData = await loadDataset("weight", weight, "green");
    allDatasets = [...heightData.datasets, ...weightData.datasets];
    title = "身高＋體重曲線圖";
  } else if (type === "height") {
    if (isNaN(height)) { alert("請輸入身高"); return; }
    const heightData = await loadDataset("height", height, "blue");
    allDatasets = heightData.datasets;
    title = heightData.label;
  } else if (type === "weight") {
    if (isNaN(weight)) { alert("請輸入體重"); return; }
    const weightData = await loadDataset("weight", weight, "green");
    allDatasets = weightData.datasets;
    title = weightData.label;
  } else if (type === "head") {
    if (isNaN(headcirc)) { alert("請輸入頭圍"); return; }
    const headData = await loadDataset("headcirc", headcirc, "purple");
    allDatasets = headData.datasets;
    title = headData.label;
  }

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: { datasets: allDatasets },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: title }
      },
      scales: {
        x: { title: { display: true, text: "月齡" } },
        y: { title: { display: true, text: "數值" } }
      }
    }
  });
}
