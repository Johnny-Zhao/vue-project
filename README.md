# Vue 3 + TypeScript 中后台 Demo

这是一个偏工程化的 Vue 3 + TypeScript 中后台练手项目，重点不在页面数量，而在项目结构、通用能力抽象和可扩展性。

这个项目当前主要覆盖了几条中后台里最常见、也最容易在面试中被追问的主线：

- 请求层设计
- 登录鉴权
- 路由权限、菜单权限、按钮权限
- 多环境配置
- 通用查询表单、通用实体表单、通用表格
- feature-based 模块拆分

## 一、项目目标

这个项目不是单纯做几个页面，而是希望把 Vue 3 + TypeScript 落到真实工程问题里。

核心目标有三个：

- 用 TypeScript 解决真实项目中的状态、接口、表单、权限问题
- 把中后台常见能力做成可复用、可扩展的结构
- 形成一套后续还能继续演进的项目骨架

## 二、技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios
- Less
- ESLint
- Prettier
- Vitest
- Playwright

## 三、当前已实现能力

### 1. 请求层

核心文件：[src/api/request.ts](src/api/request.ts)

当前已经具备：

- 统一返回结构处理
- 统一错误兜底
- `401` 自动退出并跳登录
- `403` 统一无权限提示
- `5xx` 和网络异常统一提示
- token 自动注入
- 重复请求取消
- 请求取消能力
- mock 请求能力，方便演示假登录和本地联调

### 2. 登录与鉴权

核心目录：[src/features/auth](src/features/auth)

当前已经具备：

- 登录态持久化
- `localStorage / sessionStorage` 区分记住登录与会话登录
- session 过期判断
- 登出清理
- 假登录接口

演示账号：

- `admin / 123456`
- `viewer / 123456`
- `forbidden / 123456`

### 3. 权限系统

当前已经覆盖：

- 路由权限
- 菜单权限
- 按钮权限
- 403 兜底页

具体做法：

- 路由通过 `meta.requiresAuth / meta.roles / meta.permissions` 控制访问
- 菜单根据当前角色动态过滤
- 按钮权限支持 `v-permission`
- 逻辑层权限判断支持 `usePermission()`

效果：

- `admin` 可以看到完整菜单和操作按钮
- `viewer` 只能看到受限菜单，页面内操作以只读为主
- 直接输入无权限 URL 会进入 403 页面

### 4. 多环境配置

当前已经支持：

- `.env.development`
- `.env.test`
- `.env.production`

主要环境变量：

- `VITE_APP_TITLE`
- `VITE_API_BASE_URL`
- `VITE_TRUCK_API_BASE_URL`
- `VITE_TRUCK_API_TARGET`
- `VITE_ENABLE_DEVTOOLS`

常用命令：

- `npm run dev`
- `npm run dev:test`
- `npm run dev:prod`
- `npm run build`
- `npm run build:test`
- `npm run build:prod`

### 5. 通用组件层

核心目录：[src/components](src/components)

当前抽出的能力：

- [QueryFilterForm.vue](src/components/QueryFilterForm.vue)：查询条件表单
- [EntityForm.vue](src/components/EntityForm.vue)：新增、编辑类表单
- [SmartFormFields.vue](src/components/SmartFormFields.vue)：底层字段渲染
- [CrudTable.vue](src/components/CrudTable.vue)：表格、分页、排序、批量操作
- [formSchemas.ts](src/components/formSchemas.ts)：表单和表格 schema 类型定义

这些通用组件已经在真实页面中使用，不只是演示组件。

### 6. feature 化任务模块

核心目录：[src/features/task](src/features/task)

当前包含：

- `api.ts`
- `constants.ts`
- `formSchema.ts`
- `types.ts`
- `utils.ts`
- `components/`
- `composables/`
- `store/`

好处：

- 任务相关逻辑集中
- 页面层更薄
- 规则、状态、表单、交互更容易复用

### 7. 路由模块化

当前路由已经拆成模块：

- [src/router/modules/auth.ts](src/router/modules/auth.ts)
- [src/router/modules/task.ts](src/router/modules/task.ts)
- [src/router/modules/system.ts](src/router/modules/system.ts)
- [src/router/modules/truck.ts](src/router/modules/truck.ts)

[src/router/index.ts](src/router/index.ts) 主要只负责：

- 汇总路由
- 全局守卫
- 登录态和权限判断

## 四、当前架构

### 1. 目录结构

```text
src
|-- api
|   |-- request.ts
|   `-- truck.ts
|-- components
|   |-- CrudTable.vue
|   |-- EntityForm.vue
|   |-- QueryFilterForm.vue
|   |-- SmartFormFields.vue
|   `-- formSchemas.ts
|-- composables
|   |-- usePagination.ts
|   |-- useRequest.ts
|   `-- useTaskSearch.ts
|-- features
|   |-- auth
|   |   |-- directives/permission.ts
|   |   |-- api.ts
|   |   |-- permissions.ts
|   |   |-- session.ts
|   |   |-- store.ts
|   |   |-- types.ts
|   |   `-- usePermission.ts
|   `-- task
|       |-- components/
|       |-- composables/
|       |-- store/
|       |-- constants.ts
|       |-- formSchema.ts
|       |-- types.ts
|       `-- utils.ts
|-- router
|   |-- modules/
|   `-- index.ts
|-- stores
|   `-- pinia.ts
|-- types
|   |-- request.ts
|   |-- router.d.ts
|   `-- truck.ts
`-- views
    |-- Login/
    |-- AboutView.vue
    |-- ForbiddenView.vue
    |-- HomeView.vue
    |-- TaskCreateView.vue
    `-- TruckListView.vue
```

### 2. 分层说明

这个项目大致分成 5 层：

1. `views`

- 页面入口层
- 负责页面编排
- 尽量少放重业务逻辑

2. `features`

- 领域模块层
- 把某个业务域需要的类型、状态、规则、逻辑、组件收拢在一起

3. `components`

- 通用组件层
- 负责跨业务复用

4. `api`

- 请求基础设施层
- 统一处理请求、错误、token、返回结构

5. `router / stores / types`

- 应用基础设施层
- 负责路由、根状态和共享类型

## 五、这个项目解决了哪些问题

### 1. 解决了页面和业务逻辑耦合的问题

很多早期项目都会出现：

- 页面和业务逻辑写在一起
- 表单越写越重复
- 请求逻辑散在每个页面里
- 权限判断到处写

当前版本已经把这些问题拆开：

- 页面负责编排
- feature 负责领域逻辑
- components 负责通用抽象
- api 负责请求基础设施

### 2. 解决了请求层不统一的问题

统一请求层之后：

- 页面不需要重复处理 `401`
- 接口失败不会直接把页面打崩
- 重复请求可以集中取消
- mock 和真实接口可以统一调用风格

### 3. 解决了权限逻辑分散的问题

现在权限分成了四层：

- 路由层权限
- 菜单层权限
- 模板层权限
- 逻辑层权限

对应就是：

- router meta
- navigation filter
- `v-permission`
- `usePermission()`

### 4. 解决了表单和表格重复开发的问题

查询表单、实体表单、表格能力已经抽成通用组件。

这样后面新增页面时，更像是在写 schema，而不是从头再拼一套表单和表格。

### 5. 解决了项目不容易扩展的问题

通过 `features/` 和 `router/modules/` 的拆分，后面新增模块时，成本会更低，也更不容易把项目变成一个大杂烩。

## 六、为什么这样设计

### 1. 为什么要 `features/task`

任务相关能力并不只是某个页面的小组件，它通常会包含：

- 表单
- 状态
- 规则
- 类型
- 交互逻辑

如果这些内容分散在页面自己的 `components` 目录下，短期看方便，长期会越来越乱。

放到 `features/task` 的意义是：

- 这是一个任务领域能力
- 不是某个页面临时拼出来的几个组件

### 2. 为什么查询表单和实体表单要分开

查询表单和新增、编辑表单本质不同：

- 生命周期不同
- 校验目标不同
- 提交语义不同
- 重置逻辑不同

如果硬做成一个大而全组件，后面只会越来越复杂。

当前做法是：

- 上层拆成两个语义明确的组件
- 底层共用 `SmartFormFields`

### 3. 为什么既有 `v-permission` 又有 `usePermission()`

因为模板层和逻辑层需要的能力不同：

- 模板层适合声明式隐藏
- 逻辑层适合操作前校验、提示、分支判断

两者配合比只做一种更完整。

## 七、如何运行

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

### 测试环境模式启动

```bash
npm run dev:test
```

### 生产构建

```bash
npm run build
```

### 其他命令

```bash
npm run build:test
npm run build:prod
npm run type-check
npm run lint
npm run format
npm run test:unit
npm run test:e2e
```

## 八、当前状态

当前 `npm run build` 已通过。

已知非阻塞提示：

- 本机 npm 的 `msvs_version` 配置警告
- `@vueuse/core` 在 rolldown 下的 `INVALID_ANNOTATION` warning

这些目前不会阻塞开发和构建。

## 九、还建议继续补什么

下面这些是继续做下去确实有帮助的方向，不是为了堆功能。

### 1. 补 `lint-staged + husky`

当前已经有：

- ESLint
- Prettier
- Oxlint

但还没有提交前只检查改动文件的能力。

补上之后会更像真实团队项目。

### 2. 给请求层和权限层补测试

最值得先补测试的不是样式，而是这些基础设施能力：

- `401` 自动跳登录
- 权限守卫拦截是否正确
- `usePermission()` 和 `v-permission` 是否符合预期
- 重复请求取消是否正常

### 3. 再落一个真实业务模块

现在任务模块和货车列表示例已经能说明问题，但如果再补一个独立模块，会更能证明：

- 通用抽象不是一次性的
- feature 架构可以继续扩展

### 4. 表格边界能力再补一点

比如：

- 空状态
- 请求失败后的重试
- 批量操作后的明确反馈

这些细节很像真实中后台项目。

### 5. 如果以后要接真实后台

后面可以继续演进到：

- 后端返回菜单树
- 动态路由注册
- 后端返回按钮权限码
- token 刷新队列

这些更适合作为下一阶段，而不是现在就过度设计。

## 十、面试时可以怎么讲

可以按这个顺序讲：

1. 从请求层开始，讲统一返回结构、统一错误处理、`401` 自动跳登录、重复请求取消。
2. 再讲登录鉴权和权限系统，说明路由、菜单、按钮权限是分层设计的。
3. 再讲通用查询表单、实体表单和通用表格，说明如何减少页面级重复开发。
4. 最后讲 feature 化任务模块和路由模块化，说明项目为什么更容易继续扩展。

一句话版本：

> 这是一个偏工程化的 Vue 3 + TypeScript 中后台 Demo，重点展示请求层、权限系统、通用组件抽象和可扩展的项目结构。

## License

仅作为学习和个人项目演示使用。
