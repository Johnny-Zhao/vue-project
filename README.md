# Vue 3 + TypeScript 中后台练手项目

这是一个偏工程化的 Vue 3 + TypeScript 中后台 Demo。  
重点不在页面数量，而在于把前端请求层、路由权限、登录鉴权、后端分层、SQLite / PostgreSQL 数据访问这些能力整理成一套比较清晰的项目结构。

当前这个项目已经不只是“前端假数据演示”了，而是包含了一个真实的 Express 后端，并且把 PostgreSQL 用户登录、JWT 鉴权、用户管理页也接了进去。

## 项目目标

这个项目主要想覆盖几条中后台里非常常见的主线：

- 前端统一请求层
- 登录、会话、JWT 鉴权
- 路由权限、菜单权限、按钮权限
- 通用查询表单、通用表格、通用实体表单
- feature-based 前端模块拆分
- Express 后端分层
- SQLite 与 PostgreSQL 两套数据链路并存

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios
- Express
- PostgreSQL
- SQLite
- bcryptjs
- Less
- ESLint
- Prettier
- Vitest
- Playwright

## 运行方式

### 1. 安装依赖

```bash
npm install
```

### 2. 配置后端环境变量

参考 [server/.env.example](server/.env.example) 新建 `server/.env`。

当前后端用到的核心变量有：

```env
PORT=3001
AUTH_JWT_SECRET=change-this-in-production
AUTH_JWT_EXPIRES_MINUTES=30

POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=vue_project
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_SCHEMA=public
POSTGRES_SSL=false
```

说明：

- `POSTGRES_DB` 默认写的是 `vue_project`
- 如果这个库不存在，需要你先在本机 PostgreSQL 里创建
- 后端启动后会自动初始化表结构，并补默认数据

### 3. 启动前后端联调

```bash
npm run dev:full
```

这个命令会同时启动：

- Vite 前端
- Express 后端

如果只想单独启动：

```bash
npm run dev
npm run server:dev
```

### 4. 构建和检查

```bash
npm run build
npm run type-check
npm run type-check:server
npm run lint
npm run test:unit
npm run test:e2e
```

## 默认账号

首次初始化 PostgreSQL 时，如果 `app_users` 表为空，后端会自动写入两条默认用户：

- `admin / 123456`
- `viewer / 123456`

对应逻辑在 [server/pg/database/postgres.ts](server/pg/database/postgres.ts)。

## 当前主要页面

- 登录页：真实调用后端 `/api/auth/login`
- 首页：任务和权限演示
- Express 接口实验页
- SQLite CRUD 演示页
- PostgreSQL CRUD 演示页
- 用户管理页
- Truck 示例页
- TypeScript 笔记页

其中“用户管理页”已经接入 PostgreSQL，并且会直接影响真实登录用户。

## 前端结构

### 1. 按职责划分

```text
src
|-- api                # 通用请求层和接口封装
|-- components         # 通用组件
|-- composables        # 跨页面复用逻辑
|-- features           # 领域模块
|-- layout             # 应用布局
|-- router             # 路由定义和守卫
|-- stores             # Pinia 实例等基础设施
|-- types              # 全局共享类型
`-- views              # 页面入口
```

### 2. 为什么这么拆

- `views`：页面入口，只负责页面编排
- `features`：收拢某个业务域自己的类型、权限、状态、逻辑
- `components`：跨业务复用的通用组件
- `api`：统一处理请求、错误、token、返回结构
- `router`：集中处理登录态和权限守卫
- `layout`：统一壳布局和导航

这样的好处是，页面本身不会越写越重，后面继续扩展功能时也更容易保持结构稳定。

## 后端结构

### 1. 目录分层

```text
server
|-- controllers   # 接收请求、组装响应
|-- services      # 业务逻辑
|-- repositories  # SQLite 数据访问
|-- pg            # PostgreSQL 相关链路
|   |-- database
|   |-- repositories
|   |-- routes
|   `-- services
|-- middleware    # 中间件
|-- routes        # 路由注册
|-- validators    # 参数校验
|-- utils         # JWT、密码、错误处理等工具
`-- types         # 后端类型定义
```

### 2. 分层职责

- `route`：定义 URL、挂载中间件
- `controller`：拿参数、调 service、返回响应
- `service`：做业务判断、权限约束、字段规则处理
- `repository`：只负责和数据库交互

这个项目里，SQLite 和 PostgreSQL 是并存的：

- SQLite 主要用于原有 tutorial task 演示链路
- PostgreSQL 主要用于新的任务演示和用户登录体系

## 后台鉴权说明

这一块是这次 README 重点补充的内容。

### 1. 现在的登录不是前端假登录

前端登录页会真实调用：

- `POST /api/auth/login`

后端会去 PostgreSQL 的 `app_users` 表查用户，而不是在前端写死账号。

相关文件：

- [src/views/Login/index.vue](src/views/Login/index.vue)
- [src/features/auth/api.ts](src/features/auth/api.ts)
- [server/routes/auth.routes.ts](server/routes/auth.routes.ts)
- [server/services/auth.service.ts](server/services/auth.service.ts)

### 2. JWT 在这个项目里的链路

登录成功后的完整链路是：

1. 前端提交用户名和密码到 `/api/auth/login`
2. 后端读取 PostgreSQL 的 `app_users`
3. 后端校验密码
4. 校验通过后，后端签发 JWT
5. 前端把 `accessToken` 持久化到 `localStorage` 或 `sessionStorage`
6. 后续请求由 [src/api/request.ts](src/api/request.ts) 自动注入 `Authorization: Bearer <token>`
7. 后端通过 `requireAuth` 中间件验证 JWT
8. 验签通过后，再去数据库查一次当前用户状态和角色

这里有一个非常重要的点：

- 后端不是“JWT 验签成功就直接信任”
- 它还会再查一次数据库

这样做的意义是：

- 如果用户被禁用，立即生效
- 如果用户角色被修改，立即生效
- 避免只靠旧 token 长时间保留过时权限

相关文件：

- [server/middleware/auth.ts](server/middleware/auth.ts)
- [server/services/auth.service.ts](server/services/auth.service.ts)
- [server/utils/jwt.ts](server/utils/jwt.ts)

### 3. `/api/auth/me` 的作用

项目里除了登录接口，还补了：

- `GET /api/auth/me`

它的作用不是“再查一次用户资料”这么简单，而是用于前端刷新页面后的登录态恢复。

现在前端启动时会：

1. 先从本地读取 session
2. 判断是否过期
3. 如果本地还有 token，再请求 `/api/auth/me`
4. 让后端重新验证当前 token 和用户状态
5. 验证失败就自动退出并跳回登录页

这比“只要本地还有 token 就认为已经登录”更真实，也更安全。

相关文件：

- [src/features/auth/store.ts](src/features/auth/store.ts)
- [src/features/auth/session.ts](src/features/auth/session.ts)
- [src/main.ts](src/main.ts)

### 4. 密码现在是怎么处理的

项目已经不再把新密码明文存进 PostgreSQL。

当前逻辑是：

- 新建用户时，密码先用 `bcryptjs` 哈希，再落库
- 修改密码时，也先哈希再落库
- 老数据如果之前是明文密码，用户首次登录成功后会自动升级成哈希

这意味着：

- 新数据是安全得多的
- 旧数据也不用手工批量迁移
- 可以平滑从“演示版”过渡到“真实版”

相关文件：

- [server/utils/password.ts](server/utils/password.ts)
- [server/services/auth.service.ts](server/services/auth.service.ts)
- [server/services/user.service.ts](server/services/user.service.ts)

### 5. 权限控制分几层

项目里的权限控制分成了 4 层：

- 路由权限
- 菜单权限
- 按钮权限
- 后端接口权限

#### 路由权限

路由通过 `meta.requiresAuth`、`meta.roles`、`meta.permissions` 控制访问。

相关文件：

- [src/router/index.ts](src/router/index.ts)
- [src/router/modules/system.ts](src/router/modules/system.ts)
- [src/router/modules/auth.ts](src/router/modules/auth.ts)

#### 菜单权限

侧边菜单不是写死的，而是根据当前用户角色和权限动态过滤。

相关文件：

- [src/layout/components/AppSidebar.vue](src/layout/components/AppSidebar.vue)
- [src/features/auth/permissions.ts](src/features/auth/permissions.ts)

#### 按钮权限

页面里的操作按钮支持通过权限进行控制，项目中提供了 `v-permission` 指令和权限判断能力。

相关文件：

- [src/features/auth/directives/permission.ts](src/features/auth/directives/permission.ts)
- [src/features/auth/usePermission.ts](src/features/auth/usePermission.ts)

#### 后端接口权限

真正重要的是，后端接口本身也做了权限保护。

例如用户管理接口：

- 路由先经过 `requireAuth`
- 再经过 `authorize({ roles: ['admin'], permissions: ['user:manage'] })`

这意味着前端就算手动构造请求，只要没有对应权限，也会被后端拦住。

相关文件：

- [server/routes/user.routes.ts](server/routes/user.routes.ts)
- [server/middleware/auth.ts](server/middleware/auth.ts)

## 用户管理链路

用户管理页的意义不只是“做个 CRUD”，而是已经接入真实后台登录体系。

它的链路是：

1. 前端页面调用 `/api/users`
2. 后端校验登录态和权限
3. service 做字段规则和业务校验
4. PostgreSQL repository 执行增删改查
5. 用户表变更后，直接影响后续登录和 JWT 鉴权结果

也就是说：

- 新增用户后，可以直接登录
- 禁用用户后，接口访问会被拦截
- 修改角色后，菜单和权限会变化

相关文件：

- [src/views/UserManagementView.vue](src/views/UserManagementView.vue)
- [src/api/users.ts](src/api/users.ts)
- [server/controllers/user.controller.ts](server/controllers/user.controller.ts)
- [server/services/user.service.ts](server/services/user.service.ts)
- [server/pg/repositories/user.repository.ts](server/pg/repositories/user.repository.ts)

## 请求层能力

核心文件是 [src/api/request.ts](src/api/request.ts)。

当前已经包含：

- 统一 `ApiResponse` 解析
- 统一错误处理
- `401` 自动退出并跳登录页
- token 自动注入
- 重复请求取消
- 手动取消请求
- mock 请求能力

这层的价值在于：页面不需要到处手写“过期了跳登录”“统一弹错”这些重复逻辑。

## 当前比较值得继续补的方向

如果要继续往真实后台靠，比较建议优先补这些：

- 用户管理的更严格约束：禁止删除自己、禁止禁用自己
- 表单校验补齐
- 用户名唯一性的前后端错误提示优化
- 刷新 token 机制
- 后端返回动态菜单 / 动态权限
- 认证和权限相关测试

## 当前状态

目前这套前后端代码已经能够覆盖：

- Vue 前端登录
- PostgreSQL 用户查询
- JWT 签发与校验
- 刷新后恢复登录态
- 后端接口权限保护
- 用户管理页联动真实登录体系

如果你后面要继续扩展 README，可以优先从“认证链路图”和“数据库表结构说明”这两块往下写，会更容易形成完整的项目文档。

## License

仅用于学习和个人项目演示。
