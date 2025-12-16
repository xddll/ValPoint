<div align="center" style="margin-bottom:12px;">
  <img src="../public/logo.svg" alt="ValPoint Logo" width="120">
</div>

<div align="center">
  <h1 style="font-size:3rem;font-weight:bold;margin:1.5rem 2rem 1.5rem 2rem;color:#ff4655;">VALPOINT</h1>
</div>


<div align="center" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:8px;">
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Cloud-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
</div>

::: info 说明

🎯 **ValPoint** 是一个专为 Valorant 玩家打造的点位管理与分享平台。支持多地图标注、技能点位收藏、视频来源追踪、作者信息自动获取等功能，让你的游戏技巧管理更加高效。

:::

---

## 📋 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [核心功能](#核心功能)
  - [个人点位库](#个人点位库)
  - [共享点位库](#共享点位库)
  - [作者信息自动获取](#作者信息自动获取)
  - [地图标注](#地图标注)
  - [图床配置](#图床配置)
- [项目结构](#项目结构)
- [环境变量](#环境变量)
- [部署指南](#部署指南)
- [开发指南](#开发指南)
- [常见问题](#常见问题)

---

## ✨ 功能特性

### 🎮 核心功能
- **多地图支持**：覆盖 Valorant 所有竞技地图（Ascent、Bind、Haven、Split 等）
- **点位管理**：新增、编辑、删除、批量清空个人点位
- **智能筛选**：按地图、特工、侧翼（进攻/防守）、技能类型快速筛选
- **地图标注**：使用 Leaflet 在地图上精准标注站位、瞄点、落点
- **图文攻略**：支持上传站位图、瞄点图、落点图及详细描述

### 🌐 分享与协作
- **共享库**：一键分享点位到公共库，生成短链接（15 天有效期）
- **复制到个人库**：从共享库复制他人点位，自动防重
- **视频来源追踪**：记录点位来源视频链接，支持精准空降

### 🤖 智能功能
- **作者信息自动获取**：
  - 支持 B 站和抖音视频链接
  - 自动解析作者头像、昵称、主页链接
  - 1 秒防抖 + 手动刷新机制
  - 防盗链处理，确保图片正常显示
- **剪贴板快捷操作**：
  - 一键从剪贴板上传图片到图床
  - 自动提取视频链接

### 👤 用户系统
- **游客模式**：无需登录即可查看和分享点位
- **登录模式**：完整的增删改查权限
- **Supabase Auth**：安全的用户认证系统

---

## 🛠️ 技术栈

### 前端
- **框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **样式**：Tailwind CSS 3
- **地图**：Leaflet + React-Leaflet
- **图标**：Lucide React
- **状态管理**：React Hooks

### 后端
- **数据库**：Supabase PostgreSQL
- **认证**：Supabase Auth
- **存储**：Supabase Storage
- **Edge Functions**：Supabase Functions（作者信息解析）

### 图床支持
- 阿里云 OSS
- 腾讯云 COS
- 七牛云 Kodo

---

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- npm 或 pnpm
- Supabase 账号

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/valpoint.git
cd valpoint
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
```

3. **配置环境变量**

复制 `.env.example` 为 `.env`，填入你的配置：

```env
# Supabase 主库配置
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Supabase 共享库配置
VITE_SUPABASE_SHARE_URL=https://[SHARE_PROJECT_ID].supabase.co
VITE_SUPABASE_SHARE_ANON_KEY=[YOUR_SHARE_ANON_KEY]
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
```
http://localhost:5173
```

---

## 🎯 核心功能

### 个人点位库

#### 新增点位
1. 点击右侧面板的"新增点位"按钮
2. 填写点位信息：
   - 标题（必填）
   - 选择阵营（进攻/防守）
   - 选择地图和特工
   - 上传图片（站位图、瞄点图、落点图）
   - 添加描述
   - 可选：填入视频来源链接

#### 编辑点位
- 点击点位卡片的"编辑"按钮
- 修改信息后保存

#### 删除点位
- 单个删除：点击点位卡片的"删除"按钮
- 批量清空：点击"清空所有点位"按钮

#### 筛选与查看
- 按地图筛选
- 按特工筛选
- 按侧翼筛选（进攻/防守）
- 按技能类型筛选
- 点击点位卡片查看详情

### 共享点位库

#### 分享点位
1. 在个人库中选择要分享的点位
2. 点击"分享"按钮
3. 系统生成短链接（格式：`/share/{share_id}`）
4. 分享链接有效期 15 天

#### 复制点位
1. 在共享库中浏览他人分享的点位
2. 点击"保存到我的点位"按钮
3. 系统自动防重（同一共享点位同一用户只保存一份）

### 作者信息自动获取

#### 支持的平台
- **B 站（bilibili）**
  - 视频链接：`https://www.bilibili.com/video/BV...`
  - 短链接：`https://b23.tv/...`
  - 个人主页：`https://space.bilibili.com/123456`
  
- **抖音（douyin）**
  - 短链接：`https://v.douyin.com/...`
  - 长链接：`https://www.douyin.com/video/...`

#### 使用方式

**方式 1：自动获取（推荐）**
1. 在编辑器中输入视频链接
2. 等待 1 秒，系统自动获取作者信息
3. 成功后显示作者头像和昵称

**方式 2：剪贴板填入**
1. 复制包含视频链接的分享文案
2. 点击"剪贴板填入"按钮
3. 系统自动提取链接并获取作者信息

**方式 3：手动刷新**
1. 输入或修改视频链接后
2. 点击右上角"手动刷新"按钮
3. 强制重新获取作者信息

#### 技术实现
- 使用 Supabase Edge Function `get-video-author` 绕过 CORS 限制
- 自动提取用户 ID，支持点击跳转到作者主页
- 防盗链处理：所有头像添加 `referrerPolicy="no-referrer"`

### 地图标注

#### 标注类型
- **站位点**：标记投掷技能的站位位置
- **瞄点**：标记瞄准的参照物
- **落点**：标记技能的落点位置

#### 操作方式
1. 在编辑器中点击地图图标
2. 在弹出的地图上点击标注位置
3. 系统自动记录坐标
4. 保存后在地图上显示标记

### 图床配置

#### 支持的图床
- **阿里云 OSS**
- **腾讯云 COS**
- **七牛云 Kodo**

#### 配置步骤
1. 点击右上角设置按钮
2. 选择图床类型
3. 填入对应的配置信息：
   - Access Key / Secret Key
   - Bucket 名称
   - 区域
   - 自定义域名（可选）
4. 保存配置

#### 图片上传
- 支持剪贴板直接上传
- 自动压缩和格式转换
- 上传进度提示

---

## 📁 项目结构

```
ValPoint/
├── docs/                      # 文档目录
│   ├── AGENTS.md             # 项目概览（中文）
│   ├── WIKI.md               # 用户文档
│   ├── 用户信息解析方案.md    # 作者信息获取方案
│   ├── 抖音信息解析方案.md    # 抖音解析技术文档
│   └── 图床配置项.md          # 图床配置说明
├── public/                    # 静态资源
│   ├── agents/               # 特工图标
│   ├── maps/                 # 地图图片
│   └── logo.svg              # Logo
├── src/
│   ├── components/           # React 组件
│   │   ├── EditorModal.tsx   # 编辑器模态框
│   │   ├── ViewerModal.tsx   # 查看器模态框
│   │   ├── LeafletMap.tsx    # 地图组件
│   │   ├── LeftPanel.tsx     # 左侧面板
│   │   └── RightPanel.tsx    # 右侧面板
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useValorantData.ts    # 地图/特工数据
│   │   ├── useLineups.ts         # 个人库数据
│   │   ├── useSharedLineups.ts   # 共享库数据
│   │   ├── useShareActions.ts    # 分享/复制操作
│   │   └── useLineupActions.ts   # CRUD 操作
│   ├── utils/                # 工具函数
│   │   ├── authorFetcher.ts  # 作者信息获取
│   │   ├── ossUpload.ts      # 图床上传
│   │   └── abilityIcons.ts   # 技能图标处理
│   ├── constants/            # 常量配置
│   │   └── maps.ts           # 地图配置
│   ├── data/                 # 静态数据
│   │   └── ability_overrides.json  # 技能覆盖数据
│   ├── services/             # 服务层
│   │   └── tables.ts         # 表名常量
│   ├── types/                # TypeScript 类型
│   ├── App.tsx               # 应用入口
│   └── main.tsx              # 主入口
├── supabase/                 # Supabase 配置
│   └── functions/            # Edge Functions
├── .env                      # 环境变量（不提交）
├── .env.example              # 环境变量示例
├── package.json              # 依赖配置
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 配置
└── README.md                 # 项目说明
```

---

## 🔧 环境变量

### 必需配置

```env
# Supabase 主库（个人点位）
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Supabase 共享库
VITE_SUPABASE_SHARE_URL=https://[SHARE_PROJECT_ID].supabase.co
VITE_SUPABASE_SHARE_ANON_KEY=[YOUR_SHARE_ANON_KEY]
```

### 可选配置

图床配置在应用内通过 UI 配置，不需要环境变量。

---

## 🚢 部署指南

### Vercel 部署（推荐）

1. **Fork 项目到你的 GitHub**

2. **在 Vercel 中导入项目**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 选择你的 GitHub 仓库

3. **配置环境变量**
   - 在 Vercel 项目设置中添加环境变量
   - 填入 Supabase 配置

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成

### Cloudflare Pages 部署

1. **连接 GitHub 仓库**

2. **配置构建设置**
   - Build command: `npm run build`
   - Build output directory: `dist`

3. **添加环境变量**

4. **部署**

### 自托管部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 部署 dist 目录到你的服务器
```

---

## ❓ 常见问题

### Q: 作者头像显示不出来？
**A:** 确保所有 `<img>` 标签添加了 `referrerPolicy="no-referrer"` 属性。B 站和抖音的图片有防盗链保护。

### Q: 无法获取作者信息？
**A:** 检查以下几点：
1. 视频链接格式是否正确
2. Supabase Edge Function 是否正常运行
3. 环境变量是否配置正确
4. 查看浏览器控制台的错误信息

### Q: 图片上传失败？
**A:** 检查图床配置：
1. Access Key 和 Secret Key 是否正确
2. Bucket 名称和区域是否匹配
3. 是否有上传权限
4. 网络连接是否正常

### Q: 共享链接失效？
**A:** 共享链接有效期为 15 天，过期后需要重新分享。

### Q: 如何备份我的点位数据？
**A:** 点位数据存储在 Supabase 数据库中，可以通过 Supabase Dashboard 导出数据。

### Q: 支持哪些浏览器？
**A:** 推荐使用最新版本的 Chrome、Firefox、Edge、Safari。

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- [Valorant API](https://valorant-api.com/) - 特工和地图数据
- [Supabase](https://supabase.com/) - 后端服务
- [Leaflet](https://leafletjs.com/) - 地图库
- [Lucide](https://lucide.dev/) - 图标库

---

<div align="center">
  <p>Made with ❤️ for Valorant Players</p>
  <p>⭐ 如果这个项目对你有帮助，请给个 Star！</p>
</div>
