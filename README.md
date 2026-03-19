# CardVerse

CardVerse 是一个面向数字商品、卡密和自动发货场景的完整系统，包含：

- NestJS 后端 API
- `admin-web` 后台管理端
- `storefront-web` 前台商城
- 基于 Caddy 的单端口 Docker 部署方案

仓库适合以下场景：

- 销售卡密、会员兑换码、软件授权码等数字商品
- 通过后台维护商品、卡密库存、订单、优惠券和支付配置
- 通过统一入口同时提供商城、后台和 API

## 功能概览

- 商品分类、商品信息、上下架状态管理
- 卡密库存导入、发货与状态管理
- 订单创建、订单查询、手动发货与自动发货
- 优惠券与折扣能力
- 支付通道配置
- 发货完成后的业务 webhook 推送
- 邮件模板与通知发送
- 图片上传与静态资源访问
- Swagger API 文档

## 技术栈

- Backend: NestJS 11
- ORM: Prisma
- Database: MySQL
- Admin Web: Vue 3 + Vite + Naive UI
- Storefront Web: Vue 3 + Vite + Naive UI
- Reverse Proxy: Caddy
- Runtime: Node.js 20

## 项目结构

```text
.
├─ src/                # NestJS 后端源码
├─ prisma/             # Prisma schema 与 seed
├─ admin-web/          # 后台管理端
├─ storefront-web/     # 前台商城
├─ uploads/            # 上传文件目录
├─ scripts/            # 启动与环境变量辅助脚本
└─ docker/             # Docker 与反向代理配置
```

## 路由设计

项目部署后的统一访问入口如下：

- `/`：前台商城 `storefront-web`
- `/admin/`：后台管理 `admin-web`
- `/api/`：NestJS API
- `/uploads/`：上传文件访问路径
- `/api/docs`：Swagger 文档

## 商品业务 Webhook

商品支持配置独立的业务 webhook，订单完成关键流程后会主动推送数据到你的外部系统。

- 自动发货商品在成功发货后触发
- 手动发货商品在支付成功后触发
- webhook 以 `POST` + `application/json` 方式发送
- 当前会推送商品、订单、邮箱、查询密码、支付金额等核心信息
- 请求失败不会阻塞主订单流程，更适合接入外围系统和异步自动化

适合：

- 购买成功后自动开通会员、激活服务、创建账户
- 把订单同步到 CRM、工单、机器人或内部业务平台
- 对接你自己的发码、交付或售后系统

## 环境要求

- Node.js 20+
- npm 10+
- MySQL 8+ 或兼容版本
- Docker / Docker Compose（如果使用容器部署）

## 本地开发

### 1. 安装依赖

```bash
npm install
cd admin-web && npm install
cd ../storefront-web && npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

至少需要配置以下变量：

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=user
DB_PASSWORD=password
DB_NAME=cardverse
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=JenkinWoo123!
DEFAULT_ADMIN_EMAIL=admin@example.com
JWT_SECRET=change-this-secret
```

### 3. 初始化数据库

```bash
npm run prisma:db:push
npm run prisma:seed
```

### 4. 启动开发环境

分别启动三个应用：

```bash
npm run start:dev
```

```bash
cd admin-web
npm run dev
```

```bash
cd storefront-web
npm run dev
```

### 5. 本地访问地址

- API / Swagger: [http://127.0.0.1:3000/api/docs](http://127.0.0.1:3000/api/docs)
- 后台管理端: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- 前台商城: [http://127.0.0.1:5174](http://127.0.0.1:5174)

默认管理员账号取决于你当前的环境变量配置，默认示例为：

- Username: `admin`
- Password: `JenkinWoo123!`

## 生产构建

### 后端构建

```bash
npm run build
```

### 前端构建

```bash
cd admin-web && npm run build
cd ../storefront-web && npm run build
```

## Docker 部署

项目提供单镜像部署方案。容器内部包含：

- NestJS API
- `admin-web` 构建产物
- `storefront-web` 构建产物
- Caddy 反向代理

对外表现为一个统一入口：

- `/` 返回商城页面
- `/admin/` 返回后台页面
- `/api/` 转发到 NestJS
- `/uploads/` 转发到上传目录

### 1. 配置环境变量

你可以直接修改项目根目录 `.env`，也可以在启动容器时传入变量。

常用变量：

```env
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=cardverse
DB_PASSWORD=strong-password
DB_NAME=cardverse
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=JenkinWoo123!
DEFAULT_ADMIN_EMAIL=admin@example.com
JWT_SECRET=change-this-secret
RUN_DB_PUSH=true
RUN_DB_SEED=true
```

变量说明：

- `APP_PORT`：宿主机映射到容器 `80` 的端口。
- `RUN_DB_PUSH`：容器启动时是否自动执行 `prisma db push`。
- `RUN_DB_SEED`：容器启动时是否自动执行 `prisma seed`。

如果你的支付回调或 webhook 依赖公网访问，请确认：

- 若商品配置了 `apiHook`，容器网络可以访问目标 webhook 地址

### 2. 启动容器

```bash
docker compose up -d --build
```

### 3. 访问地址

- 前台商城：`http://your-host/`
- 后台管理：`http://your-host/admin/`
- Swagger：`http://your-host/api/docs`
- 健康检查：`http://your-host/api/health`

### 4. Docker 说明

- 上传文件会持久化到 Docker 卷
- 如果数据库 schema 已由外部管理，可以设置 `RUN_DB_PUSH=false`
- 如果不希望每次容器启动都执行管理员 seed，可以设置 `RUN_DB_SEED=false`

更详细的部署说明见：
[docker/DEPLOY.md](docker/DEPLOY.md)

## 常用命令

```bash
# 后端开发
npm run start:dev

# 后端构建
npm run build

# Prisma
npm run prisma:db:push
npm run prisma:seed

# 后台前端
cd admin-web && npm run dev
cd admin-web && npm run build

# 商城前端
cd storefront-web && npm run dev
cd storefront-web && npm run build
```

## 部署前检查

- 修改数据库账号密码和 `JWT_SECRET`
- 修改默认管理员密码
- 确认 MySQL 已可被应用容器访问

## 仓库文件

- [docker-compose.yml](docker-compose.yml)
- [docker/app.Dockerfile](docker/app.Dockerfile)
- [docker/Caddyfile](docker/Caddyfile)
- [docker/DEPLOY.md](docker/DEPLOY.md)
- [CHANGELOG.md](CHANGELOG.md)
- [LICENSE](LICENSE)

## 许可证

ISC，详见 [LICENSE](LICENSE)。
