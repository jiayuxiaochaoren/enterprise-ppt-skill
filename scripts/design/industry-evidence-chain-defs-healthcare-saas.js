module.exports = {
  "healthcare-operations": {
    "id": "healthcare-operations",
    "label": "医疗健康",
    "industryIds": ["healthcare-operations", "healthcare-wellness"],
    "avoidComponents": ["product-matrix", "equipment-nameplate", "lookbook-frame"],
    "stages": [
      {
        "id": "service-commitment",
        "position": 1,
        "label": "服务承诺",
        "components": ["patient-journey-band"],
        "coveragePolicy": {
          "requiredAll": ["patient-journey-band"],
          "minHits": 1
        },
        "proofObjects": [
          "patient-service-scorecard",
          "service-blueprint"
        ],
        "routes": [
          "metric-comparison:patient",
          "architecture:service"
        ],
        "fields": [
          "servicePromise",
          "journeyMap",
          "serviceBlueprint",
          "touchpoints",
          "metrics"
        ],
        "keywords": [
          "服务承诺",
          "患者",
          "质量",
          "安全",
          "满意",
          "patient",
          "service",
          "care"
        ]
      },
      {
        "id": "process-touchpoint",
        "position": 2,
        "label": "流程/触点",
        "components": [
          "patient-journey-band",
          "service-blueprint-lane",
          "proof-gallery",
          "caption-bar",
          "process-rail"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "service-blueprint-lane",
            "patient-journey-band",
            "proof-gallery",
            "process-rail"
          ],
          "optional": [
            "caption-bar"
          ],
          "minHits": 2,
          "coverageAliases": {"service-blueprint-lane": ["patient-journey-band"], "process-rail": ["service-blueprint-lane"]}
        },
        "proofObjects": [
          "service-blueprint",
          "quality-handoff"
        ],
        "routes": [
          "architecture:service-blueprint",
          "industry-chart:quality-handoff",
          "timeline"
        ],
        "fields": [
          "serviceBlueprint",
          "touchpoints",
          "journeyMap",
          "handoffs",
          "qualityHandoff",
          "phases",
          "steps"
        ],
        "keywords": [
          "服务蓝图",
          "患者旅程",
          "触点",
          "交接",
          "流程",
          "frontstage",
          "backstage",
          "handoff"
        ]
      },
      {
        "id": "quality-efficiency-evidence",
        "position": 3,
        "label": "质量/效率证据",
        "components": [
          "quality-scorecard",
          "risk-register"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "quality-scorecard",
            "risk-register"
          ],
          "minHits": 2,
          "coverageAliases": {"quality-scorecard": ["risk-register"], "risk-register": ["quality-scorecard"]}
        },
        "proofObjects": [
          "patient-scorecard",
          "patient-service-scorecard",
          "healthcare-quality-loop",
          "risk-governance"
        ],
        "routes": [
          "metric-comparison:patient",
          "risk-table:healthcare-quality-loop"
        ],
        "fields": [
          "metrics",
          "qualityScorecard",
          "qualityHandoff",
          "risks",
          "responsibilities",
          "rows"
        ],
        "keywords": [
          "等待时长",
          "周转",
          "不良事件",
          "质控",
          "效率",
          "SLA",
          "quality",
          "efficiency"
        ]
      }
    ]
  },
  "saas-technology": {
    "id": "saas-technology",
    "label": "SaaS/科技",
    "industryIds": [
      "saas-technology",
      "saas-ai-technology"
    ],
    "avoidComponents": [
      "product-matrix",
      "equipment-nameplate",
      "patient-journey-band",
      "lookbook-frame"
    ],
    "stages": [
      {
        "id": "platform-capability",
        "position": 1,
        "label": "平台能力",
        "components": [
          "workflow-rail"
        ],
        "coveragePolicy": {
          "requiredAll": [
            "workflow-rail"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "platform-capability-map"
        ],
        "routes": [
          "architecture:platform-capability-map",
          "architecture:automation"
        ],
        "fields": [
          "platformCapabilities",
          "capabilityMap",
          "layers",
          "architecture",
          "systemMap"
        ],
        "keywords": [
          "平台能力",
          "API",
          "集成",
          "SSO",
          "自动化",
          "platform",
          "workflow",
          "automation"
        ]
      },
      {
        "id": "workflow-implementation",
        "position": 2,
        "label": "工作流落地",
        "components": [
          "prototype-frame",
          "workflow-rail",
          "caption-bar"
        ],
        "coveragePolicy": {
          "requiredAll": ["workflow-rail"],
          "optional": ["prototype-frame", "caption-bar"],
          "minHits": 1
        },
        "proofObjects": [
          "prototype-flow",
          "automation-workflow"
        ],
        "routes": [
          "case-gallery:prototype-flow",
          "timeline:automation-workflow",
          "timeline:workflow",
          "architecture:workflow"
        ],
        "fields": [
          "workflow",
          "workflows",
          "automationWorkflow",
          "prototype",
          "prototypeFlow",
          "images",
          "visual",
          "phases",
          "steps"
        ],
        "keywords": [
          "工作流",
          "原型",
          "界面",
          "截图",
          "自动化",
          "screen",
          "prototype",
          "workflow"
        ]
      },
      {
        "id": "adoption-efficiency-evidence",
        "position": 3,
        "label": "采用/效率证据",
        "components": [
          "adoption-funnel",
          "permission-audit-tag",
          "governance-table",
          "kpi-strip"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "adoption-funnel",
            "governance-table",
            "kpi-strip"
          ],
          "optional": [
            "permission-audit-tag"
          ],
          "minHits": 2,
          "coverageAliases": {"kpi-strip": ["adoption-funnel"], "governance-table": ["permission-audit-tag"]}
        },
        "proofObjects": [
          "adoption-funnel",
          "adoption-revenue-board",
          "revenue-board",
          "saas-governance-loop"
        ],
        "routes": [
          "industry-chart:adoption-funnel",
          "metric-comparison:adoption",
          "metric-comparison:adoption-revenue-board",
          "risk-table:permission",
          "risk-table:saas-governance-loop"
        ],
        "fields": [
          "adoptionFunnel",
          "activationFunnel",
          "cohortFunnel",
          "metrics",
          "permissionGovernance",
          "rows",
          "risks"
        ],
        "keywords": [
          "采用",
          "激活",
          "留存",
          "ARR",
          "NRR",
          "权限",
          "审计",
          "效率",
          "adoption",
          "activation"
        ]
      }
    ]
  }
};
