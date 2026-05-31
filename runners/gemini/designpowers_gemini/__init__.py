"""Designpowers Gemini runner — a thin Google ADK adapter over the shared core.

This package contains NO design logic. It loads agent definitions (contract +
persona) and MCP server configs from the shared `core/` and wires them into
Google ADK. All judgment lives in the core; this is orchestration only.

See ../../ARCHITECTURE.md for the fat-core / thin-adapter design.
"""

from .core import Core, AgentDef, load_core
from .mcp import build_toolset, MCP_TOOL_SOURCE
from .agent import build_agent, root_agent

__all__ = [
    "Core",
    "AgentDef",
    "load_core",
    "build_toolset",
    "build_agent",
    "root_agent",
    "MCP_TOOL_SOURCE",
]
