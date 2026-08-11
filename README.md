# mall-admin-web

后台管理系统前端骨架（Vue3 + Vite + Element Plus + Pinia）。

## 启动

```powershell
$env:Path = "D:\nodejs;" + $env:Path
cd D:\mall\mall-admin-web
npm install
npm run dev
```

浏览器打开：http://127.0.0.1:5173

开发代理：`/api/*` → `http://127.0.0.1:9082/*`

## 框架期页面

- `/login` 登录壳
- `/dashboard` 工作台
- `/ping` 联调探测（调用 admin-api `/ping`）
- `/products` `/categories` 业务占位

请先启动 `mall-admin-api`（9082）。
