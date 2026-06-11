module.exports = {
  "energy-infrastructure": {
    "id": "energy-infrastructure",
    "label": "能源/站点运营",
    "industryIds": [
      "energy-utility",
      "energy-infrastructure"
    ],
    "avoidComponents": [
      "product-matrix",
      "lookbook-frame",
      "patient-journey-band"
    ],
    "stages": [
      {
        "id": "safety-stability-claim",
        "position": 1,
        "label": "安全稳定主张",
        "components": [
          "equipment-nameplate",
          "site-evidence-frame",
          "kpi-strip"
        ],
        "coveragePolicy": {
          "requiredAll": [
            "equipment-nameplate"
          ],
          "optional": [
            "site-evidence-frame",
            "kpi-strip"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "site-evidence",
          "asset-readout",
          "metric-board",
          "quarterly-results-summary",
          "energy-stage"
        ],
        "routes": [
          "case-gallery:site-evidence",
          "metric-comparison:asset"
        ],
        "fields": [
          "siteEvidence",
          "assetReadout",
          "metrics",
          "visual",
          "images"
        ],
        "keywords": [
          "安全",
          "稳定",
          "可用率",
          "站点",
          "电站",
          "充电枪",
          "在线率",
          "枪效",
          "储能",
          "SOC",
          "availability",
          "safety"
        ]
      },
      {
        "id": "engineering-dispatch-system",
        "position": 2,
        "label": "工程/调度系统",
        "components": [
          "value-chain",
          "workflow-rail"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "value-chain",
            "workflow-rail"
          ],
          "optional": [
            "value-chain",
            "workflow-rail"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "dispatch-map",
          "hub-spoke",
          "load-storage-dispatch"
        ],
        "routes": [
          "industry-chart:dispatch-map",
          "architecture:hub-spoke"
        ],
        "fields": [
          "dispatchMap",
          "siteDispatch",
          "loadStorageDispatch",
          "nodes",
          "hubs",
          "layers",
          "controlSystem"
        ],
        "keywords": [
          "调度",
          "工程",
          "PCS",
          "BMS",
          "逆变器",
          "负荷",
          "hub",
          "spoke",
          "dispatch"
        ]
      },
      {
        "id": "navigation-operating-path",
        "position": 2,
        "label": "运营路径",
        "components": [
          "navigation-sequence"
        ],
        "coveragePolicy": {
          "requiredAll": [
            "navigation-sequence"
          ],
          "optional": [],
          "minHits": 1
        },
        "proofObjects": [
          "metric-board",
          "navigation-sequence"
        ],
        "routes": [
          "chapter-divider:energy-sequence",
          "toc-clean:energy-sequence"
        ],
        "fields": [
          "items",
          "sections"
        ],
        "keywords": [
          "汇报路径",
          "运营路径",
          "接入",
          "监测",
          "闭环",
          "复盘"
        ]
      },
      {
        "id": "management-action-board",
        "position": 2,
        "label": "经营动作拆解",
        "components": [
          "content-card-grid",
          "commentary-panel"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "content-card-grid",
            "commentary-panel"
          ],
          "optional": [
            "content-card-grid",
            "commentary-panel"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "report-board"
        ],
        "routes": [
          "report-board"
        ],
        "fields": [
          "businessLogic",
          "sections",
          "cards",
          "items"
        ],
        "keywords": [
          "业务线",
          "车队",
          "聚合",
          "套餐",
          "渠道",
          "经营口径",
          "管理动作",
          "复购"
        ]
      },
      {
        "id": "operations-return-evidence",
        "position": 3,
        "label": "运行/收益证据",
        "components": [
          "kpi-strip",
          "chart-commentary-panel"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "kpi-strip",
            "chart-commentary-panel"
          ],
          "optional": [
            "kpi-strip",
            "chart-commentary-panel"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "asset-readout",
          "load-curve-band",
          "dispatch-map",
          "monthly-pulse-trend",
          "waterfall-bridge",
          "downtime-pareto",
          "channel-efficiency-matrix",
          "quarterly-results-summary"
        ],
        "routes": [
          "metric-comparison",
          "industry-chart:dispatch",
          "industry-chart:monthly-pulse-trend",
          "industry-chart:waterfall-bridge",
          "industry-chart:downtime-pareto",
          "industry-chart:channel-efficiency-matrix"
        ],
        "fields": [
          "metrics",
          "loadCurve",
          "monthlyTrend",
          "monthlyPulse",
          "waterfallBridge",
          "downtimePareto",
          "channelEfficiency",
          "revenue",
          "yield",
          "alerts",
          "risks",
          "rows"
        ],
        "keywords": [
          "运行",
          "收益",
          "收入",
          "毛利",
          "回款",
          "复购",
          "高峰排队",
          "告警",
          "充放电",
          "峰谷",
          "收益率",
          "可用率",
          "revenue",
          "alert"
        ]
      }
    ]
  }
};
