module.exports = {
  header: '# 更新日志 / Changelog\n\n本项目的所有重要更改都将记录在此文件中。\n\n格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，项目遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。\n',
  
  types: [
    { type: 'feat', section: '✨ 新增功能' },
    { type: 'fix', section: '🐛 Bug 修复' },
    { type: 'perf', section: '⚡ 性能优化' },
    { type: 'refactor', section: '♻️ 代码重构' },
    { type: 'docs', section: '📚 文档更新' },
    { type: 'build', section: '📦 构建系统' },
    { type: 'ci', section: '🔧 持续集成' },
    { type: 'style', section: '💄 代码格式' },
    { type: 'test', section: '✅ 测试' },
    { type: 'chore', section: '🔨 其他修改' },
    { type: 'revert', section: '⏪ 撤销更改' },
    { type: 'workflow', section: '📋 工作流' },
    { type: 'types', section: '🏷️ 类型定义' },
    { type: 'wip', section: '🚧 开发中', hidden: true },
    { type: 'release', section: '🚀 发布', hidden: true }
  ],
  
  commitUrlFormat: 'https://github.com/guizimo/n-admin/commit/{{hash}}',
  compareUrlFormat: 'https://github.com/guizimo/n-admin/compare/{{previousTag}}...{{currentTag}}',
  issueUrlFormat: 'https://github.com/guizimo/n-admin/issues/{{id}}',
  
  releaseCommitMessageFormat: 'chore(release): {{currentTag}}',
  
  bumpFiles: [
    {
      filename: 'package.json',
      type: 'json'
    }
  ],
  
  packageFiles: [
    {
      filename: 'package.json',
      type: 'json'
    }
  ]
}; 