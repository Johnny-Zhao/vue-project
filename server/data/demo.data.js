export const expressOverview = {
  project: 'Vue Project Express Demo Server',
  stack: ['Express', 'Node.js', 'ESM', 'SQLite', 'OpenAI SDK'],
  description: '这是一套用于学习 Express 分层结构的轻量后端示例。',
  conventions: [
    'index.js 只负责启动服务',
    'app.js 负责组装中间件和路由',
    'routes 只定义 URL 和 HTTP 方法',
    'controllers 只处理请求和响应',
    'services 负责业务逻辑',
    'repositories 负责数据库读写',
    'data 用来放示例数据或本地数据库文件',
  ],
}

export const expressStructure = [
  {
    path: 'server/index.js',
    role: '服务启动入口，只负责读取配置并监听端口。',
  },
  {
    path: 'server/app.js',
    role: '创建 Express 实例，挂载中间件、路由和全局错误处理。',
  },
  {
    path: 'server/routes/',
    role: '定义接口地址，把请求分发给对应控制器。',
  },
  {
    path: 'server/controllers/',
    role: '接收 req/res，做参数提取、调用 service、返回统一响应。',
  },
  {
    path: 'server/services/',
    role: '放业务逻辑，比如组合返回结构、调用仓储层或 AI 服务。',
  },
  {
    path: 'server/repositories/',
    role: '专门和 SQLite 交互，负责 SQL 查询和数据持久化。',
  },
  {
    path: 'server/middleware/',
    role: '放请求上下文、日志、参数校验、404、错误处理等通用能力。',
  },
  {
    path: 'server/database/',
    role: '封装数据库连接、建表和初始化逻辑。',
  },
]

export const demoTasks = [
  {
    id: 1,
    title: '整理 Express 目录结构',
    owner: 'Codex',
    status: 'doing',
    priority: 'high',
  },
  {
    id: 2,
    title: '创建健康检查接口',
    owner: 'Backend',
    status: 'done',
    priority: 'medium',
  },
  {
    id: 3,
    title: '补充前端演示页面',
    owner: 'Frontend',
    status: 'todo',
    priority: 'medium',
  },
]
