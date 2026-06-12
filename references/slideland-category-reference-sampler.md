# Slideland 全分类参考样本索引

日期：2026-05-24

这份索引用于补齐“每个分类找 1-2 个模板参考”的能力。它不是复制模板库，而是把公开分类页中的标题、来源链接、缩略图、中文标签和英文路由名记录下来，供后续 PPT 生成时做行业/场景/页面角色的设计检索。

## 本地文件

- 分类样本 JSON：`out/reference-corpus/meta/slideland-category-reference-samples.json`
- 分类页缓存：`out/reference-corpus/slideland-all/`
- 来源分类页：`https://www.slideland.tech/zh/category-list`

## 覆盖情况

| 分组 | 分类数 | 已覆盖分类 | 样本数 |
| --- | ---: | ---: | ---: |
| 页面角色 / Page role | 75 | 75 | 150 |
| 图表类型 / Chart type | 10 | 10 | 20 |
| 图解结构 / Diagram structure | 27 | 27 | 54 |
| 视觉气质 / Visual taste | 9 | 9 | 18 |
| 行业分类 / Industry category | 43 | 43 | 82 |
| 资料类型 / Document type | 9 | 9 | 18 |
| 合计 | 173 | 173 | 342 |

行业分类中，销售、办公业务、NFT/Web3、宇宙/空间当前来源页只有 1 个卡片，其余行业分类均记录 2 个样本。

## 样本字段

每个分类包含：

- `id`：分类路由，例如 `category/beauty`、`page/kpi`、`taste/luxury`。
- `label_zh` / `label_en`：中文显示名和英文路由名。
- `group_zh` / `group_en`：所属分组。
- `slideland_url_zh`：中文分类页。
- `samples`：1-2 个参考样本，包含标题、外部来源链接、缩略图、标签和选择理由。

## 美妆示例

`category/beauty` 被规范为“美妆/美容 / Beauty”，当前样本：

1. `SHISEIDO INTEGRATED REPORT 2025`
   - 来源：`https://corp.shiseido.com/jp/ir/library/annual/pdf/2025report_jp.pdf`
   - 标签：综合报告、美妆/美容、封面/首页、红色、高级感/奢华
2. `Kao 综合报告 2025`
   - 来源：`https://www.kao.com/content/dam/sites/kao/www-kao-com/jp/ja/corporate/investor-relations/pdf/kao-reports-fy2025-jp.pdf`
   - 标签：综合报告、美妆/美容、封面/首页、绿色

这个分类后续应触发 `beauty-warm-premium`、`consumer-brand-editorial`、`brand-world-and-business-proof` 等设计意图，而不是默认走普通财报或 SaaS 卡片模板。

## 生成链路中的使用方式

1. 材料解析阶段识别行业、资料类型、页面角色、视觉气质和图解结构。
2. 用这些信号检索 `slideland-category-reference-samples.json` 中的相关分类。
3. 只读取样本的抽象信息：标签、行业、页面意图、视觉气质、来源类型和缩略图特征。
4. LLM 根据抽象信息生成目录、页面结构、theme intent、色彩语义和 proof object 计划。
5. PPT 组装阶段使用内部模板族和用户素材生成新页面，不复用外部图片、Logo 或精确构图。
6. QA 阶段检查是否出现行业错配、页面重复、单一色彩、图像无证据角色或报告密度照搬。

## 安全边界

- 不复制外部页面版式、图片、Logo、图标或品牌资产。
- 不下载并嵌入 Slideland 缩略图或外部 PDF 图片。
- 不把参考样本当作“可套用模板”，只作为设计语法和路由证据。
- 商业外发 PPT 必须在素材、构图和文案上与参考保持明确距离。
