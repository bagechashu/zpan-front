# Viewers 预览组件目录

统一的文件预览管理系统，整合了所有文件类型的预览功能。

## 目录结构

```
src/components/Viewers/
├── index.js              # 预览管理器和导出
├── modals/               # 对话框式预览组件
│   ├── MediaViewer.vue   # 音视频预览（对话框）
│   └── PictureViewer.vue # 图片预览（对话框）
└── pages/                # 全屏页面式预览组件
    ├── PdfViewer.vue     # PDF 预览
    ├── DocViewer.vue     # Word 文档预览
    ├── XlsxViewer.vue    # Excel 预览
    └── PptxViewer.vue    # PowerPoint 预览
```

## 使用方式

### 1. 快速使用 - PreviewManager

```javascript
import PreviewManager from "@/components/Viewers";

// 预览文件
PreviewManager.preview(type, fileInfo, link);

// type: 'media' | 'image' | 'pdf' | 'xlsx' | 'doc' | 'pptx' | 'text'
// fileInfo: { name, alias, type }
// link: 文件链接地址
```

### 2. 直接导入组件

```javascript
import {
  MediaViewer,
  PictureViewer,
  PdfViewer,
  XlsxViewer,
  DocViewer,
  PptxViewer
} from "@/components/Viewers";
```

## 支持的文件类型

| 类型 | 打开方式 | 组件 | 说明 |
|------|--------|------|------|
| media | 对话框 | MediaViewer | 音视频文件 |
| image | 对话框 | PictureViewer | 图片文件 |
| pdf | 全屏 | PdfViewer | PDF 文档 |
| doc | 全屏 | DocViewer | Word 文档 (使用 mammoth) |
| xlsx | 全屏 | XlsxViewer | Excel 表格 (使用 xlsx) |
| pptx | 全屏 | PptxViewer | PowerPoint 演示文稿 (使用 pptx-preview) |
| text | 新标签页 | - | 文本文件在编辑器中打开 |

## 依赖库

- `vue-pdf-app` - PDF 预览
- `mammoth` - Word 文档转换
- `xlsx` - Excel 解析
- `pptx-preview` - PowerPoint 预览
- `vue-plyr` - 音视频播放
- `photoswipe` - 图片浏览

## 路由配置

在 `src/router.js` 中配置的路由：

```javascript
{ path: '/viewer/pdf', component: () => import('@/components/Viewers/pages/PdfViewer.vue') },
{ path: '/viewer/doc', component: () => import('@/components/Viewers/pages/DocViewer.vue') },
{ path: '/viewer/xlsx', component: () => import('@/components/Viewers/pages/XlsxViewer.vue') },
{ path: '/viewer/pptx', component: () => import('@/components/Viewers/pages/PptxViewer.vue') },
```

查询参数：
- `link` - 文件的 URL 地址（必需）
- `title` - 文件名称（可选）

## 示例

### 在磁盘浏览器中预览文件

```javascript
// src/views/home/disk/index.vue
import PreviewManager from "@/components/Viewers";

methods: {
  previewFile(item) {
    const type = getViewerType(item.type, item.name);
    this.linkLoader(item).then((link) => {
      PreviewManager.preview(type, item, link);
    });
  }
}
```

### 在对话框中预览图片

```javascript
import { transfer } from "@/helper";
import { PictureViewer } from "@/components/Viewers";

// 使用 transfer 工具函数以对话框方式显示
transfer(PictureViewer)({ title: "image.jpg", url: imageUrl });
```

## 迁移说明

### 旧结构（已弃用）

- `src/views/home/viewer/` - 旧的全屏预览页面
- `src/components/FileViewer/` - 旧的预览管理器

### 新结构（当前使用）

- `src/components/Viewers/` - 统一的预览组件目录
- `PreviewManager` - 统一的预览管理接口

### 升级步骤

1. 使用 `PreviewManager.preview()` 替换 `new FileViewer().view()`
2. 路由引用从 `./views/home/viewer/` 改为 `@/components/Viewers/pages/`
3. 移除 `src/views/home/viewer/` 和 `src/components/FileViewer/` 目录

## 扩展指南

要添加新的预览类型：

1. 在 `pages/` 或 `modals/` 目录中创建新的 Vue 组件
2. 在 `index.js` 中导入并添加新的处理逻辑
3. 在 `src/libs/zpan/fileTypeConfig.js` 中配置新的文件类型
4. 在 `src/router.js` 中添加新的路由（如果需要）

## 注意事项

- PowerPoint 预览使用 `pptx-preview` 库，支持导出为图片
- Word 文档预览依赖网络获取 CORS 配置，可能受跨域限制
- 所有全屏预览器都支持使用 `window.close()` 关闭
- 对话框式预览器使用 `DialogMixin` 管理生命周期
