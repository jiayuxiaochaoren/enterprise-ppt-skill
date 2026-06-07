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
        "coveragePolicy": {
          "requiredAll": [
            "value-chain"
          ],
          "optional": [
            "workflow-rail",
            "proof-gallery",
            "caption-bar"
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
        "id": "operations-return-evidence",
        "position": 3,
        "label": "运行/收益证据",
        "components": [
          "quality-scorecard",
          "kpi-strip",
          "risk-register"
        ],
        "coveragePolicy": {
          "requiredAll": [
            "risk-register"
          ],
          "optional": [
            "quality-scorecard",
            "kpi-strip"
          ],
          "minHits": 1
        },
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
  }
};
