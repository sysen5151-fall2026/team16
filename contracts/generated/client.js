'use strict';
// GENERATED from contracts/api-v1.json. Regenerate; do not hand-edit.
const operations = {
  "P_IF_01": "P-IF.01",
  "P_IF_02": "P-IF.02",
  "P_IF_03": "P-IF.03",
  "P_IF_04": "P-IF.04",
  "P_IF_05": "P-IF.05",
  "P_IF_06": "P-IF.06",
  "P_IF_07": "P-IF.07",
  "P_IF_08": "P-IF.08",
  "P_IF_09": "P-IF.09",
  "P_IF_10": "P-IF.10",
  "P_IF_11": "P-IF.11",
  "P_IF_12": "P-IF.12",
  "P_IF_13": "P-IF.13",
  "P_IF_14": "P-IF.14",
  "P_IF_15": "P-IF.15",
  "P_IF_16": "P-IF.16",
  "P_IF_17": "P-IF.17",
  "P_IF_18": "P-IF.18",
  "P_IF_19": "P-IF.19",
  "P_IF_20": "P-IF.20",
  "P_IF_21": "P-IF.21",
  "P_IF_22": "P-IF.22",
  "P_IF_23": "P-IF.23",
  "P_IF_24": "P-IF.24"
};
function createClient(bus, source, recipient) {
  return Object.fromEntries(Object.entries(operations).map(([operation,flow]) => [operation, packet => bus.send(flow, source, recipient, packet)]));
}
module.exports = {operations,createClient};
