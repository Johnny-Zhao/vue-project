# AGENTS

本文件用于约束在这个仓库中工作的 agent 的默认协作方式。

## 项目概况

- 前端：Vue 3、TypeScript、Vite、Vue Router、Pinia、Element Plus
- 后端：`server/` 下的 Express + TypeScript
- 数据层：SQLite 演示链路 + PostgreSQL 鉴权与 CRUD 链路
- 测试：Vitest 单元测试 + Playwright E2E

## 默认目标

实现需求时，优先使用最小改动完成，并且尽量贴合当前项目结构。优先扩展现有模式，不要轻易新造一套实现方式。

## 前端结构约定

默认按下面的边界放置代码：

- `src/views`
  路由级页面入口、页面壳层、页面组合
- `src/features/<domain>`
  领域内的 API、类型、composables、schema、store 等业务代码
- `src/components`
  跨领域可复用的通用组件
- `src/composables`
  真正跨 feature 复用的逻辑
- `src/router/modules`
  路由分组与路由元信息
- `src/api`
  通用请求基础设施，不放 feature 专属接口实现

除非现有结构无法清晰表达需求，否则不要新增新的前端顶层目录。

## 前端实现规则

- 页面层布局放在 `views`，业务逻辑优先下沉到 `features/<domain>`。
- 能复用共享组件时，不要写一次性的平行组件。
- 如果需求适合，优先复用 `src/components/EntityForm.vue`、`src/components/SmartFormFields.vue`、`src/components/CrudTable.vue`。
- feature 的接口封装放在各自的 `api.ts` 中，请求基础能力统一复用 `src/api/request.ts`，包括鉴权头、去重、错误处理。
- 页面局部状态优先使用组件本地状态或 feature composable。
- 只有跨路由、长生命周期、会话级状态才优先使用 Pinia。
- 派生数据优先使用 `computed`，不要把可推导的数据再复制成一份可写状态。
- 当 Vue、Element Plus、Axios、Pinia、Vitest、Playwright 已经能满足需求时，不要引入不必要的新依赖。
- 每个方法之前需要加一段注释，注释结尾不需要标点符号。
- Less实现需要有级联，而不是一味的平铺样式，模块归模块。
- 注释用中文，文案也用中文。
- 样式使用Less。

## 路由与权限规则

- 可导航页面统一通过 `src/router/modules/*.ts` 接入，不要绕过现有路由模块模式。
- 页面需要鉴权或菜单展示时，路由元信息应保持一致，通常包括：
  - `requiresAuth`
  - `title`
  - `menu`
  - `menuOrder`
  - `roles`
  - `permissions`
- 权限判断优先复用现有 auth / permission 工具，不要到处写零散判断。
- 涉及权限的改动要按完整链路考虑：前端 session、路由守卫、后端 JWT 校验、权限判断必须保持一致。

## UI 与交互规则

- 所有异步界面都要考虑 `loading`、`empty`、`error`、提交中状态。
- 每个新页面或重要组件都要考虑移动端可用性。
- 关键操作不要只依赖 hover。
- 优先延续现有视觉和交互模式，不要引入明显割裂的新风格。

## 后端规则

如果改动涉及 `server/`，默认保持现有分层：

- `routes`
  路由注册
- `controllers`
  请求接收与响应组织
- `services`
  业务逻辑
- `repositories` 或 `pg/repositories`
  数据访问
- `middleware`
  通用请求处理
- `validators`
  参数校验

除非周边代码本来就采用更小的实现粒度，否则不要随意打乱这些分层。

## 测试与验证

根据改动选择最小但有意义的验证范围：

- `npm run type-check`
  当前端 TypeScript 或 Vue 代码变更时
- `npm run type-check:server`
  当后端 TypeScript 代码变更时
- `npm run lint`
  当代码风格或 lint 敏感文件变更时
- `npm run test:unit`
  当逻辑、composable、store、组件新增行为时
- `npm run test:e2e`
  当鉴权、路由、关键流程发生变化时
- `npm run build`
  当改动影响前后端整体构建行为时

如果某个高风险逻辑或 bug 修复没有补测试，需要说明原因。

## 仓库内 Skills

当任务匹配时，优先使用仓库内 skill：

- `$vue-feature-scaffold`
  用于新增 Vue 页面、CRUD 流程、feature 模块或需要遵循当前仓库结构的前端功能开发。
- `$frontend-code-review`
  用于代码审查，尤其检查组件约定、状态流、loading/empty/error、移动端、XSS 风险和测试覆盖。

## Agent 默认行为

- 修改前先读邻近文件，确认局部约定。
- 能从现有代码推断出来的事情，尽量直接推断，不要频繁打断用户确认。
- 路径清晰时，直接落代码，不只停留在方案层。
- 改动保持聚焦，不做无关重构。
- 保留用户已有修改，不要回滚不是自己改的内容。
