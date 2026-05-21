# 防止备婚崩溃系统 - Node.js 版本

一个婚礼准备管理系统，采用 Node.js + Express 后端与原生 JavaScript 前端架构。

## 项目结构

```
.
├── server.js              # Express 服务器入口
├── package.json           # Node.js 依赖配置
├── data.json              # 数据存储文件（自动生成）
├── public/                # 静态文件目录
│   ├── index.html        # 主页
│   ├── app.js            # 前端应用逻辑
│   └── styles.css        # 样式文件
├── .gitignore            # Git 忽略规则
└── README.md             # 项目说明
```

## 安装

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

或生产模式：
```bash
npm start
```

3. 打开浏览器访问：`http://localhost:3000`

## 功能模块

- **总控台** - 婚礼倒计时、进度统计、预算概览
- **商家管理** - 四大金刚、酒店、婚庆等报价对比
- **预算追踪** - 支出分类统计
- **宾客名单** - 邀请人数和人头税计算
- **灵感墙** - 婚礼配色和设计参考
- **新人管理** - 新郎新娘个人信息
- **流程规划** - 婚礼当天时间节点

## API 端点

### 状态管理
- `GET /api/state` - 获取完整状态
- `POST /api/state` - 保存完整状态

### 任务
- `POST /api/tasks` - 新增任务
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务

### 商家
- `POST /api/vendors` - 新增商家

### 支出
- `POST /api/expenses` - 新增支出

### 宾客
- `POST /api/guests` - 新增宾客

### 灵感
- `POST /api/inspirations` - 新增灵感

### 其他
- `PUT /api/wedding-date` - 更新婚礼日期
- `PUT /api/budget` - 更新总预算
- `DELETE /api/:type/:id` - 删除任意类型数据

## 技术栈

- **后端**：Node.js + Express
- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **数据存储**：JSON 文件
- **跨域处理**：CORS

## 开发

### 修改前端
编辑 `public/` 下的文件，服务器会自动提供最新版本。

### 修改后端 API
编辑 `server.js` 并重启服务器。

### 监听文件更改
安装了 `nodemon`，可以自动重启服务器：
```bash
npm run dev
```

## 部署

生产环境可部署到：
- Heroku
- Railway
- Vercel
- AWS EC2
- 或任何支持 Node.js 的服务器

## 许可

MIT
