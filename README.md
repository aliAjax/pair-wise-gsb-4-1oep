# 声线练习室

纯前端发音练习工具（React + TypeScript + Vite，无额外运行时依赖）。`npm install` 后运行 `npm run dev` 启动。

## 功能

- 句子库：按标签 / 状态筛选、搜索、添加与删除句子。
- 重点片段：每个句子可标记若干重点片段并附提示；片段必须能在句中唯一定位且互不重叠。句子卡片与当前练习区按同一份标记渲染，点击标记可切换提示。
- 修改句子：仍能定位的标记自动保留并重新对齐；定位不到的进入「待重标」，处理完（重新定位或放弃）之前不能开始新录音。
- 练习记录：每次录音保存当时的句子与标记快照，之后改句、删句都不影响已发出的记录。

## 目录结构（资料 / 匹配 / 页面分离）

- `src/data/phrases.ts` — 类型、种子数据、localStorage 读写
- `src/data/store.ts` — 数据层 hook：句子库与练习记录的所有写操作
- `src/lib/marking.ts` — 纯函数匹配逻辑：定位、重锚、重叠检测、切分
- `src/components/MarkedText.tsx` — 共用的标记渲染组件
- `src/views/PracticeView.tsx` / `src/views/RecordsView.tsx` — 页面
- `src/App.tsx` — 外壳与视图切换
