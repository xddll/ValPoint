# 项目概览（中文）

- 功能模块
  - 个人库：登录后新增、编辑、删除、清空自己的点位；支持分享到共享库。
  - 共享库：查看他人分享的点位，支持复制到个人库（已在前端做防重，同一共享点位同一用户只保存一份）。
  - 地图与点位：Leaflet 地图标注站位/瞄点/落点，按地图、特工、侧翼、技能筛选与查看。
  - 分享：生成短 share_id 写入共享表；共享数据 15 天清理提示。
  - 认证：游客模式（仅查看/分享），登录模式（可增删改）。
  - 作者信息：支持从 B 站和抖音视频链接自动获取作者头像、昵称、主页链接；使用 Supabase Edge Function `get-video-author` 绕过 CORS 限制。

- 前端架构与数据流
  - 状态与逻辑：React hooks 管理（示例：`useValorantData` 拉取地图/特工，`useLineups` 获取个人库，`useSharedLineups` 获取共享库，`useShareActions` 处理分享/复制，`useLineupActions` 做 CRUD）。
  - 地图展示：`components/LeafletMap` 渲染点位与标注。
  - 列表与面板：`LeftPanel` 选择地图/筛选，`RightPanel` 管理列表与操作。
  - 模态框：预览、编辑器、查看器、删除确认、地图选择等组件。
  - 数据存储：Supabase 两套库（主库 `valorant_lineups`/`valorant_users`，共享库 `valorant_shared`），`src/supabaseClient.ts` 创建主库与共享库客户端。

- 关键数据/表
  - 个人库 `valorant_lineups`：字段含 `user_id`、地图/特工/技能信息、图片描述、`cloned_from`（来源共享点位 id）、`source_link`（视频来源链接）、`author_name`/`author_avatar`/`author_uid`（作者信息）。
  - 共享库 `valorant_shared`：字段含 `share_id`、`source_id`、与点位内容字段。前端已在保存到个人库时防重检查 `(user_id, cloned_from)`。

# 代理人与技能数据

- 数据来源：`useValorantData` 调用 `https://valorant-api.com/v1/agents?language=zh-CN&isPlayableCharacter=true`，使用返回的 `displayName`、`displayIcon`、`abilities`。
- 技能槽位：统一按 C / Q / E / X（Ability1 / Ability2 / Grenade / Ultimate）顺序展示，`abilityIndex` 对应 0/1/2/3。
- 本地覆盖：`src/data/ability_overrides.json` 以代理人中文名或英文名为键，提供技能图标与中文标题覆盖；`src/utils/abilityIcons.ts` 优先使用覆盖，再回退接口的 `displayIcon`。
- 过滤规则：被动技能（slot 为 Passive）在 `getAbilityList` 中被过滤，不参与索引与展示。
- 默认选中：特工列表按名称排序后默认选中第一个特工。

# 作者信息获取

## 功能概述
从 B 站和抖音视频链接自动解析作者信息（头像、昵称、主页链接），用于点位来源标注和跳转。

## 技术架构

### 后端 Edge Function
- **函数名**：`get-video-author`
- **部署地址**：`https://[PROJECT_ID].supabase.co/functions/v1/get-video-author`
- **认证方式**：Bearer Token（使用 `VITE_SUPABASE_ANON_KEY` 环境变量）
- **请求方法**：POST
- **请求参数**：`{ "url": "视频链接或分享文案" }`
- **响应格式**：
  ```json
  {
    "status": "success",
    "data": {
      "username": "作者昵称",
      "avatar": "头像 URL",
      "user_home_url": "主页链接",
      "is_cover": false,
      "source": "bilibili" | "douyin",
      "cover_image": "封面图（仅 B 站）"
    }
  }
  ```

### 前端实现

#### 1. API 调用层（`src/utils/authorFetcher.ts`）
- **核心函数**：`fetchAuthorInfo(sourceLink: string): Promise<AuthorInfo | null>`
- **返回类型**：
  ```typescript
  {
    name: string;           // 作者昵称
    avatar: string;         // 头像 URL
    uid?: string;           // 用户 ID（B 站为 mid，抖音为 sec_uid）
    homeUrl?: string;       // 主页链接
    coverImage?: string;    // 视频封面（仅 B 站）
    isCover?: boolean;      // 是否使用封面代替头像
    source?: 'bilibili' | 'douyin';
  }
  ```
- **用户 ID 提取逻辑**：
  - B 站：从 `user_home_url` 正则提取 `space.bilibili.com/(\d+)` 中的数字
  - 抖音：从 `user_home_url` 正则提取 `/user/(MS4wLjABAAAA[A-Za-z0-9_\-]+)`
- **错误处理**：返回 `null` 并在控制台输出错误日志

#### 2. 编辑器集成（`src/components/EditorModal.tsx`）

**自动获取机制**：
- 监听 `newLineupData.sourceLink` 变化
- 使用 `useEffect` + `setTimeout` 实现 1 秒防抖
- 仅在链接存在且 `authorName` 为空时触发
- 获取成功后自动填充 `authorName`、`authorAvatar`、`authorUid`

**手动刷新按钮**：
- 位置：点位来源链接模块右上角
- 文案：`手动刷新`（获取中显示 `获取中...`）
- 图标：`RefreshCw`（获取中旋转动画）
- 触发条件：链接不为空且未在获取中
- 点击后强制重新调用 `fetchAuthorInfo`，覆盖现有作者信息

**UI 状态显示**：
- 获取中：蓝色提示框 + 旋转图标 + "正在获取作者信息..."
- 成功：绿色提示框 + 头像 + 昵称 + 勾选图标
- 失败：无提示（静默失败，不影响用户操作）

**剪贴板填入功能**：
- 按钮：`剪贴板填入`
- 功能：读取剪贴板内容，自动提取视频链接（优先 B 站/抖音）
- 提取后清空现有作者信息，触发自动获取

#### 3. 查看器集成（`src/components/ViewerModal.tsx`）

**显示逻辑**：
- 优先使用已保存的 `authorName` 和 `authorAvatar`
- 如果未保存但有 `sourceLink`，自动调用 `fetchAuthorInfo` 获取
- 加载状态显示灰色提示框 + 旋转图标

**交互功能**：
- 有 `uid` 时：可点击跳转到作者主页（B 站或抖音）
- 无 `uid` 时：仅显示头像和昵称，不可点击
- 主页链接根据 `uid` 前缀自动判断平台：
  - `MS4` 开头 → 抖音：`https://www.douyin.com/user/{uid}`
  - 数字 → B 站：`https://space.bilibili.com/{uid}`

**样式**：
- 白色边框 + 半透明背景
- hover 时边框和文字变为红色（`#ff4655`）
- 头像圆形，5x5 尺寸

#### 4. 防盗链处理（关键）

**问题**：B 站和抖音的图片服务器开启 Referer 验证，直接加载会返回 403。

**解决方案**：所有渲染作者头像的 `<img>` 标签必须添加：
```tsx
<img 
  src={authorInfo.avatar} 
  referrerPolicy="no-referrer"  // 🔥 必须添加
  alt={authorInfo.name}
/>
```

**已应用位置**：
- `EditorModal.tsx`：作者信息成功提示框中的头像
- `ViewerModal.tsx`：作者信息按钮中的头像（两处：可点击和不可点击）

## 支持的平台与链接格式

### B 站（bilibili）
- 视频链接：`https://www.bilibili.com/video/BV...`
- 短链接：`https://b23.tv/...`
- 个人主页：`https://space.bilibili.com/123456`
- 分享文案：自动提取其中的链接

### 抖音（douyin）
- 短链接：`https://v.douyin.com/...`
- 长链接：`https://www.douyin.com/video/...`
- 分享文案：自动提取其中的链接

## 数据存储

### 数据库字段（`valorant_lineups` 表）
- `source_link`：视频来源链接（TEXT）
- `author_name`：作者昵称（TEXT）
- `author_avatar`：作者头像 URL（TEXT）
- `author_uid`：作者用户 ID（TEXT，用于拼接主页链接）

### 数据流
1. 用户输入/粘贴视频链接 → `source_link`
2. 自动/手动触发获取 → 调用 Edge Function
3. 解析成功 → 填充 `author_name`、`author_avatar`、`author_uid`
4. 保存点位 → 写入数据库
5. 查看点位 → 显示作者信息 + 主页跳转

## 环境变量配置

```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

## 错误处理与边界情况

- 链接格式错误：静默失败，不影响点位保存
- Edge Function 超时：返回 `null`，不阻塞用户操作
- 图片加载失败：建议添加 `onError` 回退到默认头像
- 无作者信息：不显示作者模块，不影响其他功能
- 重复获取：手动刷新会覆盖现有信息

# 相关代码位置

- 数据获取：`src/hooks/useValorantData.ts`（地图/特工），`src/hooks/useLineups.ts`（个人库），`src/hooks/useSharedLineups.ts`（共享库）。
- 分享/复制：`src/hooks/useShareActions.ts`（分享到共享表、复制到个人库防重）。
- 作者信息：`src/utils/authorFetcher.ts`（调用 Edge Function），`src/components/EditorModal.tsx`（自动获取与手动刷新），`src/components/ViewerModal.tsx`（显示作者信息与主页跳转）。
- 图标与文案：`src/utils/abilityIcons.ts` + `src/data/ability_overrides.json`。
- 常量：`src/constants/maps.ts`（地图翻译与自定义 URL），`src/services/tables.ts`（表名）。
- 外部抓取脚本：`scripts/fetchAbilities.cjs` 通过 `https://api.val.qq.com` 的 GraphQL 接口抓取特工技能图标/名称，生成 `src/data/ability_overrides.json`（仅本地运行脚本时生效，线上运行时仍使用仓库内的 JSON）。
