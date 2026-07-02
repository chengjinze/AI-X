import { Conversation, Message } from "@/lib/types";

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "OpenAI 战略分析",
    lastMessage: "OpenAI的护城河体现在三个层面：模型能力、生态系统和算力基础设施...",
    mode: "strategic-analysis",
    createdAt: "2024-05-20T08:00:00Z",
    updatedAt: "2024-05-20T09:30:00Z",
    isFavorite: true,
  },
  {
    id: "conv-2",
    title: "中国新能源汽车竞争格局",
    lastMessage: "比亚迪的垂直整合策略使其在成本端形成结构性优势...",
    mode: "deep-research",
    createdAt: "2024-05-19T14:00:00Z",
    updatedAt: "2024-05-19T16:00:00Z",
    isFavorite: true,
  },
  {
    id: "conv-3",
    title: "AI Agent 商业化路径",
    lastMessage: "Agent的商业化关键不在于模型能力本身，而在于...",
    mode: "normal",
    createdAt: "2024-05-18T10:00:00Z",
    updatedAt: "2024-05-18T11:30:00Z",
    isFavorite: false,
  },
  {
    id: "conv-4",
    title: "半导体产业链风险分析",
    lastMessage: "台积电的地缘政治风险敞口分析显示...",
    mode: "strategic-analysis",
    createdAt: "2024-05-17T09:00:00Z",
    updatedAt: "2024-05-17T10:00:00Z",
    isFavorite: false,
  },
  {
    id: "conv-5",
    title: "SaaS 企业估值模型",
    lastMessage: "Rule of 40在当前宏观环境下的适用性需要重新审视...",
    mode: "deep-research",
    createdAt: "2024-05-16T16:00:00Z",
    updatedAt: "2024-05-16T17:30:00Z",
    isFavorite: false,
  },
  {
    id: "conv-6",
    title: "全球化供应链重构",
    lastMessage: "近岸外包和友岸外包正在重塑全球贸易格局...",
    mode: "normal",
    createdAt: "2024-05-15T11:00:00Z",
    updatedAt: "2024-05-15T12:00:00Z",
    isFavorite: false,
  },
  {
    id: "conv-7",
    title: "企业数字化转型 ROI",
    lastMessage: "大多数企业数字化转型失败的根本原因不是技术...",
    mode: "normal",
    createdAt: "2024-05-14T08:00:00Z",
    updatedAt: "2024-05-14T09:00:00Z",
    isFavorite: false,
  },
];

export const mockMessages: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1",
      role: "user",
      content: "分析 OpenAI 的竞争护城河和长期战略风险",
      timestamp: "2024-05-20T08:00:00Z",
    },
    {
      id: "msg-2",
      role: "agent",
      content: `## OpenAI 竞争护城河分析

### 1. 模型能力护城河（当前最强，但逐渐收窄）

**现状**：GPT-4 系列在推理、多模态、工具使用方面仍保持领先。

**关键风险**：
- 开源模型（Llama 3、Mistral）在特定基准上已接近 GPT-4 水平
- 训练方法的优势正在被行业快速复现
- 算力规模化带来的边际收益递减

**评估**：护城河强度 ↓（正在减弱）

### 2. 生态系统护城河（中期优势）

- ChatGPT 的 1 亿+ 周活用户形成数据飞轮
- Plugin / GPT Store 生态构建平台效应
- API 客户锁定效应显著（迁移成本高）

**风险**：企业客户多模型策略正在成为主流，单一供应商锁定是 CIO 避之不及的风险

### 3. 算力基础设施护城河

- 与 Microsoft 的独家合作关系提供结构性算力优势
- 自研芯片计划（如果属实）将进一步加深

**风险**：过度依赖单一云合作伙伴的战略脆弱性

### 二阶效应

OpenAI 面临的核心困境：**模型商品化的速度 > 生态护城河的构建速度**`,
      timestamp: "2024-05-20T09:30:00Z",
    },
  ],
  "conv-2": [
    {
      id: "msg-3",
      role: "user",
      content: "中国新能源汽车市场的竞争格局分析，重点关注比亚迪的战略定位",
      timestamp: "2024-05-19T14:00:00Z",
    },
    {
      id: "msg-4",
      role: "agent",
      content: `## 中国新能源汽车竞争格局

### 市场结构（2024 Q1）

| 梯队 | 玩家 | 核心优势 |
|------|------|----------|
| 第一梯队 | 比亚迪 | 垂直整合 + 规模效应 |
| 第二梯队 | 特斯拉、吉利、长安 | 品牌/技术差异化 |
| 第三梯队 | 蔚小理、小米 | 智能驾驶/互联网基因 |
| 淘汰区 | 威马、高合等 | 现金流断裂 |

### 比亚迪的战略护城河

**结构性成本优势**：
- 电池自供率 > 90%（行业唯一）
- 半导体（IGBT/SiC）自研自产
- 矿产端向上一体化（锂、钴）

**规模效应壁垒**：
- 年销量 300 万+ 带来的供应链议价权
- 研发费用摊薄优势
- 经销商网络密度

**核心风险**：
- 智能化短板 vs 华为/小鹏
- 高端化战略尚需验证
- 海外市场地缘政治风险

> 比亚迪的模式本质上是在复制丰田的精益生产 + 垂直整合，但在电动化转型中获得了时间窗口优势`,
      timestamp: "2024-05-19T16:00:00Z",
    },
  ],
};
