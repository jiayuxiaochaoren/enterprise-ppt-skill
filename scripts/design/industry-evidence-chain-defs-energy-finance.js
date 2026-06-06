module.exports = {
  "energy-infrastructure": {
    "id": "energy-infrastructure",
    "label": "能源基建",
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
        "proofObjects": [
          "site-evidence",
          "asset-readout",
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
          "workflow-rail",
          "proof-gallery",
          "caption-bar"
        ],
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
        "id": "operations-return-evidence",
        "position": 3,
        "label": "运行/收益证据",
        "components": [
          "quality-scorecard",
          "kpi-strip",
          "risk-register"
        ],
        "proofObjects": [
          "asset-readout",
          "load-curve-band",
          "dispatch-map"
        ],
        "routes": [
          "metric-comparison",
          "industry-chart:dispatch"
        ],
        "fields": [
          "metrics",
          "loadCurve",
          "monthlyTrend",
          "revenue",
          "yield",
          "alerts",
          "risks",
          "rows"
        ],
        "keywords": [
          "运行",
          "收益",
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
  },
  "finance-investment": {
    "id": "finance-investment",
    "label": "金融投资",
    "industryIds": [
      "finance-investment",
      "financial-results"
    ],
    "avoidComponents": [
      "product-matrix",
      "lookbook-frame",
      "equipment-nameplate",
      "patient-journey-band"
    ],
    "stages": [
      {
        "id": "judgment-framework",
        "position": 1,
        "label": "判断框架",
        "components": [
          "value-chain",
          "source-note",
          "disclosure-footnote"
        ],
        "proofObjects": [
          "financial-kpi-snapshot",
          "return-bridge",
          "valuation-sensitivity"
        ],
        "routes": [
          "finance-bridge",
          "industry-chart:valuation",
          "metric-comparison:financial"
        ],
        "fields": [
          "investmentThesis",
          "assumptions",
          "valuationSensitivity",
          "scenario",
          "bridge",
          "chartSpec"
        ],
        "keywords": [
          "判断",
          "假设",
          "口径",
          "估值",
          "投资假设",
          "框架",
          "valuation",
          "thesis",
          "assumption"
        ]
      },
      {
        "id": "asset-portfolio-logic",
        "position": 2,
        "label": "资产/组合逻辑",
        "components": [
          "value-chain",
          "governance-table",
          "source-note",
          "disclosure-footnote"
        ],
        "proofObjects": [
          "portfolio-action-table",
          "portfolio-table",
          "financial-waterfall"
        ],
        "routes": [
          "portfolio-table",
          "finance-bridge",
          "risk-table:governance"
        ],
        "fields": [
          "portfolio",
          "holdings",
          "allocation",
          "valueChain",
          "bridge",
          "capitalBridge",
          "rows"
        ],
        "keywords": [
          "组合",
          "资产",
          "配置",
          "价值桥",
          "投后",
          "项目池",
          "portfolio",
          "allocation"
        ]
      },
      {
        "id": "return-risk-evidence",
        "position": 3,
        "label": "收益/风险证据",
        "components": [
          "kpi-strip",
          "risk-register",
          "governance-table",
          "source-note",
          "disclosure-footnote"
        ],
        "proofObjects": [
          "risk-matrix",
          "guidance-and-risk-board",
          "valuation-sensitivity"
        ],
        "routes": [
          "risk-table",
          "metric-comparison",
          "industry-chart:valuation"
        ],
        "fields": [
          "metrics",
          "risks",
          "riskRegister",
          "riskMatrix",
          "matrix",
          "sourceNote",
          "proof.sourceNote",
          "returns"
        ],
        "keywords": [
          "IRR",
          "DPI",
          "MOIC",
          "NAV",
          "收益",
          "风险",
          "敏感性",
          "披露",
          "risk",
          "return"
        ]
      }
    ]
  }
};
