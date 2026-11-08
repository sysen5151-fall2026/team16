# 原 PANTRI_App.html 审查与采用结论

审查日期：2026-11-08。

**结论：原 App 的课堂采购主流程通过本轮审查，可以作为 PMC2 的主要产品入口。后续沿用 PANTRI_App.html，而非新增的 PANTRI_PMC2.html。** 原 HTML 单独不能代表整份视频作业完成；已为原实现补充模型注释、追溯、契约映射与直接测试。

## 1. 原始文件及变更边界

- 来源：[用户提供的 Drive 文件夹中的原 App](https://drive.google.com/file/d/1SrqhizVi4SRNGfkZ9Xod9E2k0jVsW0tc/view)。
- Drive 修改时间：2026-10-21T15:37:05Z；原始大小 121,507 bytes。
- `evidence/original-app/drive-provenance.json` 保存原始 SHA256、来源 ID、采用文件 SHA256 和改动说明。
- 原 Drive 文件未修改。仓库采用版只增加四条 `PMC2_MODEL` JSDoc 注释，注明功能 ID、机制、输入、控制及输出。界面、布局、按钮、数据和业务代码均未重写。
- `test_original_app_only_adds_model_annotations` 去除这四条注释后，核对归一化源码 SHA256 与下载原件一致。
- 原 README 是较早的开发交接说明，仍把若干页面写成待开发。审查以实际下载的 HTML、实际运行和测试为准，不能把旧 README 当成当前能力结论。

## 2. 作业要求与实际证据

| 要求 | 审查结果与采用方式 |
|---|---|
| 使用课堂选定功能 | 原报告和产品对应 P-F.0.3 / PA.3；库存 UC.2 是上下文，UC.1 下单与 UC.9 的系统边界响应支持同一采购分支 |
| 模型到产品 | 原 App 的 editDraft、approveDraft、sendApprovedOrder、recordSupplierEvent 分别对应四个子功能 |
| 代码到模型 | HTML 内添加准确的四条功能／ICOM 注释；不是用另一个 orders.js 的测试结果冒充它 |
| docs/traceability.md | 主要表改为原 HTML 的真实函数、需求和 OriginalAppRequirements 测试；旧架构表保留为参考 |
| 指定 Python 测试 | tests/test_functional_requirements.py 增加 8 项原 App 测试，通过 Node 执行原 HTML 的业务层 |
| 实际模块及签名 | tools/load_original_app.js 只提取原业务层供测试使用；产品仍运行 HTML 自带的同一份函数 |
| contracts/api-v1.yaml | /product operations 对应原函数签名与本地状态交接；明确不是已部署 HTTP API；既有架构契约不伪装成原 App 的实际消息 |
| docs/route-table.md | 按课堂界面的真实按钮、表单、函数和 UC 标识改为原 App 主表 |
| CI | 同时执行原 App 与既有参考实现测试；上传原 HTML 和原 App 实际场景 JSON |
| Innoslate 需求部分 | 继续使用已核实的 P-DFR.03、P-PCR.F/IO/IF 组件规格和 P-NFR.02 → P-PCR.SW.02 Equivalence；功能范围没有变化 |

## 3. 浏览器实际走查结果

本轮运行的是下载的原始 HTML，而非新增界面。

1. Inventory → Sliced beef：记录库存和可用库存均为 8 kg，reorder point 10 kg，批次 batch-001。
2. Purchasing → Prime Foods → Review draft：两日需求 12 kg、可用库存 8 kg、建议采购 4 kg。
3. 修改 Manager quantity 为 5 并 Save changes：草稿成为 v2，仍未审批，没有创建订单。
4. Review & approve：显示最终 v2、5 kg、$72.50。
5. Approve & send (demo)：先提交审批快照，再尝试发送；Supplier 为 Awaiting confirmation，Receiving 为 Not received。
6. Apply simulated response，备注 Supplier confirmed 5 kg：Supplier 变为 Confirmed，记录明确的 Simulated 事件；批准数量仍为 5 kg，Receiving 仍为 Not received。
7. 重新打开库存：仍为 8 kg；确认没有冒充收货或增加库存。
8. Download JSON：实际导出 orders、approvedLines、库存和 partnerEvents；文件保存在 evidence/original-app/browser-export.json。

浏览器截图与文本记录：`evidence/original-app/`。

## 4. 直接测试原源码的结果

14 项原 App Node 检查通过，覆盖：

- 132 食材初始数据及 12/8/4 kg 采购依据；
- 修订版本及未审批状态、负数拒绝；
- 陈旧版本审批拒绝；v2、5 kg 和 $72.50 审批快照；
- 未审批发送拒绝、批准快照一致发送、重试不重复承诺；
- 已批准／发送的来源草稿不可编辑；
- confirmed / partial / delayed / exception 状态，错误餐厅、错误订单、非法时间拒绝；
- 迟到的旧回复不覆盖较新状态；
- localStorage 保存和重新加载审批；存储失败不发布未持久化审批。

另有 8 项按需求命名的 Python 测试直接调用原业务层；并新增两项原产品契约／来源完整性检查。仓库总计 54 项 Node 测试、25 项 Python 检查（含既有参考实现），以当前 CI 结果为准。

## 5. 保留的真实限制

- 本轮未在审查范围内发现阻止采用原 App 的采购流程问题，不等于保证全应用没有任何缺陷。
- 原产品是单经理、固定餐厅的 localStorage 演示，不具备生产角色鉴权证据；不能把 P-PCR.SW.02 的 100%/95% 门槛宣称为已验证。
- 供应商回复明确模拟；没有真实采购网络连接或实体配送证明。
- 浏览器本地保存不等于服务器级持久存储、跨设备恢复或全部组件需求通过。
- 本地函数共享不可变状态交接；PC-IF 设计契约不是已部署 HTTP 服务。
- 未改动原模型需求的 Draft/Planned 状态；原型测试不能替代完整运营验收。

## 6. 后续使用原则

- 主演示产品：`PANTRI_App.html`。保留原课堂按钮、页面路径和一条 Sliced beef 的 4→5 kg 演示。
- `PANTRI_PMC2.html` 保留为备选参考，后续不再作为主要产品。
- 查看原产品代码与测试时使用本次 original-app-review 分支／对应 PR，合并后再按目标分支使用；不把尚未合并的新材料声称已在主分支。
- 本轮没有开始编写视频脚本、录制或提交视频。
