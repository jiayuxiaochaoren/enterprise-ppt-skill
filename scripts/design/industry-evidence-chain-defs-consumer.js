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
        "coveragePolicy": {
          "requiredAll": [
            "hero-image"
          ],
          "optional": [
            "caption-bar"
          ],
          "minHits": 1
        },
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
        "coveragePolicy": {
          "requiredAll": [
            "product-matrix"
          ],
          "optional": [
            "proof-gallery",
            "caption-bar"
          ],
          "minHits": 1
        },
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
        "coveragePolicy": {
          "requiredAll": [
            "kpi-strip"
          ],
          "optional": [
            "proof-gallery",
            "caption-bar"
          ],
          "minHits": 1
        },
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
  }
};
