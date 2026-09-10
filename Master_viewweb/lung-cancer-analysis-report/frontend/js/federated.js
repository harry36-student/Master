/* ============================================================
   federated.js — 聯邦學習面板的互動與圖表渲染邏輯
   ============================================================ */

// ============================================================
// 📊 【聯邦學習數據配置中心】 (Federated Learning Dashboard Data Center)
// 💡 您可以在這裡直接更換面板上「所有圖表與表格」的數值，存檔後重整網頁即可生效！
// ============================================================
const FEDERATED_DASHBOARD_DATA = {
    // ─── 區塊一：預設/模擬收斂曲線數值 ────────────────────────
    convergence: {
        fedprox_best:   [0.55, 0.926],   // FedProx (μ=0.01) - 最佳
        fedprox_mu_01:  [0.54, 0.895],   // FedProx (μ=0.1)
        fedprox_mu_001: [0.55, 0.902],   // FedProx (μ=0.001)
        fedavg:         [0.53, 0.882],   // FedAvg
        total_rounds:   50               // 總收斂輪數
    },

    // ─── 區塊二：不同聚合演算法與超參數 (μ) 實測效能對比 ─────────────
    // 💡 讀取自您的實測消融實驗數據
    aggregation_comparison: {
        labels: ['FedAvg (μ=0)', 'FedProx (μ=0.01)', 'FedProx (μ=0.1)', 'FedProx (μ=1.0)'],
        accuracy: [0.9842, 0.9900, 0.9911, 0.9875],
        f1_score: [0.9844, 0.9901, 0.9913, 0.9877],
        rounds: [14, 18, 20, 20],
        details: [
            { algo: "FedAvg", mu: "μ=0", rounds: 14, acc: "98.42%", f1: "98.44%" },
            { algo: "FedProx", mu: "μ=0.01", rounds: 18, acc: "99.00%", f1: "99.01%" },
            { algo: "FedProx", mu: "μ=0.1", rounds: 20, acc: "99.11%", f1: "99.13%" },
            { algo: "FedProx", mu: "μ=1.0", rounds: 20, acc: "98.75%", f1: "98.77%" }
        ]
    },

    // ─── 區塊三：主幹網路 x 聯邦算法消融實驗矩陣 ─────────────
    // 請直接填入各主幹網路對應的實驗數據字串 (會自動渲染到網頁表格中)
    ablation_matrix: [
        {
            backbone: "DenseNet121",
            centralized: "99.94% / 99.94%",
            fedavg: "96.97% / 96.93%",
            delta: "-2.97% / -3.01%"
        },
        {
            backbone: "EfficientNet-B3",
            centralized: "99.06% / 99.06%",
            fedavg: "97.49% / 97.46%",
            delta: "-1.57% / -1.60%"
        },
        {
            backbone: "MobileNetV3-Small",
            centralized: "96.78% / 96.77%",
            fedavg: "91.23% / 91.10%",
            delta: "-5.55% / -5.67%"
        }
    ],

    // ─── 區塊四：各聯邦學習主幹網路在外部測試集之類別詳細分類報告 (F1-Score) ───
    class_classification_reports: {
        densenet121: [
            { label: "Lung Adenocarcinoma (ACA - 肺腺癌)", precision: "0.9934", recall: "0.9262", f1: "0.9586", support: 325 },
            { label: "Lung Squamous Cell Carcinoma (SCC - 肺鱗狀細胞癌)", precision: "0.9373", recall: "0.9836", f1: "0.9599", support: 304 },
            { label: "Lung Benign Tissue (N - 肺良性組織)", precision: "0.9792", recall: "1.0000", f1: "0.9895", support: 329 },
            { label: "整體準確率 (Accuracy)", precision: "-", recall: "-", f1: "0.9697", support: 958, is_summary: true },
            { label: "宏平均 (Macro Avg)", precision: "0.9700", recall: "0.9699", f1: "0.9693", support: 958, is_summary: true },
            { label: "加權平均 (Weighted Avg)", precision: "0.9707", recall: "0.9697", f1: "0.9696", support: 958, is_summary: true }
        ],
        efficientnet_b3: [
            { label: "Lung Adenocarcinoma (ACA - 肺腺癌)", precision: "0.9934", recall: "0.9323", f1: "0.9619", support: 325 },
            { label: "Lung Squamous Cell Carcinoma (SCC - 肺鱗狀細胞癌)", precision: "0.9325", recall: "1.0000", f1: "0.9651", support: 304 },
            { label: "Lung Benign Tissue (N - 肺良性組織)", precision: "1.0000", recall: "0.9939", f1: "0.9970", support: 329 },
            { label: "整體準確率 (Accuracy)", precision: "-", recall: "-", f1: "0.9749", support: 958, is_summary: true },
            { label: "宏平均 (Macro Avg)", precision: "0.9753", recall: "0.9754", f1: "0.9746", support: 958, is_summary: true },
            { label: "加權平均 (Weighted Avg)", precision: "0.9764", recall: "0.9749", f1: "0.9749", support: 958, is_summary: true }
        ],
        mobilenet_v3_small: [
            { label: "Lung Adenocarcinoma (ACA - 肺腺癌)", precision: "0.8576", recall: "0.9077", f1: "0.8819", support: 325 },
            { label: "Lung Squamous Cell Carcinoma (SCC - 肺鱗狀細胞癌)", precision: "0.9014", recall: "0.8421", f1: "0.8707", support: 304 },
            { label: "Lung Benign Tissue (N - 肺良性組織)", precision: "0.9788", recall: "0.9818", f1: "0.9803", support: 329 },
            { label: "整體準確率 (Accuracy)", precision: "-", recall: "-", f1: "0.9123", support: 958, is_summary: true },
            { label: "宏平均 (Macro Avg)", precision: "0.9126", recall: "0.9105", f1: "0.9110", support: 958, is_summary: true },
            { label: "加權平均 (Weighted Avg)", precision: "0.9131", recall: "0.9123", f1: "0.9121", support: 958, is_summary: true }
        ]
    }
};

// ============================================================
// ⚙️ 核心渲染邏輯 (會自動嘗試讀取後端實測 CSV，無後端時自動回退至預設數值)
// ============================================================

window.realFederatedData = null; // 用於快取後端讀取的 CSV 實測數據

function switchTab(tabId) {
    document.getElementById('tab-clinical').classList.remove('active');
    document.getElementById('tab-federated').classList.remove('active');
    document.getElementById('tab-' + tabId).classList.add('active');

    document.getElementById('page-clinical').classList.remove('active');
    document.getElementById('page-federated').classList.remove('active');
    document.getElementById('page-' + tabId).classList.add('active');

    if (tabId === 'federated') {
        // 延遲 100ms 等 display 切換後 canvas 尺寸重新計算
        setTimeout(() => {
            if (window.convChart) {
                window.convChart.resize();
                // ✅ 無論如何，只要切換到聯邦 tab 就以當前資料重新渲染
                const select = document.getElementById('metric-select');
                updateConvergenceChart(select ? select.value : 'accuracy');
            } else {
                // Chart 從未被成功初始化（例如首次載入時 canvas 被隱藏），重新嘗試
                console.log('[switchTab] convChart not ready, re-init...');
                if (typeof initFederatedCharts === 'function') {
                    initFederatedCharts();
                }
            }
            if (window.muChart) window.muChart.resize();
        }, 100);
    }
}


// 根據起點與收斂點生成收斂對數曲線 (Fallback 使用)
function generateMockLog(start, end, rounds, applyNoise = true) {
    let data = [];
    for (let i = 0; i <= rounds; i++) {
        if (i === 0) data.push(start);
        else if (i === rounds) data.push(end);
        else {
            let progress = Math.log(i + 1) / Math.log(rounds + 1);
            let value = start + (end - start) * progress;
            let noise = applyNoise ? (Math.random() - 0.5) * 0.01 : 0; 
            data.push(parseFloat((value + noise).toFixed(3)));
        }
    }
    return data;
}

// 動態生成並渲染區塊三消融實驗矩陣表格
function renderAblationTable() {
    const tbody = document.getElementById('ablation-table-body');
    if (!tbody) return;

    tbody.innerHTML = FEDERATED_DASHBOARD_DATA.ablation_matrix.map(row => `
        <tr>
            <td><strong>${row.backbone}</strong></td>
            <td>${row.centralized}</td>
            <td class="highlight-cell">${row.fedavg}</td>
            <td style="color: #f87171; font-weight: 600;">${row.delta}</td>
        </tr>
    `).join('');
}

// 動態生成並渲染區塊二超參數消融表格
function renderAggregationTable() {
    const tbody = document.getElementById('aggregation-table-body');
    if (!tbody) return;

    tbody.innerHTML = FEDERATED_DASHBOARD_DATA.aggregation_comparison.details.map(row => `
        <tr>
            <td><strong>${row.algo}</strong></td>
            <td><code>${row.mu}</code></td>
            <td>${row.rounds}</td>
            <td class="highlight-cell" style="font-weight: 600; color: #00bcd4;">${row.acc}</td>
            <td>${row.f1}</td>
        </tr>
    `).join('');
}

// 動態生成並渲染區塊四各別主幹網路的分類報告表格
function renderClassReportTable(modelKey) {
    const tbody = document.getElementById('class-report-table-body');
    if (!tbody) return;

    const data = FEDERATED_DASHBOARD_DATA.class_classification_reports[modelKey];
    if (!data) return;

    tbody.innerHTML = data.map(row => {
        const trStyle = row.is_summary ? 'style="background-color: rgba(255,255,255,0.02); font-weight: 600;"' : '';
        const f1Style = row.is_summary ? 'color: #00bcd4; font-weight: 600;' : 'color: #38bdf8; font-weight: 600;';
        return `
            <tr ${trStyle}>
                <td><strong>${row.label}</strong></td>
                <td>${row.precision}</td>
                <td>${row.recall}</td>
                <td style="${f1Style}">${row.f1}</td>
                <td>${row.support}</td>
            </tr>
        `;
    }).join('');
}

// 更新收斂曲線圖表
function updateConvergenceChart(metric) {
    if (!window.convChart) return;

    const descEl = document.getElementById('metric-desc');
    const isLoss = metric === 'loss';

    if (window.realFederatedData) {
        // ─── 模式 A：顯示後端 CSV 實測數據 (20輪) ───
        const rounds = window.realFederatedData.rounds;
        const labels = rounds.map(r => `R${r}`);
        const densenetData = window.realFederatedData.densenet121[metric];
        const effnetData = window.realFederatedData.efficientnet_b3[metric];
        const mobilenetData = window.realFederatedData.mobilenet_v3_small[metric];

        if (descEl) {
            descEl.textContent = isLoss
                ? "展示三種骨幹網路 (DenseNet121, EfficientNet-B3, MobileNetV3-Small) 於實測聯邦學習 (FedProx) 中 20 輪的訓練損失值 (Loss) 下降過程"
                : "展示三種骨幹網路 (DenseNet121, EfficientNet-B3, MobileNetV3-Small) 於實測聯邦學習 (FedProx) 中 20 輪的收斂準確率變化";
        }

        window.convChart.data.labels = labels;
        window.convChart.data.datasets = [
            {
                label: 'DenseNet121 (實測聯邦)',
                data: densenetData,
                borderColor: '#00bcd4',
                backgroundColor: 'rgba(0, 188, 212, 0.08)',
                borderWidth: 2.5, tension: 0.3, fill: isLoss, pointRadius: 2
            },
            {
                label: 'EfficientNet-B3 (實測聯邦)',
                data: effnetData,
                borderColor: '#4ade80',
                borderWidth: 2, tension: 0.3, fill: false, pointRadius: 1
            },
            {
                label: 'MobileNetV3-Small (實測聯邦)',
                data: mobilenetData,
                borderColor: '#facc15',
                borderWidth: 2, tension: 0.3, fill: false, pointRadius: 1
            }
        ];

        // 動態計算 Y 軸範圍（根據實際資料決定）
        if (isLoss) {
            // Loss：從最高點往下，留一點上下邊距
            const allVals = [...densenetData, ...effnetData, ...mobilenetData];
            const maxVal = Math.max(...allVals);
            const minVal = Math.min(...allVals);
            const padding = (maxVal - minVal) * 0.1;
            window.convChart.options.scales.y.min = Math.max(0, parseFloat((minVal - padding).toFixed(4)));
            window.convChart.options.scales.y.max = parseFloat((maxVal + padding).toFixed(4));
        } else {
            // Accuracy：固定 0.4 ~ 1.0
            window.convChart.options.scales.y.min = 0.4;
            window.convChart.options.scales.y.max = 1.0;
        }
    } else {
        // ─── 模式 B：回退顯示預設/模擬曲線 ───
        const rounds = FEDERATED_DASHBOARD_DATA.convergence.total_rounds;
        const labels = Array.from({length: rounds + 1}, (_, i) => i % 10 === 0 ? `R${i}` : '');

        if (descEl) {
            descEl.textContent = isLoss
                ? "分析 FedProx 在不同 Proximal Term (μ) 設定下與 FedAvg 之損失值下降趨勢 (模擬)"
                : "分析 FedProx 在不同 Proximal Term (μ) 設定下與 FedAvg 之收斂效能差異";
        }

        if (isLoss) {
            // ── Loss 模式：高到低的下降曲線 (start high, end low) ──
            window.convChart.data.labels = labels;
            window.convChart.data.datasets = [
                {
                    label: 'FedProx (μ=0.01) - 最佳',
                    data: generateMockLog(0.42, 0.028, rounds),
                    borderColor: '#00bcd4',
                    backgroundColor: 'rgba(0, 188, 212, 0.08)',
                    borderWidth: 2.5, tension: 0.3, fill: true, pointRadius: 1
                },
                {
                    label: 'FedProx (μ=0.1)',
                    data: generateMockLog(0.44, 0.032, rounds),
                    borderColor: '#4ade80',
                    borderWidth: 2, tension: 0.3, fill: false, pointRadius: 0
                },
                {
                    label: 'FedProx (μ=0.001)',
                    data: generateMockLog(0.43, 0.030, rounds),
                    borderColor: '#facc15',
                    borderWidth: 2, tension: 0.3, fill: false, pointRadius: 0
                },
                {
                    label: 'FedAvg',
                    data: generateMockLog(0.45, 0.038, rounds),
                    borderColor: '#f87171',
                    borderWidth: 2, borderDash: [4, 4],
                    tension: 0.3, fill: false, pointRadius: 0
                }
            ];
            window.convChart.options.scales.y.min = 0.0;
            window.convChart.options.scales.y.max = 0.5;
        } else {
            // ── Accuracy 模式：低到高的上升曲線 ──
            window.convChart.data.labels = labels;
            window.convChart.data.datasets = [
                {
                    label: 'FedProx (μ=0.01) - 最佳',
                    data: generateMockLog(
                        FEDERATED_DASHBOARD_DATA.convergence.fedprox_best[0],
                        FEDERATED_DASHBOARD_DATA.convergence.fedprox_best[1],
                        rounds
                    ),
                    borderColor: '#00bcd4',
                    backgroundColor: 'rgba(0, 188, 212, 0.1)',
                    borderWidth: 2.5, tension: 0.3, fill: true, pointRadius: 1
                },
                {
                    label: 'FedProx (μ=0.1)',
                    data: generateMockLog(
                        FEDERATED_DASHBOARD_DATA.convergence.fedprox_mu_01[0],
                        FEDERATED_DASHBOARD_DATA.convergence.fedprox_mu_01[1],
                        rounds
                    ),
                    borderColor: '#4ade80',
                    borderWidth: 2, tension: 0.3, fill: false, pointRadius: 0
                },
                {
                    label: 'FedProx (μ=0.001)',
                    data: generateMockLog(
                        FEDERATED_DASHBOARD_DATA.convergence.fedprox_mu_001[0],
                        FEDERATED_DASHBOARD_DATA.convergence.fedprox_mu_001[1],
                        rounds
                    ),
                    borderColor: '#facc15',
                    borderWidth: 2, tension: 0.3, fill: false, pointRadius: 0
                },
                {
                    label: 'FedAvg',
                    data: generateMockLog(
                        FEDERATED_DASHBOARD_DATA.convergence.fedavg[0],
                        FEDERATED_DASHBOARD_DATA.convergence.fedavg[1],
                        rounds
                    ),
                    borderColor: '#f87171',
                    borderWidth: 2, borderDash: [4, 4],
                    tension: 0.3, fill: false, pointRadius: 0
                }
            ];
            window.convChart.options.scales.y.min = 0.4;
            window.convChart.options.scales.y.max = 1.0;
        }
    }

    // Y 軸格式化 Callback：loss 顯示小數 4 位，accuracy 顯示百分比
    window.convChart.options.scales.y.ticks = {
        callback: function(value) {
            return isLoss ? value.toFixed(3) : (value * 100).toFixed(0) + '%';
        }
    };
    // Y 軸標題
    window.convChart.options.scales.y.title = {
        display: true,
        text: isLoss ? '訓練損失值 (Loss)' : '準確率 (Accuracy)',
        color: '#94a3b8',
        font: { size: 11 }
    };

    window.convChart.update();

    // ─── 實測最終收斂數值指標動態更新 ───
    const statsEl = document.getElementById('convergence-stats');
    if (statsEl) {
        const isAcc = metric === 'accuracy';
        const labelStr = isAcc ? '最終收斂準確率' : '最終收斂損失值';
        
        if (window.realFederatedData) {
            const densenetVal = window.realFederatedData.densenet121[metric][window.realFederatedData.densenet121[metric].length - 1];
            const effnetVal = window.realFederatedData.efficientnet_b3[metric][window.realFederatedData.efficientnet_b3[metric].length - 1];
            const mobilenetVal = window.realFederatedData.mobilenet_v3_small[metric][window.realFederatedData.mobilenet_v3_small[metric].length - 1];

            const formatVal = (val) => isAcc ? `${(val * 100).toFixed(2)}%` : val.toFixed(4);

            statsEl.innerHTML = `
                <div class="stat-badge-card" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; background: rgba(0, 188, 212, 0.03); border: 1px solid rgba(0, 188, 212, 0.15); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: all 0.2s ease;">
                    <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">
                        <span style="display: inline-block; width: 6px; height: 6px; background-color: #00bcd4; border-radius: 50%;"></span>
                        DenseNet121
                    </span>
                    <span style="font-size: 9px; color: var(--text-muted); margin-bottom: 4px;">${labelStr}</span>
                    <strong style="color: #00bcd4; font-size: 16px; font-weight: 700; text-shadow: 0 0 8px rgba(0, 188, 212, 0.2);">${formatVal(densenetVal)}</strong>
                </div>
                <div class="stat-badge-card" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; background: rgba(74, 222, 128, 0.03); border: 1px solid rgba(74, 222, 128, 0.15); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: all 0.2s ease;">
                    <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">
                        <span style="display: inline-block; width: 6px; height: 6px; background-color: #4ade80; border-radius: 50%;"></span>
                        EfficientNet-B3
                    </span>
                    <span style="font-size: 9px; color: var(--text-muted); margin-bottom: 4px;">${labelStr}</span>
                    <strong style="color: #4ade80; font-size: 16px; font-weight: 700; text-shadow: 0 0 8px rgba(74, 222, 128, 0.2);">${formatVal(effnetVal)}</strong>
                </div>
                <div class="stat-badge-card" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; background: rgba(250, 204, 21, 0.03); border: 1px solid rgba(250, 204, 21, 0.15); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: all 0.2s ease;">
                    <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">
                        <span style="display: inline-block; width: 6px; height: 6px; background-color: #facc15; border-radius: 50%;"></span>
                        MobileNetV3-Small
                    </span>
                    <span style="font-size: 9px; color: var(--text-muted); margin-bottom: 4px;">${labelStr}</span>
                    <strong style="color: #facc15; font-size: 16px; font-weight: 700; text-shadow: 0 0 8px rgba(250, 204, 21, 0.2);">${formatVal(mobilenetVal)}</strong>
                </div>
            `;
        } else {
            // 模擬模式下的指標
            const labelSimStr = isAcc ? '模擬最終準確率' : '模擬最終損失值';
            statsEl.innerHTML = `
                <div class="stat-badge-card" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; background: rgba(0, 188, 212, 0.03); border: 1px solid rgba(0, 188, 212, 0.15); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: all 0.2s ease;">
                    <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">
                        <span style="display: inline-block; width: 6px; height: 6px; background-color: #00bcd4; border-radius: 50%;"></span>
                        FedProx (μ=0.01) - 最佳
                    </span>
                    <span style="font-size: 9px; color: var(--text-muted); margin-bottom: 4px;">${labelSimStr}</span>
                    <strong style="color: #00bcd4; font-size: 16px; font-weight: 700; text-shadow: 0 0 8px rgba(0, 188, 212, 0.2);">${isAcc ? '92.60%' : '0.0820'}</strong>
                </div>
                <div class="stat-badge-card" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; background: rgba(74, 222, 128, 0.03); border: 1px solid rgba(74, 222, 128, 0.15); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: all 0.2s ease;">
                    <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">
                        <span style="display: inline-block; width: 6px; height: 6px; background-color: #4ade80; border-radius: 50%;"></span>
                        FedProx (μ=0.1)
                    </span>
                    <span style="font-size: 9px; color: var(--text-muted); margin-bottom: 4px;">${labelSimStr}</span>
                    <strong style="color: #4ade80; font-size: 16px; font-weight: 700; text-shadow: 0 0 8px rgba(74, 222, 128, 0.2);">${isAcc ? '89.50%' : '0.1250'}</strong>
                </div>
                <div class="stat-badge-card" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; background: rgba(248, 113, 113, 0.03); border: 1px solid rgba(248, 113, 113, 0.15); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: all 0.2s ease;">
                    <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">
                        <span style="display: inline-block; width: 6px; height: 6px; background-color: #f87171; border-radius: 50%;"></span>
                        FedAvg
                    </span>
                    <span style="font-size: 9px; color: var(--text-muted); margin-bottom: 4px;">${labelSimStr}</span>
                    <strong style="color: #f87171; font-size: 16px; font-weight: 700; text-shadow: 0 0 8px rgba(248, 113, 113, 0.2);">${isAcc ? '88.20%' : '0.1420'}</strong>
                </div>
            `;
        }
    }
}

// 初始化圖表與表格
function initFederatedCharts() {
    // 渲染所有表格
    renderAblationTable();
    renderAggregationTable();

    // ─── 區塊四：詳細分類報告下拉選單綁定 ───
    const modelSelect = document.getElementById('model-report-select');
    if (modelSelect) {
        renderClassReportTable(modelSelect.value);
        modelSelect.addEventListener('change', (e) => {
            renderClassReportTable(e.target.value);
        });
    } else {
        renderClassReportTable('densenet121');
    }

    if (typeof Chart === 'undefined') return;

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'var(--font-family)';

    // ─── 區塊一：收斂曲線 (Convergence Chart) 初始化 ───
    const convCanvas = document.getElementById('convergenceChart');
    if (convCanvas) { 
        const ctxConv = convCanvas.getContext('2d');
        window.convChart = new Chart(ctxConv, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { 
                    y: { min: 0.4, max: 1.0, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: { 
                    legend: { position: 'top', labels: { boxWidth: 12 } } 
                }
            }
        });

        // 綁定下拉選單事件
        const select = document.getElementById('metric-select');
        if (select) {
            select.addEventListener('change', (e) => {
                updateConvergenceChart(e.target.value);
            });
        }

        // 🔥 若已預載真實資料，直接使用；否則發起 fetch
        if (window.realFederatedData) {
            console.log('[Chart] Using pre-loaded real data.');
            updateConvergenceChart(select ? select.value : 'accuracy');
        } else {
            // 嘗試從後端讀取實測 CSV（加上 cache-buster 避免瀏覽器快取舊內容）
            fetch('/api/federated/history?_t=' + Date.now())
                .then(res => {
                    if (!res.ok) throw new Error('API response error: ' + res.status);
                    return res.json();
                })
                .then(data => {
                    console.log('[Chart] ✅ Real federated CSV loaded successfully:', {
                        rounds: data.rounds.length,
                        densenet_acc_last: data.densenet121.accuracy.slice(-1)[0],
                        effnet_acc_last: data.efficientnet_b3.accuracy.slice(-1)[0],
                        mobilenet_acc_last: data.mobilenet_v3_small.accuracy.slice(-1)[0]
                    });
                    window.realFederatedData = data;
                    updateConvergenceChart(select ? select.value : 'accuracy');
                })
                .catch(err => {
                    console.warn('[Chart] ⚠️ Could not load backend CSV, falling back to mock data:', err);
                    window.realFederatedData = null;
                    updateConvergenceChart(select ? select.value : 'accuracy');
                });
        }
    }

    // ─── 區塊二：不同聚合算法與超參數效能對比 (Bar Chart) 初始化 ───
    const muCanvas = document.getElementById('muAblationChart');
    if (muCanvas) { 
        const ctxMu = muCanvas.getContext('2d');
        window.muChart = new Chart(ctxMu, {
            type: 'bar',
            data: {
                labels: FEDERATED_DASHBOARD_DATA.aggregation_comparison.labels,
                datasets: [
                    {
                        label: '外部驗證準確率 (Accuracy)',
                        data: FEDERATED_DASHBOARD_DATA.aggregation_comparison.accuracy,
                        backgroundColor: '#38bdf8' 
                    },
                    {
                        label: '平均 F1-Score',
                        data: FEDERATED_DASHBOARD_DATA.aggregation_comparison.f1_score,
                        backgroundColor: '#00bcd4' 
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { min: 0.95, max: 1.0, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: function(context) { return context.dataset.label + ': ' + (context.raw * 100).toFixed(2) + '%'; } } }
                }
            }
        });
    }
}

// ============================================================
// 🚀 非同步初始化主控制器
//    正確順序：fetch 真實資料 → 初始化圖表 → 以真實資料渲染
//    徹底消除 fetch 與 initFederatedCharts 之間的競態問題
// ============================================================

async function _federatedAsyncInit() {
    // 步驟 1：先渲染表格（不依賴 CSV 資料，立即執行）
    renderAblationTable();
    renderAggregationTable();
    renderClassReportTable('densenet121');

    // 步驟 2：向後端取得真實訓練歷史 CSV
    try {
        const res = await fetch('/api/federated/history?_t=' + Date.now());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        if (
            data && data.rounds && data.rounds.length > 0 &&
            data.densenet121 && data.densenet121.accuracy &&
            data.efficientnet_b3 && data.efficientnet_b3.accuracy &&
            data.mobilenet_v3_small && data.mobilenet_v3_small.accuracy
        ) {
            window.realFederatedData = data;
            console.log(
                '[Federated] ✅ Real CSV loaded — Rounds:', data.rounds.length,
                '| DenseNet acc R20:', (data.densenet121.accuracy.slice(-1)[0] * 100).toFixed(2) + '%',
                '| EfficientNet acc R20:', (data.efficientnet_b3.accuracy.slice(-1)[0] * 100).toFixed(2) + '%',
                '| MobileNet acc R20:', (data.mobilenet_v3_small.accuracy.slice(-1)[0] * 100).toFixed(2) + '%'
            );
        } else {
            throw new Error('API returned empty or malformed data');
        }
    } catch (err) {
        console.warn('[Federated] ⚠️ Cannot load real CSV, will use mock data:', err.message);
        window.realFederatedData = null;
    }

    // 步驟 3：初始化圖表（此時 realFederatedData 已確定）
    if (typeof initFederatedCharts === 'function') {
        initFederatedCharts();
    }
}

// 頁面就緒後立即執行非同步初始化
document.addEventListener('DOMContentLoaded', _federatedAsyncInit);