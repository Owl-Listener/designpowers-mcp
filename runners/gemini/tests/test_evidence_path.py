"""The proof: the Gemini runner gets MEASURED evidence from the WCAG MCP tool.

This is deterministic and needs no LLM and no API key. It wires the MCP truth-layer
server exactly as the runner does (via the core registry + ADK MCPToolset), runs
the conformance scenario's input through `check_palette`, and asserts the measured
evidence matches what the scenario expects. This is the seed of the cross-runner
anti-drift suite described in core/conformance/README.md: when the Claude runner
exists, it runs the SAME scenario and must produce the SAME evidence.
"""

from __future__ import annotations

import asyncio
import json

from designpowers_gemini.core import load_core
from designpowers_gemini.mcp import build_toolset


def _structured(call_result):
    """Pull structuredContent out of an ADK tool result.

    ADK 2.1's McpTool.run_async returns the tool's structuredContent dict directly
    ({'results': [...], 'summary': {...}}). Older/other shapes (a list, or an object
    exposing `.structuredContent`) are handled too so this stays robust across the
    supported google-adk range.
    """
    res = call_result[0] if isinstance(call_result, list) else call_result
    if hasattr(res, "structuredContent"):
        return res.structuredContent
    return res


async def _run_palette(pairs):
    core = load_core()
    agent_def = core.agent("accessibility-critic")
    server = agent_def.mcp_servers[0]
    toolset = build_toolset(server)
    try:
        tools = {t.name: t for t in await toolset.get_tools()}
        assert "check_palette" in tools, f"missing check_palette in {list(tools)}"
        result = await tools["check_palette"].run_async(
            args={"pairs": pairs}, tool_context=None
        )
        return _structured(result)
    finally:
        await toolset.close()


def _load_scenario():
    core = load_core()
    path = core.agent("accessibility-critic").conformance_paths[0]
    return json.loads(path.read_text(encoding="utf-8")), core


def test_conformance_scenario_evidence_matches():
    scenario, _ = _load_scenario()
    pairs = scenario["input"]["pairs"]
    sc = asyncio.run(_run_palette(pairs))

    by_label = {r["label"]: r for r in sc["results"]}

    # Every per-pair assertion in the scenario must hold against MEASURED evidence.
    for a in scenario["expected_evidence"]["assertions"]:
        row = by_label[a["label"]]
        assert row[a["path"]] == a["equals"], (
            f"{a['label']}.{a['path']} = {row[a['path']]!r}, expected {a['equals']!r}"
        )

    # The summary-level assertion (how many fail AA).
    summary_a = scenario["expected_evidence"]["summary"]
    assert sc["summary"][summary_a["path"]] == summary_a["equals"]


def test_low_contrast_pair_is_measured_not_guessed():
    # The canonical failing pair: grey Save button on light grey.
    sc = asyncio.run(
        _run_palette([{"foreground": "#9aa0a6", "background": "#e8eaed", "label": "Save"}])
    )
    row = sc["results"][0]
    assert abs(row["ratio"] - 2.19) < 0.01, row["ratio"]
    assert row["passAA"] is False
    assert row["aaThreshold"] == 4.5


def test_passing_pair_is_measured():
    sc = asyncio.run(
        _run_palette([{"foreground": "#000000", "background": "#ffffff", "label": "max"}])
    )
    row = sc["results"][0]
    assert row["ratio"] == 21
    assert row["passAAA"] is True
