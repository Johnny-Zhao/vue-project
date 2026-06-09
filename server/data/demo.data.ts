import type { DemoTask, ExpressOverview, ExpressStructureItem } from '../types/demo.ts'

export const expressOverview: ExpressOverview = {
  project: 'Vue Project Express Demo Server',
  stack: ['Express', 'Node.js', 'TypeScript', 'SQLite', 'OpenAI SDK'],
  description: 'A lightweight backend example used to learn layered Express architecture.',
  conventions: [
    'index.ts only starts the server',
    'app.ts wires middleware and routes together',
    'routes define URLs and HTTP methods',
    'controllers handle request and response objects',
    'services hold business logic',
    'repositories read and write the database',
    'data stores demo data or local database files',
  ],
}

export const expressStructure: ExpressStructureItem[] = [
  {
    path: 'server/index.ts',
    role: 'Server entry that reads config and starts listening on a port.',
  },
  {
    path: 'server/app.ts',
    role: 'Creates the Express app and mounts middleware, routes, and global error handling.',
  },
  {
    path: 'server/routes/',
    role: 'Defines endpoint paths and forwards requests to controllers.',
  },
  {
    path: 'server/controllers/',
    role: 'Reads req and res, extracts params, calls services, and returns unified responses.',
  },
  {
    path: 'server/services/',
    role: 'Stores business logic and coordinates repositories or AI services.',
  },
  {
    path: 'server/repositories/',
    role: 'Owns SQLite access and SQL query execution.',
  },
  {
    path: 'server/middleware/',
    role: 'Provides reusable request context, logging, validation, 404, and error handling.',
  },
  {
    path: 'server/database/',
    role: 'Wraps database connection, table creation, and initialization logic.',
  },
]

export const demoTasks: DemoTask[] = [
  {
    id: 1,
    title: 'Organize the Express folder structure',
    owner: 'Codex',
    status: 'doing',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Create a health check endpoint',
    owner: 'Backend',
    status: 'done',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Build the frontend demo page',
    owner: 'Frontend',
    status: 'todo',
    priority: 'medium',
  },
]
