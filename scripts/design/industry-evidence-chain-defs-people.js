module.exports = {
  "people-culture": {
    "id": "people-culture",
    "label": "人与文化",
    "industryIds": [
      "people-culture",
      "people-culture-company"
    ],
    "avoidComponents": [
      "equipment-nameplate",
      "product-matrix",
      "patient-journey-band"
    ],
    "stages": [
      {
        "id": "mission-culture-claim",
        "position": 1,
        "label": "使命/文化主张",
        "components": [
          "content-card-grid",
          "commentary-panel",
          "value-chain",
          "caption-bar"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "content-card-grid",
            "commentary-panel",
            "value-chain"
          ],
          "optional": [
            "caption-bar"
          ],
          "minHits": 2
        },
        "proofObjects": [
          "culture-cover-with-soft-geometry",
          "mission-statement-stage",
          "value-principle-cards"
        ],
        "routes": [
          "manifesto:mission",
          "manifesto:value"
        ],
        "fields": [
          "mission",
          "values",
          "culture",
          "items"
        ],
        "keywords": [
          "使命",
          "文化",
          "价值观",
          "团队主张",
          "mission",
          "values",
          "culture"
        ]
      },
      {
        "id": "behavior-team-evidence",
        "position": 2,
        "label": "行为/团队证据",
        "components": [
          "proof-gallery",
          "caption-bar"
        ],
        "coveragePolicy": {
          "requiredAll": [
            "proof-gallery"
          ],
          "optional": [
            "caption-bar"
          ],
          "minHits": 1
        },
        "proofObjects": [
          "people-proof-mosaic",
          "company-profile-proof"
        ],
        "routes": [
          "case-gallery:people-proof",
          "case-gallery:company"
        ],
        "fields": [
          "behaviors",
          "people",
          "team",
          "images",
          "visual",
          "cards"
        ],
        "keywords": [
          "行为",
          "团队",
          "授权",
          "工作场景",
          "people",
          "team",
          "behavior"
        ]
      },
      {
        "id": "organization-growth-evidence",
        "position": 3,
        "label": "组织/成长证据",
        "components": [
          "kpi-strip",
          "scorecard",
          "decision-panel",
          "contact-block",
          "source-note"
        ],
        "coveragePolicy": {
          "requiredAny": [
            "kpi-strip",
            "scorecard",
            "decision-panel",
            "contact-block"
          ],
          "optional": [
            "source-note"
          ],
          "minHits": 2
        },
        "proofObjects": [
          "company-profile-proof",
          "premium-closing-anchor"
        ],
        "routes": [
          "metric-comparison:company",
          "closing"
        ],
        "fields": [
          "metrics",
          "growth",
          "hiring",
          "companyFacts",
          "sourceNote"
        ],
        "keywords": [
          "成长",
          "招聘",
          "规模",
          "组织",
          "growth",
          "hiring"
        ]
      }
    ]
  }
};
