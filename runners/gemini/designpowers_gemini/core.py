"""Load the Designpowers shared core (registry, contracts, personas).

The runner reads everything about *what* an agent is from the core. It resolves
the repo root (the dir that contains both ``core/registry.json`` and
``mcp-tools/``), then reads the registry and, per agent, the contract + persona
Markdown that become the model's instruction.

Nothing here is framework-specific — it is plain file loading. The ADK wiring
lives in ``mcp.py`` and ``agent.py``.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path


def find_repo_root(start: Path | None = None) -> Path:
    """Walk upward until we find the shared core. Override with DESIGNPOWERS_ROOT."""
    env = os.environ.get("DESIGNPOWERS_ROOT")
    if env:
        root = Path(env).expanduser().resolve()
        if (root / "core" / "registry.json").is_file():
            return root
        raise FileNotFoundError(f"DESIGNPOWERS_ROOT={root} has no core/registry.json")

    here = (start or Path(__file__)).resolve()
    for candidate in [here, *here.parents]:
        if (candidate / "core" / "registry.json").is_file() and (candidate / "mcp-tools").is_dir():
            return candidate
    raise FileNotFoundError(
        "Could not locate the Designpowers repo root (a dir with core/registry.json "
        "and mcp-tools/). Set DESIGNPOWERS_ROOT."
    )


@dataclass(frozen=True)
class McpServerDef:
    """An MCP truth-layer server, as declared in the core registry."""

    name: str
    command: str
    args: list[str]
    cwd: str
    tools: list[str]
    description: str = ""


@dataclass(frozen=True)
class AgentDef:
    """A fully-resolved agent definition from the core."""

    id: str
    description: str
    contract_path: Path
    persona_path: Path
    contract_text: str
    persona_text: str
    evidence_schema_path: Path
    mcp_servers: list[McpServerDef]
    model_hints: dict
    conformance_paths: list[Path]

    def instruction(self) -> str:
        """The model instruction = persona (judgment) + contract (boundary).

        This is the whole point of the thin adapter: the runner does not author
        the agent's behaviour, it concatenates what the core already says.
        """
        return (
            "You are a Designpowers agent. Your persona (how you judge) and your "
            "contract (what you must do and return) follow. Obey the contract's "
            "rule that every checkable claim must be backed by a tool result — "
            "never estimate a contrast ratio, always call the tool.\n\n"
            "================ PERSONA (judgment) ================\n"
            f"{self.persona_text}\n\n"
            "================ CONTRACT (inputs / rule / output) ================\n"
            f"{self.contract_text}\n"
        )


@dataclass(frozen=True)
class Core:
    """The loaded shared core."""

    root: Path
    version: str
    registry: dict

    def _resolve(self, rel: str) -> Path:
        return (self.root / rel).resolve()

    def mcp_server(self, name: str) -> McpServerDef:
        spec = self.registry["mcp_servers"][name]
        cwd = spec.get("cwd", ".")
        cwd_abs = str((self.root / cwd).resolve())
        return McpServerDef(
            name=name,
            command=spec["command"],
            args=list(spec["args"]),
            cwd=cwd_abs,
            tools=list(spec.get("tools", [])),
            description=spec.get("description", ""),
        )

    def agent(self, agent_id: str) -> AgentDef:
        spec = self.registry["agents"][agent_id]
        contract_path = self._resolve(spec["contract"])
        persona_path = self._resolve(spec["persona"])
        return AgentDef(
            id=agent_id,
            description=spec.get("description", ""),
            contract_path=contract_path,
            persona_path=persona_path,
            contract_text=contract_path.read_text(encoding="utf-8"),
            persona_text=persona_path.read_text(encoding="utf-8"),
            evidence_schema_path=self._resolve(spec["evidence_schema"]),
            mcp_servers=[self.mcp_server(n) for n in spec.get("mcp_servers", [])],
            model_hints=dict(spec.get("model_hints", {})),
            conformance_paths=[self._resolve(p) for p in spec.get("conformance", [])],
        )


def load_core(start: Path | None = None) -> Core:
    root = find_repo_root(start)
    registry = json.loads((root / "core" / "registry.json").read_text(encoding="utf-8"))
    return Core(root=root, version=registry.get("core_version", "0"), registry=registry)
