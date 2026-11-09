# 最新主产品选择：PANTRI_App.html

2026-11-08：已读取并直接审查 Drive 原文件，课堂采购流程和原源码测试通过。后续使用原 App。仅添加功能/ICOM 注释，保留界面与业务逻辑，Drive 原件未修改。

审查依据、原始文件指纹、浏览器数据和测试见 [ORIGINAL_APP_AUDIT_ZH.md](ORIGINAL_APP_AUDIT_ZH.md)、[主追溯表](traceability.md)、[主入口表](route-table.md)。PANTRI_PMC2.html 保留为参考，不再是主产品。下面是更早的独立界面准备记录，不应作为当前产品选择。

---

# PMC2 录制前交付与验收

日期：2026-11-08。工作分支 pmc2-evidence-20261108；Draft PR #1，未合并。

## 已完成

- 在线复核 P-DFR.03、P-AFR.08-11、四个资产一对一映射、组件三类需求示例和授权 Equivalence 下分；完整现场读回保存在 evidence/pmc2/live-model-audit-20261108.json。
- 增加 PANTRI_PMC2.html；它直接运行 orders.js，不再用旧界面冒充架构模块。双击 HTML 即可离线使用，无需服务或账号。
- 统一准备数据为 4/6/1 kg，测试修订到 5/6/1 kg、明确审批、保持一致发送及模拟回复。
- 根据在线 P-PCR.IO.01 判据修复已发送订单仍可修改草稿的问题，并加入原子拒绝测试。
- 补齐 docs/traceability.md、ICOM 模块说明、Python 需求测试、CI、OpenAPI YAML 和入口用例表。
- 13 项 Python 需求测试、2 项 Python 契约检查（安装 PyYAML==6.0.3）；40 项 Node 回归（包括 2 项新界面测试）；浏览器真实点击运行并保留 JSON 和截图。

## 使用与复核

1. 打开 PANTRI_PMC2.html；先试未审批发送，确认拒绝。
2. Beef 从 4 改为 5，Save revised draft；确认未审批 v2 和 5/6/1 kg。
3. 勾选明确审批并 Record approval，再 Transmit approved order。
4. Record supplier response；确认 CONFIRMED，查看实际状态或导出 JSON。模拟确认不表示配送。
5. 本地检查：`python tools/build_pmc2.py --check`、`node --test tests/*.test.js`、`python -m unittest discover -s tests -p test_functional_requirements.py -v`。
6. GitHub Actions 必须对应本次提交并显示成功；参见 PR #1 checks。

## 验收边界

- 当前已具备该分支在 PMC2 要求下的模型、产品、仓库与验证证据。若课堂实际选择不是 P-F.0.3，应由团队确认适用范围；本包沿用既定采购分支。
- P-PCR.SW.02 的完整授权百分比验证、持久数据库、生产身份认证与真实供应商集成不在原型结果内；保留真实 Draft/Planned 状态。
- PC-IF.01-03 是组件内部设计契约，当前运行通过共享内存状态衔接。YAML 不代表已部署 HTTP 服务。
- 新 PMC2 界面与旧 Milestone1 界面并存；录制所选架构模块应使用新界面。
- 视频脚本、录制、剪辑、上传与 Canvas 提交尚未执行，按用户要求留在后续阶段。
