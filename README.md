# 公司官网模板

一个简洁、专业的企业官网静态模板。

## 📁 文件结构

```
company-website/
├── index.html        # 首页
├── about.html        # 关于我们
├── products.html     # 产品服务
├── contact.html      # 联系我们
├── css/
│   └── style.css     # 样式文件
├── js/
│   └── main.js       # 交互脚本
└── README.md         # 说明文档
```

## 🚀 快速开始

### 1. 本地预览

直接双击 `index.html` 即可在浏览器中打开预览。

或使用本地服务器（推荐）：

```bash
# 如果有 Python
python -m http.server 8000

# 如果有 Node.js
npx serve .

# 然后访问 http://localhost:8000
```

### 2. 自定义内容

需要修改的内容：

- **公司名称**：在所有 HTML 文件中搜索"公司名称"替换
- **联系方式**：邮箱、电话、地址
- **产品介绍**：在 `products.html` 中修改产品信息
- **公司简介**：在 `about.html` 中修改公司介绍
- **颜色主题**：在 `css/style.css` 中修改 `#007bff` 为你的品牌色

### 3. 配置联系表单

联系表单使用 [Formspree](https://formspree.io/)（免费服务）：

1. 访问 https://formspree.io/ 注册账号
2. 创建新表单（New Form）
3. 获取表单 ID（类似 `xvndkqab`）
4. 打开 `contact.html`，找到这一行：
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```
5. 将 `YOUR_FORM_ID` 替换为你的实际表单 ID

完成后，客户提交的咨询会发送到你的邮箱！

## 🌐 部署上线

### 方案一：GitHub Pages（推荐）

1. 在 GitHub 创建新仓库
2. 将所有文件上传到仓库
3. 进入 Settings → Pages
4. 选择 `main` 分支，保存
5. 访问 `https://你的用户名.github.io/仓库名`

### 方案二：Vercel

1. 访问 https://vercel.com/ 注册
2. 点击 "New Project"
3. 导入 GitHub 仓库或直接拖拽文件夹
4. 自动部署完成

### 方案三：Netlify

1. 访问 https://netlify.com/ 注册
2. 点击 "Add new site" → "Deploy manually"
3. 拖拽 `company-website` 文件夹
4. 部署完成

### 方案四：自己的服务器

将所有文件上传到服务器的 web 目录（如 `/var/www/html` 或 `htdocs`）即可。

## 📱 响应式设计

网站已支持手机、平板、电脑各种屏幕尺寸，自动适配。

## 🎨 自定义建议

### 添加图片

1. 在 `images/` 文件夹放入你的图片
2. 在 HTML 中使用：`<img src="images/your-photo.jpg" alt="描述">`

### 修改颜色

在 `css/style.css` 中搜索 `#007bff`（蓝色主题色），替换为你的品牌色。

### 添加更多页面

复制现有 HTML 文件，修改内容即可。记得在导航栏添加新链接。

## 📞 技术支持

如有问题，欢迎咨询！

---

**许可证：** MIT License
**创建时间：** 2026 年 3 月
