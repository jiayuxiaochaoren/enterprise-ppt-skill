module.exports = {
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
          "kpi-strip",
          "waterfall-chart",
          "source-note",
          "disclosure-footnote"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "value-chain",
            "kpi-strip",
            "waterfall-chart",
            "disclosure-footnote"
          ],
          "optional": [
            "source-note"
          ],
          "minHits": 2,
          "scoreMode": "minHits",
          "coverageAliases": {
            "chart-commentary-panel": [
              "disclosure-footnote"
            ],
            "heatmap-chart": [
              "kpi-strip"
            ]
          }
        },
        "proofObjects": [
          "financial-kpi-snapshot",
          "return-bridge",
          "valuation-sensitivity"
        ],
        "routes": [
          "finance-bridge",
          "industry-chart:valuation"
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
        "coveragePolicy": {
          "requiredAll": [
            "value-chain"
          ],
          "optional": [
            "governance-table",
            "disclosure-footnote",
            "source-note"
          ],
          "minHits": 1
        },
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
        "coveragePolicy": {
          "requiredAny": [
            "kpi-strip",
            "risk-register",
            "governance-table",
            "disclosure-footnote"
          ],
          "optional": [
            "source-note"
          ],
          "minHits": 2,
          "scoreMode": "minHits",
          "coverageAliases": {
            "chart-commentary-panel": [
              "disclosure-footnote"
            ],
            "scorecard": [
              "kpi-strip"
            ]
          }
        },
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
