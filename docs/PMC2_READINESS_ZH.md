# PMC2 非视频交付状态

本分支基于 function-architecture；main 尚未包含这些架构改动。未经合并前，请勿从 main 演示。

## 运行

1. 安装已有受信任的 Node.js 与 Python。
2. `npm test` 运行原型回归。
3. `python -m unittest discover -s tests -p test_functional_requirements.py -v` 运行按需求命名的 Python 测试；Python 通过子进程调用真实 JS，不复制业务逻辑。
4. `node tools/pmc2_scenario.js` 生成完整实际运行记录：草稿、修订、审批、发送、确认以及拒绝场景。
5. 对照 docs/traceability.md、orders.js 顶部 ICOM 说明、contracts/api-v1.yaml 和 docs/route-table.md。

## 未能据此完成的部分

- Innoslate 当前浏览器显示登录页；须重新登录后复核模型。没有改为 Passed。
- 本地成功不等于远端 CI 成功；以该分支 GitHub Actions 实际运行及 commit 为准。
- 课堂实际选定功能仍需团队确认；本包沿用此前准备的 P-F.0.3，不擅自认证课堂选择。
- 组件规格 PC-IF.01-03 中的持久化／传输引用与当前共享内存原型存在实现差距，YAML明确标为设计契约。
- 既有离线 UI 使用 core.js，新增需求测试调用 architecture/orders.js；演示这个模块时使用 CLI，不能声称原 UI 已接入它。
- 视频、同伴互评及正式 Canvas 提交不在本次执行范围。
