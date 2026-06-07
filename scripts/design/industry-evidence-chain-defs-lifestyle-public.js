module.exports = {
  "lifestyle-experience": {
    "id": "lifestyle-experience",
    "label": "生活方式",
    "industryIds": [
      "lifestyle-food-tourism-fashion"
    ],
    "avoidComponents": [
      "equipment-nameplate",
      "patient-journey-band"
    ],
    "stages": [
      {
        "id": "experience-claim",
        "position": 1,
        "label": "体验主张",
        "components": [
          "hero-image",
          "caption-bar"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "hero-image",
            "caption-bar"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "lifestyle-editorial-cover",
          "product-or-place-gallery"
        ],
        "routes": [
          "cover",
          "case-gallery:product-or-place"
        ],
        "fields": [
          "visual",
          "image",
          "images",
          "place",
          "product"
        ],
        "keywords": [
          "体验",
          "场景",
          "真实对象",
          "地点",
          "experience",
          "place"
        ]
      },
      {
        "id": "journey-promise",
        "position": 2,
        "label": "场景/旅程承诺",
        "components": [
          "value-chain",
          "proof-gallery",
          "caption-bar"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "value-chain",
            "proof-gallery"
          ],
          "optional": [
            "caption-bar"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "customer-journey-map",
          "experience-proof-grid"
        ],
        "routes": [
          "timeline:customer-journey",
          "case-gallery:experience"
        ],
        "fields": [
          "journeyMap",
          "route",
          "touchpoints",
          "phases",
          "steps"
        ],
        "keywords": [
          "旅程",
          "路线",
          "到访",
          "消费",
          "复游",
          "journey",
          "route"
        ]
      },
      {
        "id": "conversion-retention-evidence",
        "position": 3,
        "label": "转化/复访证据",
        "components": [
          "kpi-strip",
          "proof-gallery",
          "caption-bar"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "kpi-strip",
            "proof-gallery"
          ],
          "optional": [
            "caption-bar"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "conversion-scorecard",
          "experience-proof-grid"
        ],
        "routes": [
          "metric-comparison:conversion",
          "industry-chart:conversion"
        ],
        "fields": [
          "metrics",
          "conversion",
          "retention",
          "repeatVisit",
          "funnel"
        ],
        "keywords": [
          "转化",
          "复访",
          "到访",
          "客单",
          "conversion",
          "retention"
        ]
      }
    ]
  },
  "public-sector": {
    "id": "public-sector",
    "label": "公共部门",
    "industryIds": [
      "government-public-sector"
    ],
    "avoidComponents": [
      "product-matrix",
      "lookbook-frame"
    ],
    "stages": [
      {
        "id": "governance-claim",
        "position": 1,
        "label": "治理主张",
        "components": [
          "source-note",
          "commentary-panel"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "source-note",
            "commentary-panel"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "policy-context-board",
          "governance-operating-model"
        ],
        "routes": [
          "report-board",
          "strategy-map:governance"
        ],
        "fields": [
          "policySource",
          "policy",
          "sourceNote",
          "governanceModel"
        ],
        "keywords": [
          "治理",
          "政策",
          "公共服务",
          "园区",
          "government",
          "policy"
        ]
      },
      {
        "id": "resource-accountability-system",
        "position": 2,
        "label": "资源/责任机制",
        "components": [
          "value-chain",
          "governance-table"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "value-chain",
            "governance-table"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "resource-map",
          "governance-operating-model"
        ],
        "routes": [
          "strategy-map:resource",
          "risk-table:governance"
        ],
        "fields": [
          "resourceMap",
          "resources",
          "responsibilities",
          "owners",
          "rows"
        ],
        "keywords": [
          "资源",
          "责任",
          "机制",
          "保障",
          "resource",
          "accountability"
        ]
      },
      {
        "id": "public-result-risk-evidence",
        "position": 3,
        "label": "公共结果/风险证据",
        "components": [
          "kpi-strip",
          "risk-register",
          "source-note"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "kpi-strip",
            "risk-register",
            "source-note"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "milestone-scorecard",
          "risk-and-assurance-board"
        ],
        "routes": [
          "metric-comparison:milestone",
          "risk-table"
        ],
        "fields": [
          "metrics",
          "milestones",
          "risks",
          "riskRegister",
          "sourceNote"
        ],
        "keywords": [
          "公共成效",
          "风险",
          "里程碑",
          "保障",
          "risk",
          "milestone"
        ]
      }
    ]
  }
};
