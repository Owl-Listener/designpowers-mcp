"""Wire the core's MCP truth-layer servers into Google ADK.

This is the entire "wire the MCP servers" responsibility of the runner: turn an
``McpServerDef`` from the core registry into an ADK ``MCPToolset`` that launches
the (Node) MCP server over stdio. No tool logic lives here — the truth lives in
``mcp-tools/``; this just connects to it.
"""

from __future__ import annotations

from google.adk.tools.mcp_tool import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

from .core import McpServerDef

#: Where the truth comes from, so it can be stamped onto evidence (source field).
MCP_TOOL_SOURCE = "designpowers-accessibility"


def build_toolset(server: McpServerDef, timeout: float = 30.0) -> MCPToolset:
    """Build an ADK MCPToolset that launches `server` over stdio."""
    return MCPToolset(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command=server.command,
                args=list(server.args),
                cwd=server.cwd,
            ),
            timeout=timeout,
        )
    )
