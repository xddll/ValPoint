# 快速开始

## 前置要求

- Node.js >= 18
- npm 或 pnpm
- Supabase 账号

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/your-username/valpoint.git
cd valpoint
```

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的配置：

```env
# Supabase 主库配置
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Supabase 共享库配置
VITE_SUPABASE_SHARE_URL=https://[SHARE_PROJECT_ID].supabase.co
VITE_SUPABASE_SHARE_ANON_KEY=[YOUR_SHARE_ANON_KEY]
```

::: tip 提示
你需要在 [Supabase](https://supabase.com) 创建两个项目：
- 主库：用于存储个人点位
- 共享库：用于存储共享点位
:::

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 访问应用

打开浏览器访问：`http://localhost:5173`

## 首次使用

### 游客模式

无需登录即可：
- 查看共享库中的点位
- 分享点位（生成短链接）
- 浏览地图标注

### 登录模式

登录后可以：
- 新增、编辑、删除个人点位
- 分享点位到共享库
- 从共享库复制点位到个人库
- 配置图床上传图片

## 下一步

- [个人点位库](/guide/personal-library) - 学习如何管理你的点位
- [作者信息获取](/guide/author-info) - 了解如何自动获取视频作者信息
- [图床配置](/guide/image-hosting) - 配置图床上传图片
