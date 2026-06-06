module.exports = {
  "consumer-beauty": {
    "id": "consumer-beauty",
    "label": "消费/美妆",
    "industryIds": [
      "beauty-consumer",
      "brand-retail",
      "consumer-retail"
    ],
    "avoidComponents": [
      "equipment-nameplate",
      "inspection-matrix",
      "technical-ruler",
      "patient-journey-band"
    ],
    "stages": [
      {
        "id": "visual-claim",
        "position": 1,
        "label": "视觉主张",
        "components": [
          "hero-image",
          "caption-bar"
        ],
        "proofObjects": [
          "beauty-brand-editorial-cover",
          "brand-world-and-business-proof",
          "lookbook",
          "lookbook-story",
          "lifestyle-editorial-cover"
        ],
        "routes": [
          "cover",
          "case-gallery:lookbook",
          "strategy-map:brand-world"
        ],
        "fields": [
          "visual",
          "image",
          "images",
          "lookbook",
          "brandWorld",
          "brandStory",
          "coverInsight"
        ],
        "keywords": [
          "品牌",
          "视觉",
          "场景",
          "柜台",
          "门店",
          "陈列",
          "brand",
          "visual",
          "lookbook",
          "store",
          "counter"
        ]
      },
      {
        "id": "product-experience-promise",
        "position": 2,
        "label": "产品/体验承诺",
        "components": [
          "product-matrix",
          "proof-gallery",
          "caption-bar"
        ],
        "proofObjects": [
          "product-evidence-story",
          "product-showcase",
          "product-or-place-gallery"
        ],
        "routes": [
          "product-showcase",
          "case-gallery:product",
          "gallery:product"
        ],
        "fields": [
          "product",
          "products",
          "productStory",
          "skuMatrix",
          "cards"
        ],
        "keywords": [
          "产品",
          "单品",
          "核心单品",
          "明星单品",
          "SKU",
          "质地",
          "功效",
          "体验",
          "product",
          "sku",
          "texture",
          "efficacy"
        ]
      },
      {
        "id": "user-business-evidence",
        "position": 3,
        "label": "用户/经营证据",
        "components": [
          "kpi-strip",
          "proof-gallery",
          "caption-bar"
        ],
        "proofObjects": [
          "consumer-proof-photo-grid",
          "member-growth-board",
          "member-cohort-ladder",
          "channel-efficiency-matrix",
          "monthly-pulse-trend",
          "waterfall-bridge"
        ],
        "routes": [
          "metric-comparison:member",
          "industry-chart:member",
          "industry-chart:channel",
          "industry-chart:monthly",
          "case-gallery:consumer-proof"
        ],
        "fields": [
          "metrics",
          "memberCohorts",
          "channelEfficiency",
          "mediaEfficiency",
          "monthlyPulse",
          "monthlyTrend",
          "waterfallBridge",
          "reviews",
          "sales"
        ],
        "keywords": [
          "会员",
          "复购",
          "转化",
          "渠道",
          "GMV",
          "ROAS",
          "用户",
          "经营",
          "consumer",
          "member",
          "conversion",
          "sales"
        ]
      }
    ]
  },
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
        "label": "运营/质量证据",
        "components": [
          "quality-scorecard",
          "kpi-strip",
          "proof-gallery",
          "caption-bar"
        ],
        "proofObjects": [
          "oee-board",
          "downtime-pareto",
          "site-evidence",
          "asset-readout"
        ],
        "routes": [
          "metric-comparison:oee",
          "industry-chart:downtime",
          "case-gallery:site-evidence"
        ],
        "fields": [
          "metrics",
          "oee",
          "oeeComponents",
          "downtimePareto",
          "pareto",
          "qualityScorecard",
          "inspectionRecords",
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
          "oee",
          "downtime",
          "quality"
        ]
      }
    ]
  }
};
