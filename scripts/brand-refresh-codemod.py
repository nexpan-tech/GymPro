#!/usr/bin/env python3
"""GymPro strict 4-color brand refresh codemod.

Replaces all forbidden Tailwind color classes, raw hex, and rgba() values with
the GymPro palette (#E73725 red, #E1E1E1 gray, #010000 black, #FFFFFF white)
and their semantic tokens. UI/theme only — never touches logic.
"""
import os
import re
import sys

# Hues that represented brand / primary / info / danger in the old themes → RED.
RED_HUES = {"blue", "sky", "indigo", "violet", "purple", "fuchsia", "cyan",
            "rose", "pink", "red"}
# Positive / warning hues → NEUTRAL gray (differentiated by icon/label, not hue).
NEUTRAL_HUES = {"green", "emerald", "lime", "teal", "yellow", "amber", "orange"}
ALL_HUES = RED_HUES | NEUTRAL_HUES

# Tailwind utility prefixes that accept a color token.
PREFIX = (r"(?P<prefix>text|bg|border(?:-[trblxyse])?|ring(?:-offset)?|divide"
          r"|from|via|to|fill|stroke|placeholder|accent|caret|decoration"
          r"|outline|shadow|ring)")
CLASS_RE = re.compile(
    PREFIX + r"-(?P<hue>" + "|".join(sorted(ALL_HUES, key=len, reverse=True)) +
    r")-(?P<shade>\d{2,3})(?:/(?P<op>\d{1,3}))?\b"
)


def map_class(m):
    prefix = m.group("prefix")
    hue = m.group("hue")
    shade = int(m.group("shade"))
    red = hue in RED_HUES
    light = shade <= 200
    base = prefix.split("-")[0]  # text / bg / border / ring / from ...

    if red:
        if base == "text":
            return "text-primary"
        if base == "bg":
            return "bg-primary/10" if light else "bg-primary"
        if base in ("border", "divide", "ring", "outline"):
            return f"{prefix}-primary/40"
        if base in ("from", "via", "to"):
            return f"{prefix}-primary"
        if base in ("fill", "stroke"):
            return f"{prefix}-primary"
        if base == "placeholder":
            return "placeholder-primary/60"
        if base == "shadow":
            return "shadow-primary/30"
        if base in ("accent", "caret", "decoration"):
            return f"{base}-primary"
        return f"{prefix}-primary"
    else:
        if base == "text":
            return "text-muted-foreground"
        if base == "bg":
            return "bg-muted" if shade < 400 else "bg-muted-foreground"
        if base in ("border", "divide", "ring", "outline"):
            return f"{prefix}-border"
        if base in ("from", "via", "to"):
            return f"{prefix}-muted"
        if base in ("fill", "stroke"):
            return f"{prefix}-muted-foreground"
        if base == "placeholder":
            return "placeholder-muted-foreground"
        if base == "shadow":
            return "shadow-black/10"
        if base in ("accent", "caret", "decoration"):
            return f"{base}-muted-foreground"
        return f"{prefix}-muted-foreground"


# Hex → palette hex map (lower-cased keys). Covers full inventory from audit.
HEX_MAP = {
    # old brand / indigo / blue / purple → GymPro Red family
    "#6366f1": "#e73725", "#4f46e5": "#e73725", "#7c3aed": "#e73725",
    "#818cf8": "#ec5848", "#8b5cf6": "#e73725", "#3b82f6": "#e73725",
    "#2563eb": "#c72a1b", "#0ea5e9": "#e73725", "#a855f7": "#e73725",
    "#60a5fa": "#ec5848", "#38bdf8": "#ec5848", "#c084fc": "#ec5848",
    "#a78bfa": "#ec5848", "#f472b6": "#ec5848", "#ec4899": "#e73725",
    "#db2777": "#c72a1b", "#9333ea": "#c72a1b", "#6d28d9": "#c72a1b",
    # old crimson / gochujang → red family
    "#c1121f": "#e73725", "#780001": "#a11f13", "#9c0e18": "#c72a1b",
    "#e8505f": "#ec5848", "#e02434": "#e73725", "#db3a44": "#ec5848",
    "#5c0001": "#5e120b", "#4a0000": "#5e120b", "#ef4444": "#e73725",
    "#f87171": "#ec5848",
    # red tints → red tints (palette)
    "#fee2e2": "#fdecea", "#fdecee": "#fdecea", "#fdeaea": "#fdecea",
    "#fbd5d8": "#fbd6d1", "#f4a8ad": "#f5aca3", "#eff6ff": "#f4f4f4",
    # greens → neutral gray
    "#10b981": "#767676", "#059669": "#5c5c5c", "#22c55e": "#767676",
    "#34d399": "#767676", "#ecfdf5": "#f4f4f4",
    # ambers / oranges → neutral gray
    "#f59e0b": "#767676", "#f97316": "#767676", "#d97706": "#5c5c5c",
    "#fb923c": "#767676", "#c99a3a": "#767676", "#fffbeb": "#f4f4f4",
    # near-white surfaces → white / soft-gray derivatives
    "#f8fafc": "#ffffff", "#f9fafb": "#fafafa", "#f3f4f6": "#f4f4f4",
    "#f7f9fc": "#f4f4f4", "#eef2f7": "#f4f4f4", "#f7f0e2": "#f4f4f4",
    "#f6efe1": "#f4f4f4", "#f1f6fb": "#f4f4f4", "#fbf7ef": "#ffffff",
    "#fef0d5": "#f4f4f4",
    # borders
    "#e5e7eb": "#e1e1e1", "#d1d5db": "#cfcfcf",
    # mid grays (secondary/muted text)
    "#94a3b8": "#767676", "#9ca3af": "#767676", "#6b7280": "#6e6e6e",
    "#4b5563": "#5c5c5c", "#475569": "#404040", "#374151": "#404040",
    "#c2d2e0": "#c9c9c9", "#8aa2b5": "#8f8f8f", "#cbd5e1": "#c9c9c9",
    "#5fa8ce": "#767676", "#4e7e9c": "#5c5c5c",
    # cosmos blues → black derivatives
    "#002f49": "#010000", "#00253a": "#0a0a0a",
    # dark surfaces → jet-black derivatives
    "#0f172a": "#141414", "#1e293b": "#1a1a1a", "#0e2a3c": "#141414",
    "#04161f": "#010000", "#07202e": "#0a0a0a", "#0a2230": "#1a1a1a",
    "#14384c": "#242424", "#032032": "#0a0a0a", "#04263a": "#0a0a0a",
    "#021f30": "#0a0a0a", "#021320": "#050505", "#020617": "#010000",
    "#1f2937": "#242424", "#111827": "#141414", "#030712": "#010000",
}

# rgba() red/green/blue triplets → palette triplets (keep alpha).
RGBA_MAP = {
    (193, 18, 31): (231, 55, 37),    # old crimson
    (120, 0, 1): (161, 31, 19),      # old gochujang
    (99, 102, 241): (231, 55, 37),   # indigo
    (79, 70, 229): (231, 55, 37),    # indigo-600
    (0, 47, 73): (1, 0, 0),          # cosmos
    (0, 37, 58): (1, 0, 0),          # cosmos-700
    (16, 185, 129): (118, 118, 118), # emerald
    (52, 211, 153): (118, 118, 118), # emerald-light
    (5, 150, 105): (92, 92, 92),     # emerald-dark
    (239, 68, 68): (231, 55, 37),    # red-500
    (56, 189, 248): (118, 118, 118), # sky
    (251, 191, 36): (118, 118, 118), # amber
    (217, 119, 6): (92, 92, 92),     # amber-dark
    (148, 163, 184): (143, 143, 143),# slate
    (148, 179, 200): (143, 143, 143),# cosmos-slate
    (15, 23, 42): (1, 0, 0),         # slate-900
    (2, 6, 23): (1, 0, 0),
    (231, 55, 37): (231, 55, 37),    # already brand (no-op, keeps map total)
}

RGBA_RE = re.compile(r"rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})")


def map_rgba(m):
    r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if (r, g, b) in RGBA_MAP:
        nr, ng, nb = RGBA_MAP[(r, g, b)]
        return m.group(0).replace(f"{r}", str(nr), 1)  # placeholder, replaced below
    return m.group(0)


def apply_rgba(text):
    def repl(m):
        r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if (r, g, b) in RGBA_MAP and (r, g, b) != RGBA_MAP[(r, g, b)]:
            nr, ng, nb = RGBA_MAP[(r, g, b)]
            head = m.group(0)[:m.group(0).index("(") + 1]
            return f"{head}{nr}, {ng}, {nb}"
        return m.group(0)
    return RGBA_RE.sub(repl, text)


def apply_hex(text):
    def repl(m):
        h = m.group(0).lower()
        return HEX_MAP.get(h, m.group(0))
    return re.sub(r"#[0-9A-Fa-f]{6}\b", repl, text)


EXCLUDE = {"variables.css", "design-tokens.css"}
EXTS = (".tsx", ".ts", ".jsx", ".js", ".css")


def process(root, do_classes):
    changed = []
    for dirpath, _, files in os.walk(root):
        if "node_modules" in dirpath or "/dist/" in dirpath or "/.expo/" in dirpath:
            continue
        for fn in files:
            if not fn.endswith(EXTS) or fn in EXCLUDE:
                continue
            path = os.path.join(dirpath, fn)
            with open(path, encoding="utf-8") as f:
                orig = f.read()
            text = orig
            if do_classes and (fn.endswith((".tsx", ".jsx", ".ts", ".js"))):
                text = CLASS_RE.sub(map_class, text)
            text = apply_hex(text)
            text = apply_rgba(text)
            if text != orig:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(text)
                changed.append(path)
    return changed


if __name__ == "__main__":
    targets = sys.argv[1:]
    total = []
    for t in targets:
        root, _, flag = t.partition(":")
        total += process(root, flag != "noclass")
    for p in sorted(total):
        print(p)
    print(f"\nTOTAL FILES CHANGED: {len(total)}")
