"""Compose a Google ADK agent from the shared core.

This is the thin adapter's payoff: given an agent id, read its contract + persona
from the core, wire the MCP truth-layer servers it needs, and hand both to an ADK
``LlmAgent``. The runner contributes no design judgment — only the framework glue.

``root_agent`` (the accessibility critic) is exposed at module level so the ADK
CLI can run it: ``adk run designpowers_gemini`` / ``adk web``.
"""

from __future__ import annotations

import os

from google.adk.agents import LlmAgent

from .core import AgentDef, load_core
from .mcp import build_toolset

#: Default Gemini model. Vision-capable + large-context, matching the
#: accessibility-critic's model_hints (read a screenshot's colours, ingest a whole
#: DESIGN.md palette). Override with GEMINI_MODEL.
DEFAULT_MODEL = "gemini-2.5-pro"


def _pick_model(agent_def: AgentDef) -> str:
    """Env override wins; otherwise honor the core's model_hints."""
    env = os.environ.get("GEMINI_MODEL")
    if env:
        return env
    hints = agent_def.model_hints
    # Both hints true -> the pro tier (vision + large context). This is the
    # accessibility-critic case. A future text-only agent could drop to flash.
    if hints.get("needs_vision") or hints.get("needs_large_context"):
        return DEFAULT_MODEL
    return os.environ.get("GEMINI_MODEL_LITE", "gemini-2.5-flash")


def build_agent(agent_id: str = "accessibility-critic") -> LlmAgent:
    """Build the ADK agent for `agent_id` straight from the core definition."""
    core = load_core()
    agent_def = core.agent(agent_id)

    toolsets = [build_toolset(server) for server in agent_def.mcp_servers]

    return LlmAgent(
        name=agent_id.replace("-", "_"),
        model=_pick_model(agent_def),
        description=agent_def.description,
        instruction=agent_def.instruction(),
        tools=list(toolsets),
    )


# Exposed for `adk run` / `adk web`. Construction is cheap and does not spawn the
# MCP server (MCPToolset connects lazily on first tool use), so import is safe
# even without a Gemini API key.
root_agent = build_agent("accessibility-critic")
