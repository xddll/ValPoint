# 开发规范

本项目遵循严格的开发规范，确保代码质量和可维护性。

## 核心原则

### 1. 禁止向 App.tsx 写入业务代码（最高优先级）

`App.tsx` 只允许包含：
- ✅ 全局 Provider（SupabaseProvider、ThemeProvider...）
- ✅ 路由配置（BrowserRouter / Routes / Route）
- ✅ 应用初始化

以下内容 **绝对禁止** 写入 `App.tsx`：
- ❌ 页面内容
- ❌ UI 组件
- ❌ Supabase 查询逻辑
- ❌ 自定义 Hooks
- ❌ 状态管理逻辑
- ❌ 业务流程代码

::: danger 违规处理
如果不小心写入 `App.tsx`，必须立即重构，将内容拆分到对应模块。
:::

### 2. 新功能必须自动模块化

用户提出新功能时，必须自动拆分为模块，并创建对应文件。

#### 文件组织规范

```
src/
├── pages/              # 页面组件
│   └── <Name>Page.tsx
├── components/         # 复用组件
│   └── <ComponentName>.tsx
├── hooks/              # 业务逻辑 / 状态
│   └── use<Name>.ts
├── lib/                # 工具函数
│   └── supabase/       # Supabase 交互
│       └── <resource>.ts
└── utils/              # 通用工具
    └── <name>.ts
```

::: tip 原则
优先 **创建新文件**，而不是继续扩展旧文件。
:::

### 3. React + TypeScript 强制规范

#### 组件规范

- ✅ 一律使用函数组件与 Hooks
- ✅ 所有 props、state、返回值必须有明确 TS 类型
- ❌ 禁止 `any`（除非用户明确要求，并标注 TODO）

```tsx
// ✅ 正确示例
interface ButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ text, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
};

// ❌ 错误示例
const Button = (props: any) => {  // 禁止使用 any
  return <button>{props.text}</button>;
};
```

#### 分层规范

- **UI 层与逻辑层必须分离**
- **展示组件（UI）不得包含业务逻辑**
- **业务逻辑必须放在 hooks 中（useXxx）**
- **避免在组件中写复杂逻辑，必须抽离**

```tsx
// ✅ 正确示例：逻辑分离
// hooks/useLineups.ts
export function useLineups() {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchLineups = async () => {
    setLoading(true);
    const data = await supabase.from('valorant_lineups').select('*');
    setLineups(data);
    setLoading(false);
  };
  
  return { lineups, loading, fetchLineups };
}

// components/LineupList.tsx
const LineupList: React.FC = () => {
  const { lineups, loading, fetchLineups } = useLineups();
  
  useEffect(() => {
    fetchLineups();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {lineups.map(lineup => (
        <LineupCard key={lineup.id} lineup={lineup} />
      ))}
    </div>
  );
};

// ❌ 错误示例：逻辑混在组件中
const LineupList: React.FC = () => {
  const [lineups, setLineups] = useState([]);
  
  useEffect(() => {
    // ❌ 不要在组件中直接写业务逻辑
    supabase.from('valorant_lineups').select('*').then(data => {
      setLineups(data);
    });
  }, []);
  
  return <div>...</div>;
};
```

### 4. Supabase 使用规范

#### 类型声明

表数据类型必须用 TypeScript 类型声明：

```typescript
// types/database.ts
export interface Lineup {
  id: string;
  user_id: string;
  title: string;
  map_name: string;
  agent_name: string;
  side: 'attack' | 'defense';
  stand_img?: string;
  aim_img?: string;
  land_img?: string;
  source_link?: string;
  author_name?: string;
  author_avatar?: string;
  author_uid?: string;
  created_at: string;
  updated_at: string;
}
```

#### 状态管理

所有请求必须考虑 3 种状态：

```typescript
interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// ✅ 正确示例
export function useLineups() {
  const [state, setState] = useState<DataState<Lineup[]>>({
    data: null,
    loading: false,
    error: null
  });
  
  const fetchLineups = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase
        .from('valorant_lineups')
        .select('*');
      
      if (error) throw error;
      
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  };
  
  return { ...state, fetchLineups };
}
```

#### Storage 访问

访问 Storage 时必须说明 public/private 策略：

```typescript
// ✅ 正确示例
// 上传到 public bucket
const { data, error } = await supabase.storage
  .from('public-images')  // public bucket
  .upload(`lineups/${filename}`, file);

// 获取 public URL
const { data: { publicUrl } } = supabase.storage
  .from('public-images')
  .getPublicUrl(`lineups/${filename}`);
```

#### RLS 权限

必须考虑 RLS 权限对前端的影响：

```typescript
// ✅ 正确示例：检查用户权限
const canEdit = lineup.user_id === currentUser?.id;

if (canEdit) {
  // 显示编辑按钮
}

// ❌ 错误示例：不检查权限直接操作
await supabase
  .from('valorant_lineups')
  .delete()
  .eq('id', lineup.id);  // 可能因 RLS 失败
```

## 代码风格

### 命名规范

#### 组件命名

```typescript
// ✅ PascalCase
const LineupCard: React.FC = () => { };
const EditorModal: React.FC = () => { };

// ❌ 错误
const lineupCard = () => { };
const editor_modal = () => { };
```

#### Hooks 命名

```typescript
// ✅ use + PascalCase
const useLineups = () => { };
const useValorantData = () => { };

// ❌ 错误
const getLineups = () => { };
const valorantData = () => { };
```

#### 变量命名

```typescript
// ✅ camelCase
const lineupData = [];
const isLoading = false;

// ❌ 错误
const LineupData = [];
const is_loading = false;
```

#### 常量命名

```typescript
// ✅ UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ❌ 错误
const apiBaseUrl = 'https://api.example.com';
```

### 文件命名

```
✅ 正确：
- LineupCard.tsx
- useLineups.ts
- authorFetcher.ts
- maps.ts

❌ 错误：
- lineup-card.tsx
- use_lineups.ts
- AuthorFetcher.ts
```

### 导入顺序

```typescript
// 1. React 相关
import React, { useState, useEffect } from 'react';

// 2. 第三方库
import { supabase } from '@supabase/supabase-js';
import Icon from 'lucide-react';

// 3. 本地组件
import LineupCard from './LineupCard';
import EditorModal from './EditorModal';

// 4. Hooks
import { useLineups } from '../hooks/useLineups';
import { useValorantData } from '../hooks/useValorantData';

// 5. 工具函数
import { fetchAuthorInfo } from '../utils/authorFetcher';

// 6. 类型
import type { Lineup } from '../types/database';

// 7. 样式
import './styles.css';
```

## 错误处理

### Try-Catch 规范

```typescript
// ✅ 正确示例
try {
  const result = await fetchData();
  return result;
} catch (error) {
  console.error('获取数据失败:', error);
  // 显示用户友好的错误信息
  setAlertMessage('获取数据失败，请稍后重试');
  return null;
}

// ❌ 错误示例
try {
  const result = await fetchData();
  return result;
} catch (error) {
  // 不处理错误
}
```

### 边界情况处理

```typescript
// ✅ 正确示例
function processLineup(lineup: Lineup | null) {
  if (!lineup) {
    console.warn('点位数据为空');
    return null;
  }
  
  if (!lineup.title) {
    console.warn('点位标题缺失');
    return null;
  }
  
  // 处理逻辑
  return processedData;
}

// ❌ 错误示例
function processLineup(lineup: Lineup) {
  // 不检查 null 或必需字段
  return lineup.title.toUpperCase();  // 可能报错
}
```

## 性能优化

### useMemo 和 useCallback

```typescript
// ✅ 正确使用
const filteredLineups = useMemo(() => {
  return lineups.filter(lineup => 
    lineup.map_name === selectedMap
  );
}, [lineups, selectedMap]);

const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);

// ❌ 过度使用
const name = useMemo(() => 'John', []);  // 不需要 memo
```

### 避免不必要的渲染

```typescript
// ✅ 使用 React.memo
const LineupCard = React.memo<LineupCardProps>(({ lineup }) => {
  return <div>{lineup.title}</div>;
});

// ✅ 拆分组件
const LineupList = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  return (
    <div>
      {lineups.map(lineup => (
        <LineupCard 
          key={lineup.id}
          lineup={lineup}
          isSelected={lineup.id === selectedId}
          onSelect={setSelectedId}
        />
      ))}
    </div>
  );
};
```

## 注释规范

### 函数注释

```typescript
/**
 * 获取点位列表
 * @param userId - 用户 ID
 * @param mapName - 地图名称（可选）
 * @returns 点位数组
 */
async function fetchLineups(
  userId: string, 
  mapName?: string
): Promise<Lineup[]> {
  // 实现
}
```

### 复杂逻辑注释

```typescript
// ✅ 解释为什么这么做
// 使用 1 秒防抖避免频繁调用 API
const debouncedFetch = debounce(fetchAuthorInfo, 1000);

// ❌ 注释显而易见的内容
// 设置 loading 为 true
setLoading(true);
```

### TODO 注释

```typescript
// TODO: 添加错误重试机制
// TODO: 优化图片加载性能
// FIXME: 修复在 Safari 中的显示问题
```

## Git 提交规范

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```bash
# 新功能
git commit -m "feat(author): 添加作者信息自动获取功能"

# Bug 修复
git commit -m "fix(image): 修复图片防盗链问题"

# 文档
git commit -m "docs(readme): 更新安装说明"

# 重构
git commit -m "refactor(hooks): 重构 useLineups hook"
```

## 代码审查清单

提交 PR 前检查：

- [ ] 代码符合 TypeScript 规范
- [ ] 没有 `any` 类型（除非必要）
- [ ] UI 与逻辑分离
- [ ] 错误处理完善
- [ ] 添加必要的注释
- [ ] 没有 console.log（除非必要）
- [ ] 测试通过
- [ ] 符合命名规范
- [ ] 没有向 App.tsx 写入业务代码

## 自动纠错机制

如果违反以上任一规则：
- 写进 App.tsx
- 未模块化拆分
- 使用 any
- 将 UI + 逻辑混在一起
- Supabase 使用不规范

必须立即自动重构，使代码符合规范。

## 信息不足时的行为

如果需求不够完整：

1. **提示需要进一步信息**
2. **或在最佳实践范围内合理假设，并标注：**
   ```typescript
   // 假设：用户需要按创建时间倒序排列
   const sortedLineups = lineups.sort((a, b) => 
     new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
   );
   ```

## 总结

遵守以上规范可以确保：
- ✅ 代码质量高
- ✅ 易于维护
- ✅ 团队协作顺畅
- ✅ 减少 Bug
- ✅ 提高开发效率
