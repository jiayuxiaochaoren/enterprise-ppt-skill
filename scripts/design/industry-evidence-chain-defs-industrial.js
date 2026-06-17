module.exports = {
  "industrial-manufacturing": {
    "id": "industrial-manufacturing",
    "label": "工业制造",
    "industryIds": [
      "manufacturing-operations",
      "industrial-energy",
      "industrial-manufacturing"
    ],
    "avoidComponents": [
      "product-matrix",
      "lookbook-frame",
      "patient-journey-band"
    ],
    "stages": [
      {
        "id": "capability-claim",
        "position": 1,
        "label": "能力主张",
        "components": [
          "equipment-nameplate",
          "value-chain"
        ],
        "coveragePolicy": {
          "requiredAll": [
            "equipment-nameplate"
          ],
          "optional": [
            "value-chain"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "production-topology",
          "product-lineage",
          "factory-capability"
        ],
        "routes": [
          "architecture:production-topology",
          "architecture",
          "strategy-map"
        ],
        "fields": [
          "topology",
          "productionLine",
          "layers",
          "architecture",
          "systemMap",
          "capabilityMap",
          "equipment",
          "productLine"
        ],
        "keywords": [
          "能力",
          "产线",
          "设备",
          "拓扑",
          "PLC",
          "传感器",
          "工程",
          "capacity",
          "equipment",
          "topology"
        ]
      },
      {
        "id": "process-delivery-promise",
        "position": 2,
        "label": "工艺/交付承诺",
        "components": [
          "inspection-matrix",
          "value-chain",
          "proof-gallery",
          "caption-bar"
        ],
        "coveragePolicy": {
          "requiredAll": [
            "inspection-matrix"
          ],
          "optional": [
            "value-chain",
            "proof-gallery",
            "caption-bar"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "maintenance-loop",
          "closed-loop",
          "process-board",
          "inspection-matrix"
        ],
        "routes": [
          "timeline:closed-loop",
          "timeline",
          "architecture:process"
        ],
        "fields": [
          "phases",
          "loopItems",
          "maintenanceLoop",
          "inspectionMatrix",
          "actions",
          "steps",
          "process",
          "delivery"
        ],
        "keywords": [
          "工艺",
          "交付",
          "点检",
          "巡检",
          "维修闭环",
          "调试",
          "安装",
          "inspection",
          "delivery",
          "quality gate"
        ]
      },
      {
        "id": "operations-quality-evidence",
        "position": 3,
        "label": "运营/现场证据",
        "components": [
          "quality-scorecard",
          "kpi-strip",
          "proof-gallery",
          "caption-bar"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "quality-scorecard",
            "proof-gallery"
          ],
          "optional": [
            "kpi-strip",
            "caption-bar"
          ],
          "minHits": 2
        },
        "proofObjects": [
          "oee-board",
          "loss-pareto",
          "site-evidence",
          "asset-readout"
        ],
        "routes": [
          "metric-comparison:oee",
          "industry-chart:loss-pareto",
          "case-gallery:site-evidence",
          "case-gallery:evidence-board",
          "case-gallery"
        ],
        "fields": [
          "metrics",
          "oee",
          "oeeComponents",
          "downtimePareto",
          "pareto",
          "qualityScorecard",
          "inspectionRecords",
          "quality",
          "images",
          "visual"
        ],
        "keywords": [
          "OEE",
          "良率",
          "一次通过率",
          "停机",
          "MTTR",
          "MTBF",
          "质量",
          "现场",
          "现场图片",
          "图片证据",
          "oee",
          "downtime",
          "gallery",
          "quality"
        ]
      },
      {
        "id": "channel-economics-evidence",
        "position": 3,
        "label": "渠道/预算效率证据",
        "components": [
          "matrix-chart",
          "kpi-strip",
          "chart-commentary-panel"
        ],
        "coveragePolicy": {
          "requiredAll": [
            "matrix-chart"
          ],
          "optional": [
            "kpi-strip",
            "chart-commentary-panel"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "channel-efficiency-matrix",
          "quarterly-results-summary"
        ],
        "routes": [
          "industry-chart:channel-efficiency-matrix",
          "metric-comparison:quarterly-results-summary",
          "industry-chart"
        ],
        "fields": [
          "channelEfficiency",
          "mediaEfficiency",
          "scatter",
          "matrix",
          "chartSpec",
          "businessLogic"
        ],
        "keywords": [
          "渠道",
          "预算",
          "投入",
          "回收",
          "分层",
          "roi",
          "roas",
          "efficiency",
          "channel"
        ]
      }
    ]
  }
};
