"""The runner is a thin adapter: it composes the agent straight from the core.

These checks need no API key — constructing an ADK agent does not call the model.
They assert that the runner (a) loaded judgment + contract from the core rather
than embedding any of its own, and (b) wired the MCP truth-layer server.
"""

from __future__ import annotations

from google.adk.tools.mcp_tool import MCPToolset

from designpowers_gemini.agent import build_agent
from designpowers_gemini.core import load_core


def test_core_loads_and_resolves_accessibility_critic():
    core = load_core()
    a = core.agent("accessibility-critic")
    assert a.persona_path.name == "accessibility-reviewer.md"
    assert a.contract_path.exists()
    assert a.mcp_servers and a.mcp_servers[0].name == "designpowers-accessibility"
    # The MCP server command comes from the core registry, not from runner code.
    assert a.mcp_servers[0].command == "node"
    assert a.mcp_servers[0].args == ["mcp-tools/accessibility/server.js"]


def test_instruction_is_persona_plus_contract_from_core():
    core = load_core()
    a = core.agent("accessibility-critic")
    instr = a.instruction()
    # Judgment comes from the persona file...
    assert "accessibility specialist" in instr
    # ...the boundary/rule comes from the contract file...
    assert "every checkable claim must be backed by a tool result" in instr.lower()
    # ...and the runner added no design logic of its own beyond framing.
    assert a.persona_text in instr
    assert a.contract_text in instr


def test_build_agent_wires_mcp_toolset():
    agent = build_agent("accessibility-critic")
    assert agent.name == "accessibility_critic"
    assert agent.model  # a model id is chosen (default or env)
    assert any(isinstance(t, MCPToolset) for t in agent.tools), "MCP truth tool not wired"
    # The persona/contract reached the model as its instruction.
    assert "contract" in agent.instruction.lower()
