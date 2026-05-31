"""CLI entry for the Designpowers Gemini runner.

  python -m designpowers_gemini            # show what's wired (no API key needed)
  python -m designpowers_gemini --review   # live one-shot review (needs GOOGLE_API_KEY)

The wiring summary always works and proves the adapter loaded the core correctly.
The live review needs a Gemini API key (GOOGLE_API_KEY, with
GOOGLE_GENAI_USE_VERTEXAI=FALSE for AI Studio). The deterministic evidence path —
the part that proves the agent gets measured truth — is exercised without any key
by the tests (see tests/test_evidence_path.py).
"""

from __future__ import annotations

import asyncio
import os
import sys

from .agent import build_agent, _pick_model
from .core import load_core

DEMO_PALETTE = (
    "Review this palette for WCAG contrast. Call the contrast tool for every pair "
    "and return the evidence envelope as JSON.\n"
    "- body text: foreground #1d2430 on background #ffffff (normal)\n"
    "- Save button: foreground #9aa0a6 on background #e8eaed (normal)\n"
)


def print_wiring() -> None:
    core = load_core()
    agent_def = core.agent("accessibility-critic")
    print("Designpowers Gemini runner — wiring summary")
    print(f"  core root      : {core.root}")
    print(f"  core version   : {core.version}")
    print(f"  agent          : {agent_def.id}")
    print(f"  model          : {_pick_model(agent_def)}")
    print(f"  persona (core) : {agent_def.persona_path.relative_to(core.root)}")
    print(f"  contract (core): {agent_def.contract_path.relative_to(core.root)}")
    for s in agent_def.mcp_servers:
        print(f"  mcp server     : {s.name} -> {s.command} {' '.join(s.args)}")
        print(f"                   tools: {', '.join(s.tools)}")
    has_key = bool(os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY"))
    print(f"  api key present: {has_key}")
    if not has_key:
        print("\nNo Gemini API key found. Set GOOGLE_API_KEY to run a live review:")
        print("  GOOGLE_GENAI_USE_VERTEXAI=FALSE GOOGLE_API_KEY=... \\")
        print("    python -m designpowers_gemini --review")
        print("\nThe evidence path is still verifiable without a key:  pytest -q")


async def _live_review(prompt: str) -> int:
    from google.adk.runners import InMemoryRunner
    from google.genai import types

    agent = build_agent("accessibility-critic")
    runner = InMemoryRunner(agent=agent, app_name="designpowers")
    session = await runner.session_service.create_session(
        app_name="designpowers", user_id="cli"
    )
    message = types.Content(role="user", parts=[types.Part(text=prompt)])
    final = ""
    async for event in runner.run_async(
        user_id="cli", session_id=session.id, new_message=message
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final = "".join(p.text or "" for p in event.content.parts)
    print(final)
    return 0


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if "--review" in argv:
        if not (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")):
            print("ERROR: --review needs GOOGLE_API_KEY (or GEMINI_API_KEY).", file=sys.stderr)
            return 2
        return asyncio.run(_live_review(DEMO_PALETTE))
    print_wiring()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
