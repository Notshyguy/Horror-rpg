import { useState } from "react";

// ─── Nav ────────────────────────────────────────────────────────────────────
const sections = [
  { id: "philosophy", label: "Philosophy" },
  { id: "setup",      label: "Project Setup" },
  { id: "claudemd",  label: "CLAUDE.md" },
  { id: "commands",  label: "Custom Commands" },
  { id: "phases",    label: "Phase Prompts" },
  { id: "codegen",   label: "Code Generation" },
  { id: "levels",    label: "Level Pipeline" },
  { id: "hooks",     label: "Hooks & CI" },
  { id: "human",     label: "What YOU Do" },
];

// ─── Shared Components ───────────────────────────────────────────────────────
const Code = ({ children, lang }) => (
  <pre style={{
    background:"#080c12", border:"1px solid #1e2530", borderRadius:"8px",
    padding:"18px 20px", overflowX:"auto", fontSize:"12.5px", lineHeight:"1.75",
    color:"#cdd9e5", fontFamily:"'JetBrains Mono','Fira Code',monospace", margin:"14px 0",
  }}><code>{children}</code></pre>
);

const Chip = ({ children, color="#38bdf8" }) => (
  <span style={{
    display:"inline-block", background:color+"1a", border:`1px solid ${color}`,
    color:color, borderRadius:"4px", padding:"2px 9px", fontSize:"11px",
    fontWeight:"700", margin:"2px", letterSpacing:"0.3px",
  }}>{children}</span>
);

const Alert = ({ type="info", children }) => {
  const t = {
    info:   { bg:"#051929", b:"#38bdf8", icon:"ℹ" },
    tip:    { bg:"#021a0a", b:"#4ade80", icon:"✓" },
    warn:   { bg:"#1c1200", b:"#fbbf24", icon:"⚠" },
    danger: { bg:"#1c0505", b:"#f87171", icon:"✖" },
    claude: { bg:"#0e0a1f", b:"#a78bfa", icon:"⬡" },
  }[type];
  return (
    <div style={{ background:t.bg, borderLeft:`4px solid ${t.b}`, borderRadius:"6px",
      padding:"12px 16px", margin:"14px 0", fontSize:"13.5px", color:"#c8d3dc",
      display:"flex", gap:"10px", alignItems:"flex-start" }}>
      <span style={{ color:t.b, fontWeight:"800", flexShrink:0, fontSize:"15px" }}>{t.icon}</span>
      <span style={{ lineHeight:"1.6" }}>{children}</span>
    </div>
  );
};

const H2 = ({ children }) => (
  <h2 style={{ fontSize:"20px", fontWeight:"800", color:"#e2eaf3", marginBottom:"20px",
    paddingBottom:"10px", borderBottom:"2px solid #38bdf8", letterSpacing:"-0.4px" }}>
    {children}
  </h2>
);

const H3 = ({ children }) => (
  <h3 style={{ fontSize:"12px", fontWeight:"700", color:"#60a5fa", marginBottom:"10px",
    textTransform:"uppercase", letterSpacing:"1.2px", marginTop:"28px" }}>
    {children}
  </h3>
);

const P = ({ children }) => (
  <p style={{ color:"#a8b8c8", fontSize:"14px", lineHeight:"1.8", margin:"10px 0" }}>{children}</p>
);

const Table = ({ headers, rows }) => (
  <div style={{ overflowX:"auto", margin:"14px 0" }}>
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
      <thead>
        <tr>{headers.map(h=>(
          <th key={h} style={{ background:"#111820", color:"#60a5fa", padding:"9px 14px",
            textAlign:"left", borderBottom:"2px solid #38bdf8", fontSize:"11px",
            textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:"700" }}>{h}</th>
        ))}</tr>
      </thead>
      <tbody>{rows.map((row,i)=>(
        <tr key={i} style={{ background: i%2===0?"#080c12":"#0c1117" }}>
          {row.map((cell,j)=>(
            <td key={j} style={{ padding:"9px 14px", color:"#b0bec8",
              borderBottom:"1px solid #1e2530" }}>{cell}</td>
          ))}
        </tr>
      ))}</tbody>
    </table>
  </div>
);

// ─── Section: Philosophy ─────────────────────────────────────────────────────
const PhilosophySection = () => (
  <div>
    <H2>Claude Code as Your Lead Developer</H2>
    <P>
      The original plan treated Claude Code as a helper. This plan flips that entirely.
      Claude Code <em>is</em> the developer. You are the product owner and QA engineer.
      Your job is to write precise prompts, review diffs, run the game on a device, and
      make taste-level decisions. Claude Code writes every file, runs every script,
      and manages the entire codebase.
    </P>

    <Alert type="claude">
      <strong>The core principle:</strong> If it can be expressed as a task in natural
      language, Claude Code does it. Architecture, boilerplate, algorithms, level generation,
      JSON schemas, export config, Godot theme files — all of it. You only touch the keyboard
      to write prompts and approve diffs.
    </Alert>

    <H3>Division of Labor</H3>
    <Table
      headers={["Task", "Who Does It", "How"]}
      rows={[
        ["Godot project scaffold", "Claude Code", "One prompt, generates all folders + files"],
        ["PuzzleLogic.gd algorithm", "Claude Code", "Prompt with spec → full file written"],
        ["BFS level generator + solver", "Claude Code", "Prompt → writes + self-tests the script"],
        ["Batch generate 600 levels", "Claude Code", "Headless: `claude -p` runs the generator"],
        ["Curate best 500 levels", "Claude Code", "Headless: reads JSON, scores, outputs curated set"],
        ["All GDScript files", "Claude Code", "Prompt per system → full implementations"],
        ["CLAUDE.md maintenance", "Claude Code", "Updates it as architecture evolves"],
        ["AdMob integration", "Claude Code", "Reads plugin docs, writes AdManager.gd"],
        ["Export preset config", "Claude Code", "Writes export_presets.cfg from your requirements"],
        ["Git commits", "Claude Code", "Stages + writes commit messages after each task"],
        ["Bug fixes", "Claude Code", "You describe the bug, it diffs + fixes"],
        ["Refactors", "Claude Code", "Single prompt to restructure a system"],
        ["Game mechanic decisions", "YOU", "Choose flood-fill, color count, grid sizes"],
        ["Ad ID configuration", "YOU", "Paste real AdMob IDs into one config file"],
        ["Device testing", "YOU", "Run on physical Android/iOS, report issues"],
        ["Store listing copy", "YOU (+ Claude)", "Claude drafts, you approve"],
        ["Apple Developer account", "YOU", "Irreplaceable — requires your identity + $99"],
      ]}
    />

    <H3>What Claude Code Can Do That Changes Everything</H3>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"10px", margin:"12px 0" }}>
      {[
        { icon:"📂", title:"Reads your whole project", desc:"Understands every file before writing anything. No context lost." },
        { icon:"🔀", title:"Edits across multiple files", desc:"One prompt can update 10 files simultaneously, keeping them consistent." },
        { icon:"⚙️", title:"Runs scripts & tests", desc:"Executes GDScript runners, Python generators, bash scripts inline." },
        { icon:"🤖", title:"Headless / non-interactive", desc:"`claude -p` runs fully automated — no keyboard needed for batch tasks." },
        { icon:"🪝", title:"Hooks on file save", desc:"PostToolUse hooks auto-run GDScript linting after every edit." },
        { icon:"📋", title:"Custom slash commands", desc:"`.claude/commands/` gives you reusable one-word prompts for repeat tasks." },
        { icon:"💬", title:"Git-aware", desc:"Reads commit history, stages changes, writes semantic commit messages." },
        { icon:"🔁", title:"Iterates on failures", desc:"If a script errors, it reads the output and fixes itself." },
      ].map(c=>(
        <div key={c.title} style={{ background:"#0c1117", border:"1px solid #1e2530",
          borderRadius:"8px", padding:"14px" }}>
          <div style={{ fontSize:"20px", marginBottom:"6px" }}>{c.icon}</div>
          <div style={{ color:"#e2eaf3", fontWeight:"700", fontSize:"13px", marginBottom:"4px" }}>{c.title}</div>
          <div style={{ color:"#6b7c8d", fontSize:"12px", lineHeight:"1.5" }}>{c.desc}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Section: Setup ──────────────────────────────────────────────────────────
const SetupSection = () => (
  <div>
    <H2>Project Setup</H2>
    <P>Before Claude Code writes a single GDScript line, you do five minutes of manual setup. That's it.</P>

    <H3>Step 1 — Install Claude Code</H3>
    <Code>{`npm install -g @anthropic-ai/claude-code
claude  # authenticate once with your Anthropic account`}</Code>

    <H3>Step 2 — Create the empty Godot project</H3>
    <Alert type="tip">Open Godot 4.x, create a new project called "shift", close Godot. That's all. Claude Code takes it from here.</Alert>
    <Code>{`mkdir ~/shift && cd ~/shift
# Open Godot 4 → New Project → Mobile → Create
# Then close Godot — Claude Code works on the files directly`}</Code>

    <H3>Step 3 — Initialize Claude Code in the project root</H3>
    <Code>{`cd ~/shift
claude  # Start interactive session

# Your first prompt:
"This is a Godot 4.x mobile puzzle game called Shift. 
It's a free-to-play flood-fill color puzzle with 500+ levels, 
AdMob monetization, and a minimalist flat art style targeting 
Android and iOS. Please create the complete project directory 
structure with all folders, placeholder files, and a CLAUDE.md 
that documents the architecture. Use the structure we discussed:
scenes/, scripts/autoload/, levels/, assets/, addons/."
`}</Code>

    <H3>Step 4 — Let Claude Code scaffold everything</H3>
    <P>Claude Code will create every folder, every placeholder .gd file, the project.godot autoload config, and the CLAUDE.md. Review the diff, approve it. Total time: ~2 minutes of watching Claude work.</P>

    <Alert type="warn">
      You need Godot 4.x installed for Claude Code to run GDScript validation. Install it and add
      the Godot binary to your PATH so Claude can invoke it: <code>godot --headless --script</code>.
    </Alert>

    <H3>Step 5 — Configure .claude/ directory</H3>
    <Code>{`shift/
└── .claude/
    ├── commands/          # Custom slash commands (see Commands section)
    │   ├── gen-levels.md
    │   ├── run-solver.md
    │   ├── new-scene.md
    │   ├── fix-exports.md
    │   └── commit.md
    └── settings.json      # Permissions and hooks`}</Code>

    <Code>{`// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Bash(godot --headless*)",
      "Bash(python3 scripts/*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(git diff*)",
      "Read(**)",
      "Write(scripts/**)",
      "Write(scenes/**)",
      "Write(levels/**)",
      "Write(assets/**)",
      "Write(CLAUDE.md)",
      "Write(.claude/**)"
    ],
    "deny": [
      "Bash(rm -rf*)",
      "Bash(git push*)"    
    ]
  }
}`}</Code>
    <Alert type="info">
      <code>git push</code> is blocked intentionally — you review and push manually. Claude Code
      stages and commits; you are the final gate before anything leaves your machine.
    </Alert>
  </div>
);

// ─── Section: CLAUDE.md ──────────────────────────────────────────────────────
const ClaudeMdSection = () => (
  <div>
    <H2>CLAUDE.md — The Project Brain</H2>
    <P>
      CLAUDE.md is the single most important file in a Claude Code project. It's automatically
      loaded at the start of every session, giving Claude full project context without you
      re-explaining anything. Claude Code also updates it when the architecture changes.
    </P>
    <Alert type="claude">
      Think of CLAUDE.md as the onboarding doc Claude Code writes for itself. Every architectural
      decision, every naming convention, every file's purpose lives here. A well-maintained
      CLAUDE.md means zero context-setting at the start of every session.
    </Alert>

    <H3>Full CLAUDE.md Template</H3>
    <Code>{`# CLAUDE.md — Shift: Mobile Puzzle Game

## Project Overview
Godot 4.x mobile puzzle game. Free-to-play, flood-fill mechanic, 500+ levels.
Targets Android (AAB) and iOS (Xcode project). AdMob monetization (banner + 
interstitial + rewarded). Minimalist flat art style.

## Architecture

### Autoloads (always available, no import needed)
- GameManager   — scene transitions, current level tracking, win/lose flow
- SaveManager   — user://save.json read/write, level unlock/star logic
- AdManager     — AdMob wrapper, interstitial every 4 completions
- AudioManager  — sfx (AudioStreamPlayer) + music loop
- EventBus      — global signal bus, decouples scenes from each other

### Core Scripts
- PuzzleLogic.gd     — pure logic, no Node visuals, flood-fill state machine
- BoardRenderer.gd   — Control node, renders grid as ColorRect array, tween anims
- LevelLoader.gd     — loads res://levels/levels.json, returns Dictionary by id
- LevelGenerator.gd  — procedural BFS generator + solver (run offline to generate)
- HintManager.gd     — calls LevelGenerator.solve() on current board state
- SaveManager.gd     — FileAccess to user://save.json, see schema below

### Signal Flow
ColorButton pressed
  → Game._on_color_button_pressed(color_idx)
  → PuzzleLogic.apply_move(color_idx)
  → PuzzleLogic emits move_made / board_solved / board_failed
  → Game._on_* handlers → BoardRenderer.animate_flood() + HUD.update()
  → On board_solved → GameManager.complete_level() → AdManager (maybe interstitial)
  → WinScreen.show_result(stars)

### Level Data Format (levels/levels.json)
Array of objects:
{
  "id": 1,           // 1-based integer
  "size": 6,         // grid dimension (NxN)
  "colors": 4,       // number of colors (0-indexed)
  "moves": 14,       // player's move limit
  "optimal": 9,      // BFS optimal move count (for star rating)
  "difficulty": "easy",  // tutorial | easy | medium | hard | expert
  "grid": [[...]]    // 2D array, size×size, values 0..colors-1
}

### Star Rating
- 3 stars: moves_used <= optimal + 1
- 2 stars: moves_used <= move_limit * 0.75
- 1 star:  completed (any move count)

### Save File Schema (user://save.json)
{
  "version": 1,
  "last_played_level": 1,
  "levels": { "42": { "stars": 3, "best_moves": 10 } },
  "settings": { "sfx_volume": 1.0, "music_volume": 0.6, "haptics": true },
  "ads": { "levels_since_interstitial": 0 }
}

### Color Palette
0: #e74c3c (Red)    1: #3498db (Blue)   2: #2ecc71 (Green)
3: #f39c12 (Orange) 4: #9b59b6 (Purple) 5: #1abc9c (Teal)
Background: #080c12  Surface: #0d1420   Text: #e2eaf3

### Typography
Single font family: Outfit (Google Fonts)
Weights used: 400 (body), 600 (labels), 800 (display/numbers)

### Viewport & Stretch
Viewport: 390×844  Stretch mode: canvas_items  Aspect: expand
Orientation: portrait

### Difficulty Tiers
tutorial: levels 1-20,   size 5, colors 3, mult 2.5x optimal
easy:     levels 21-150, size 6, colors 4, mult 2.0x optimal
medium:   levels 151-300, size 8, colors 5, mult 1.6x optimal  
hard:     levels 301-450, size 10, colors 6, mult 1.3x optimal
expert:   levels 451-500+, size 12, colors 6, mult 1.15x optimal

## Conventions
- GDScript: snake_case everywhere, type annotations on all public functions
- Signals: verb_noun format (move_made, board_solved, level_completed)
- Scene names: PascalCase.tscn, script names: PascalCase.gd
- Constants in ALL_CAPS, private vars prefixed with _
- All @onready vars at top of script before other vars
- Use EventBus for cross-scene signals, direct signals for parent→child

## AdMob
Plugin: github.com/poingstudios/godot-admob-plugin
Test IDs used during development (NEVER commit real IDs):
  BANNER_ANDROID:        ca-app-pub-3940256099942544/6300978111
  INTERSTITIAL_ANDROID:  ca-app-pub-3940256099942544/1033173712
  REWARDED_ANDROID:      ca-app-pub-3940256099942544/5224354917
Real IDs: stored in res://config/admob_ids.json (gitignored)

## Git Conventions
Branch: main
Commit format: type(scope): description
Types: feat, fix, chore, refactor, perf, docs
Examples: feat(puzzle): add BFS solver to LevelGenerator
          chore(levels): batch generate 600 levels, curate to 500
          fix(ads): prevent interstitial before first level completes

## Files Claude Should Never Modify
- config/admob_ids.json (real ad IDs, gitignored)
- export_presets.cfg keystore fields
- user://save.json (runtime only, not in repo)
`}</Code>
  </div>
);

// ─── Section: Commands ───────────────────────────────────────────────────────
const CommandsSection = () => (
  <div>
    <H2>Custom Slash Commands</H2>
    <P>
      Custom commands live in <code>.claude/commands/*.md</code>. Type <code>/gen-levels</code> in
      the Claude Code terminal and it executes the full instruction. These are your power tools —
      they turn complex multi-step tasks into single words.
    </P>

    <H3>/gen-levels — Batch generate the full level set</H3>
    <Code>{`# .claude/commands/gen-levels.md

Run the level generation pipeline:

1. Execute: \`godot --headless --script scripts/LevelGenerator.gd\`
   with arguments to generate 650 levels across all difficulty tiers:
   - Tutorial: 25 levels, size=5, colors=3, mult=2.5
   - Easy: 175 levels, size=6, colors=4, mult=2.0
   - Medium: 175 levels, size=8, colors=5, mult=1.6
   - Hard: 175 levels, size=10, colors=6, mult=1.3
   - Expert: 100 levels, size=12, colors=6, mult=1.15

2. Read the output JSON. Filter out any levels where:
   - optimal move count == 0 (unsolvable)
   - optimal move count > 40 (too complex for BFS)
   - grid has any row that is entirely one color (too easy visually)

3. Sort by difficulty tier, then by optimal move count ascending within each tier.

4. Renumber level IDs 1..N sequentially.

5. Keep the best 520 levels (trim easy/medium if over quota).

6. Write the final array to levels/levels.json

7. Print a summary: total levels per tier, min/max/avg optimal moves per tier.

8. Commit: \`git add levels/levels.json && git commit -m "chore(levels): generate 520 levels across 5 tiers"\`
`}</Code>

    <H3>/new-scene — Scaffold a new scene + script</H3>
    <Code>{`# .claude/commands/new-scene.md

Create a new Godot scene. The user will specify the scene name and type.

1. Create scenes/{SceneName}.tscn with appropriate root node type:
   - "screen" → Control root
   - "popup" → Control root (CanvasLayer parent)  
   - "component" → Control root
   - "game_node" → Node2D root

2. Create scripts/{SceneName}.gd with:
   - Correct class structure
   - @onready vars for expected child nodes
   - _ready() stub
   - Signal connections documented in comments
   - Any signals this scene emits declared at top

3. Register in the correct autoload or parent scene as appropriate.

4. Update CLAUDE.md if this is a significant new system.

5. Commit: \`git commit -m "feat(scenes): add {SceneName}"\`
`}</Code>

    <H3>/fix-exports — Repair and validate export configs</H3>
    <Code>{`# .claude/commands/fix-exports.md

Audit and repair the Godot export configuration:

1. Read export_presets.cfg
2. Verify Android preset has:
   - use_gradle_build=true
   - permissions/internet=true (needed for AdMob)
   - package/unique_name set correctly
   - version/code incremented from current
3. Verify iOS preset has:
   - bundle identifier set
   - Required Info.plist keys for AdMob ATT
4. Check that the AdMob plugin is listed in the Android modules
5. Report any issues found and fix them
6. Do NOT modify keystore paths or passwords
`}</Code>

    <H3>/commit — Smart semantic commit</H3>
    <Code>{`# .claude/commands/commit.md

Review all staged and unstaged changes with \`git diff\` and \`git status\`.
Write a semantic commit message that accurately describes ALL changes.
Use the format: type(scope): description

Then run:
  git add -A
  git commit -m "{your message}"

Print the commit hash and message when done.
If there are no changes, say so and stop.
`}</Code>

    <H3>/audit — Full project health check</H3>
    <Code>{`# .claude/commands/audit.md

Run a full project audit:

1. Check all GDScript files for:
   - Missing type annotations on public functions
   - Signals that are emitted but never declared
   - @onready vars referencing nodes that don't exist in the .tscn
   - print() calls that should be removed before release

2. Check levels/levels.json:
   - All levels have required fields (id, size, colors, moves, optimal, grid)
   - IDs are sequential starting at 1
   - No duplicate IDs
   - Grid dimensions match size field

3. Check CLAUDE.md is up to date with current file structure

4. List any TODO/FIXME/HACK comments across all scripts

5. Report everything found. Fix only the GDScript issues — don't touch levels.json.
`}</Code>

    <H3>/daily-puzzle — Generate this week's daily puzzles</H3>
    <Code>{`# .claude/commands/daily-puzzle.md

Generate 7 daily puzzles for the coming week.

1. Use the LevelGenerator solver to produce 7 levels:
   - Days 1-2: size=8, colors=5, mult=1.4 (moderate)
   - Days 3-5: size=10, colors=6, mult=1.3 (challenging)
   - Days 6-7: size=12, colors=6, mult=1.2 (expert)

2. Each must have a unique optimal solution count (no two the same)

3. Assign dates starting from next Monday

4. Append to levels/daily/daily_puzzles.json

5. Commit with: \`chore(daily): add 7 daily puzzles for [date range]\`
`}</Code>
  </div>
);

// ─── Section: Phase Prompts ──────────────────────────────────────────────────
const PhasesSection = () => (
  <div>
    <H2>Phase-by-Phase Prompts</H2>
    <P>Each phase is a single Claude Code session. Start the session, paste the prompt, let it run, review the diff, approve. You are the reviewer — not the author.</P>
    <Alert type="claude">
      These prompts are written to be pasted verbatim into Claude Code. They're explicit, scoped, and
      reference CLAUDE.md so Claude has all context it needs. Claude Code will read existing files,
      write new ones, run validation scripts, and commit — all in one session.
    </Alert>

    {[
      {
        phase: "01", title: "Core Algorithm", color:"#38bdf8",
        duration: "~45 min Claude, 10 min review",
        prompt: `Write the complete PuzzleLogic.gd script as defined in CLAUDE.md.

Requirements:
- Board stored as Array of Arrays (2D, y-indexed first: board[y][x])
- init_board(data: Dictionary) initializes from a level data dict
- apply_move(color: int) floods the board, emits move_made signal  
- _compute_region() uses iterative BFS (not recursive, to avoid stack overflow on 12x12)
- _board_is_solved() checks player_region.size() == board_size * board_size
- All public functions have type annotations
- Emit board_solved when complete, board_failed when moves exhausted

After writing the script, write a GDScript test runner at scripts/tests/test_puzzle_logic.gd
that programmatically tests:
1. A 3x3 board can be solved in 1 move
2. apply_move with the same color as current region is a no-op
3. move_limit is respected and board_failed fires correctly
4. player_region covers entire board when board_solved fires

Run the tests via: godot --headless --script scripts/tests/test_puzzle_logic.gd
Fix any failures before finishing. Then commit.`,
        deliverable: "PuzzleLogic.gd + passing test suite"
      },
      {
        phase: "02", title: "Level Generator & Solver", color:"#4ade80",
        duration: "~60 min Claude, 15 min review",
        prompt: `Write LevelGenerator.gd as a full GDScript tool script (tool annotation).

The script must:
1. Implement BFS flood simulation (_apply_flood, _bfs_region, _encode)
2. Implement solve(grid, size, num_colors, depth_limit) → Array of color ints
3. Implement generate_level(size, num_colors, difficulty_mult) → Dictionary
   - Try up to 500 random boards, solve each, return first valid one
   - Return empty dict if all attempts fail
4. Implement batch_generate(output_path, tiers: Array) where each tier is:
   { size, colors, difficulty_mult, count, difficulty_label }
5. When run as a tool script (via godot --headless --script), 
   call batch_generate with the 5 tiers from CLAUDE.md and write to levels/levels.json

After writing:
1. Run: godot --headless --script scripts/LevelGenerator.gd
2. Verify levels/levels.json exists and has 500+ entries
3. Run a quick validation: confirm all levels parse correctly and have required fields
4. Print a summary table (tier, count, avg optimal moves)
5. Commit everything`,
        deliverable: "LevelGenerator.gd + levels/levels.json with 500+ levels"
      },
      {
        phase: "03", title: "All Autoloads", color:"#fb923c",
        duration: "~40 min Claude, 10 min review",
        prompt: `Write all 5 autoload scripts as specified in CLAUDE.md:

1. EventBus.gd — declare all signals listed in the signal flow section
2. SaveManager.gd — full FileAccess implementation with:
   - load_save(), save(), _default_save()
   - complete_level(), is_level_unlocked(), get_level_stars()
   - get/set_setting(), interstitial counter helpers
3. GameManager.gd — scene transitions, calculate_stars(), complete_level()
4. AudioManager.gd — preloaded SFX dict, play(), set volumes
5. AdManager.gd — full AdMob wrapper with test IDs, banner/interstitial/rewarded
   Include the UMP consent stub (placeholder methods, real implementation in Phase 5)

Register all 5 in project.godot autoload section.

Write them in order. After each one, check that it has no parse errors by running:
  godot --headless --check-only scripts/autoload/{Name}.gd

Fix any parse errors before moving to the next script. Commit when all 5 pass.`,
        deliverable: "5 autoload scripts, all parse-clean"
      },
      {
        phase: "04", title: "Game Scene + Renderer", color:"#c084fc",
        duration: "~50 min Claude, 15 min review",
        prompt: `Build the complete playable game scene.

Create these files:
1. scripts/LevelLoader.gd — loads levels/levels.json, get_level(id), get_total_levels()
2. scripts/BoardRenderer.gd — Control node:
   - setup(size): builds ColorRect grid with 3dp gaps, rounded corners via StyleBoxFlat
   - render_board(board): sets all cell colors instantly
   - animate_flood(cells: Array, new_color: Color): staggered tween, 8ms per cell,
     scale bounce 1.0→1.1→1.0 over 120ms per cell
3. scenes/components/ColorButton.tscn + scripts — pill-shaped button, 72×72dp,
   emits pressed(color_index: int), stores color_index as export var
4. scenes/ui/HUD.tscn + scripts/HUD.gd:
   - set_level(id), set_moves(limit), update_moves(left), set_colors(num)
   - highlight_hint(color_idx) — 3x scale pulse on button
   - Flash moves label red when moves_left <= 3
5. scenes/Game.tscn with full scene tree from CLAUDE.md
6. scripts/Game.gd — wires PuzzleLogic signals to BoardRenderer + HUD

After all files are written, open project in Godot to confirm scene tree is valid.
(You can do this by running: godot --headless --export-debug to check for scene errors)
Commit.`,
        deliverable: "Fully playable single game scene"
      },
      {
        phase: "05", title: "Menus & Full Flow", color:"#f472b6",
        duration: "~45 min Claude, 10 min review",
        prompt: `Build the complete menu and navigation flow.

1. scenes/MainMenu.tscn + script:
   - Play button → LevelSelect
   - Settings button → SettingsPopup
   - Daily Puzzle button → DailyPuzzle scene
   - Show total stars earned and levels completed

2. scenes/LevelSelect.tscn + script:
   - Paginated grid, 20 levels per page
   - Each cell: level number, star display (0-3), lock icon if locked
   - Prev/Next page buttons, current page label
   - Scroll to last played level on open

3. scenes/ui/WinScreen.tscn + script:
   - Star animation: stars drop in sequentially with bounce tween
   - Show moves used vs move limit
   - Next Level, Retry, Menu buttons

4. scenes/ui/LoseScreen.tscn + script:
   - Show moves limit reached message
   - Retry (free) and Watch Ad for extra 3 moves (rewarded ad) buttons
   - Menu button

5. scenes/ui/SettingsPopup.tscn + script:
   - SFX volume slider, Music volume slider, Haptics toggle
   - Changes persist to SaveManager immediately

6. scenes/ui/PauseMenu.tscn — Resume, Restart, Menu buttons

Wire all scene transitions through GameManager. Commit.`,
        deliverable: "Complete navigable game with all screens"
      },
      {
        phase: "06", title: "AdMob + Consent", color:"#f87171",
        duration: "~30 min Claude, 20 min manual testing",
        prompt: `Complete the AdMob integration.

1. Install the godot-admob-plugin from github.com/poingstudios/godot-admob-plugin
   by writing the plugin download + install instructions as a script: scripts/setup/install_admob.sh
   (I will run this manually on my machine)

2. Complete AdManager.gd:
   - Check if Engine.has_singleton("AdMob") before any calls (editor safety)
   - connect all AdMob signals in _connect_signals()
   - Preload next interstitial immediately after one closes
   - show_banner() called from MainMenu and LevelSelect _ready()
   - hide_banner() called from Game._ready()
   - Interstitial triggered in GameManager.complete_level() every 4 completions
   - show_rewarded_ad() connected to LoseScreen "watch ad" button and HUD hint button
   - On reward earned: emit EventBus.ad_reward_earned("hint") or ("extra_moves")

3. Implement extra-moves reward in Game.gd:
   - When ad_reward_earned("extra_moves") fires, add 3 to puzzle.move_limit
   - Update HUD moves display
   - This can only happen once per level attempt

4. Add GDPR UMP consent stubs (real UMP SDK calls commented with TODO markers)

5. Create config/admob_ids.json (with placeholder values) and add to .gitignore

Print a test checklist of what to manually verify on a physical device. Commit.`,
        deliverable: "Full ad integration ready for device testing"
      },
      {
        phase: "07", title: "Polish & Juice", color:"#34d399",
        duration: "~40 min Claude, 20 min feel testing",
        prompt: `Add all the game feel and polish.

1. Apply the color palette and font from CLAUDE.md globally:
   - Create assets/themes/main_theme.tres with Outfit font, correct colors
   - Apply theme to all scenes

2. Enhance BoardRenderer animations:
   - Win animation: all cells do a ripple wave from [0,0] outward
   - Solve flash: board briefly goes white then returns to colors
   - Cell hover state (subtle scale 1.02 on touch)

3. AudioManager: confirm all 5 SFX preloads exist or create 1-frame placeholder WAV files
   so the game doesn't crash on missing audio

4. Add haptic feedback (Input.vibrate_handheld(50)) on:
   - Every move
   - Win (longer: 150ms)
   - Fail (two short pulses)
   Guard all haptic calls with OS.get_name() == "Android" or "iOS"

5. Add a subtle particle burst (CPUParticles2D) on board solved

6. Animate level select: cards fade in with stagger delay on page load

7. Add a move counter shake animation when moves_left == 0

8. Ensure all touch targets are >= 48px in all scenes

Commit.`,
        deliverable: "Polished game with animations and haptics"
      },
      {
        phase: "08", title: "Export Config", color:"#60a5fa",
        duration: "~20 min Claude, 30 min manual signing setup",
        prompt: `Configure exports for both platforms.

1. Write export_presets.cfg for Android:
   - Platform: Android
   - use_gradle_build=true
   - gradle_build_directory=android/build
   - package/unique_name=com.yourstudio.shift
   - permissions/internet=true
   - screen/immersive_mode=true
   - version/code=1, version/name=1.0.0
   - List any required AdMob plugin module entries

2. Write export_presets.cfg iOS section:
   - Bundle identifier placeholder
   - Required Info.plist entries for AdMob ATT
   - NSUserTrackingUsageDescription string

3. Write a README_EXPORT.md with step-by-step instructions for:
   - Generating an Android release keystore
   - Adding keystore path/password to export_presets.cfg (gitignored fields)
   - Setting up iOS signing in Xcode
   - Running the export from command line: godot --headless --export-release

4. Create .gitignore entries for:
   - *.keystore
   - config/admob_ids.json
   - android/build/ (generated)
   - *.apk, *.aab, *.ipa

Commit everything except the gitignored files.`,
        deliverable: "Export-ready project with documented signing process"
      },
    ].map(p => (
      <div key={p.phase} style={{
        background:"#080c12", border:"1px solid #1e2530",
        borderTop:`3px solid ${p.color}`, borderRadius:"8px",
        padding:"20px", marginBottom:"20px",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"14px", flexWrap:"wrap" }}>
          <div style={{ background:p.color, color:"#000", width:"30px", height:"30px",
            borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:"800", fontSize:"13px", flexShrink:0 }}>{p.phase}</div>
          <div style={{ color:"#e2eaf3", fontWeight:"700", fontSize:"16px" }}>{p.title}</div>
          <Chip color={p.color}>{p.duration}</Chip>
          <Chip color="#6b7c8d">✓ {p.deliverable}</Chip>
        </div>
        <div style={{ color:"#6b7c8d", fontSize:"11px", fontWeight:"700", textTransform:"uppercase",
          letterSpacing:"1px", marginBottom:"6px" }}>Prompt to paste into Claude Code:</div>
        <pre style={{ background:"#04080e", border:"1px dashed #38bdf822", borderRadius:"6px",
          padding:"14px 16px", fontSize:"12.5px", lineHeight:"1.75", color:"#a8b8c8",
          whiteSpace:"pre-wrap", margin:"0", fontFamily:"inherit" }}>{p.prompt}</pre>
      </div>
    ))}
  </div>
);

// ─── Section: Code Generation ─────────────────────────────────────────────────
const CodeGenSection = () => (
  <div>
    <H2>Mid-Session Prompt Patterns</H2>
    <P>Use these prompt patterns during a session when you need targeted help inside an existing phase.</P>

    <H3>Bug Report → Fix</H3>
    <Code>{`# When the game crashes or behaves wrong, describe it precisely:

"When I complete level 47 and the win screen appears, tapping 
Next Level crashes with error: 
  E 0:00:14:234   Game.gd:83 @ _on_next_level_pressed(): 
  Node not found: 'WinScreen' in path '/root/Game'

The WinScreen is a CanvasLayer added in Game.tscn. 
Fix the node path reference in Game.gd."

# Claude Code will:
# 1. Read Game.gd and Game.tscn
# 2. Find the incorrect path
# 3. Fix it
# 4. Check for similar issues elsewhere
# 5. Commit the fix`}</Code>

    <H3>Performance Investigation</H3>
    <Code>{`"The game stutters on first move for large levels (size 12).
Profile the issue: look at BoardRenderer.animate_flood() and 
PuzzleLogic.apply_move(). Identify where the frame spike is 
happening and optimize. The staggered tween loop might be 
creating 144 Tween objects. Consider batching or using a 
single tween with method calls."`}</Code>

    <H3>Feature Addition (Mid-Phase)</H3>
    <Code>{`"Add a 'No Ads' banner to the main menu that appears if the 
player has been playing for more than 7 days (check save file 
first_played_date). Tapping it should show a placeholder 
'coming soon' popup for now. Don't implement actual IAP — 
just the UI hook. Keep it small and non-intrusive."

# Claude Code will:
# 1. Add first_played_date to save schema
# 2. Update SaveManager._default_save()
# 3. Add the banner to MainMenu.tscn
# 4. Wire the popup
# 5. Update CLAUDE.md with the new save field`}</Code>

    <H3>Asking for a Design Review</H3>
    <Code>{`"Read all 5 autoload scripts and the Game.gd controller. 
Identify:
1. Any coupling that should go through EventBus instead of direct calls
2. Any save() calls that could be batched (we're saving too often)
3. Any missing error handling (file not found, malformed JSON)
4. Any signals declared but never connected

Don't change anything yet — just report your findings as a list."`}</Code>

    <H3>Headless Automation (no interactive session needed)</H3>
    <Code>{`# Re-generate levels without opening a Claude Code session:
claude -p "Run /gen-levels" --dangerously-skip-permissions

# Run the full audit overnight:
claude -p "Run /audit and save the report to docs/audit_$(date +%Y-%m-%d).md" \\
  --dangerously-skip-permissions

# Auto-commit after a review session:
claude -p "Run /commit" --allowedTools "Bash(git*)"

# Generate next week's daily puzzles every Sunday:
# Add to crontab: 0 9 * * 0 cd ~/shift && claude -p "/daily-puzzle" -p`}</Code>
  </div>
);

// ─── Section: Level Pipeline ──────────────────────────────────────────────────
const LevelPipelineSection = () => (
  <div>
    <H2>Level Generation Pipeline</H2>
    <P>The entire 500-level dataset is generated, validated, curated, and committed by Claude Code. You never touch a level file manually.</P>

    <Alert type="claude">
      The pipeline is a single <code>/gen-levels</code> command. Claude Code runs the Godot
      headless generator, reads the output, filters and curates, renumbers IDs, writes the final
      JSON, prints a summary, and commits. Total human time: 0 minutes.
    </Alert>

    <H3>Pipeline Flow</H3>
    <div style={{ position:"relative", paddingLeft:"28px" }}>
      {[
        { step:"1", title:"Run generator headless", detail:"godot --headless --script LevelGenerator.gd → outputs raw_levels.json (650 candidates)" },
        { step:"2", title:"Claude reads + validates", detail:"Parses every level, checks solvability flag, grid dimensions, required fields" },
        { step:"3", title:"Filter low-quality levels", detail:"Removes: uniform rows, extremely low optimal counts, BFS timeout failures" },
        { step:"4", title:"Score by difficulty", detail:"Computes difficulty score: optimal_moves × color_count × (board_size/5)" },
        { step:"5", title:"Curate to 520 levels", detail:"Picks best-distributed set across 5 tiers, even spread of difficulty scores" },
        { step:"6", title:"Renumber IDs 1..520", detail:"Sequential IDs, sorted tier→difficulty_score ascending" },
        { step:"7", title:"Write levels.json", detail:"Atomic write, pretty-printed JSON" },
        { step:"8", title:"Print summary + commit", detail:"Table: tier/count/avg-optimal. Semantic git commit." },
      ].map((s,i)=>(
        <div key={i} style={{ display:"flex", gap:"14px", marginBottom:"16px", position:"relative" }}>
          <div style={{ position:"absolute", left:"-28px", top:"2px", background:"#38bdf8",
            color:"#000", width:"20px", height:"20px", borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:"800", fontSize:"11px", flexShrink:0 }}>{s.step}</div>
          <div>
            <div style={{ color:"#e2eaf3", fontWeight:"600", fontSize:"14px" }}>{s.title}</div>
            <div style={{ color:"#6b7c8d", fontSize:"13px", marginTop:"2px" }}>{s.detail}</div>
          </div>
        </div>
      ))}
    </div>

    <H3>Regenerating Levels (Anytime)</H3>
    <Code>{`# Full regeneration (wipes and rebuilds):
/gen-levels

# Partial: add 20 more expert levels only:
"Generate 20 additional expert-tier levels (size=12, colors=6, mult=1.1).
Append to levels.json, continue ID numbering from last existing ID.
Run the BFS validator on each before adding."

# Fix a specific bad level:
"Level 342 has been reported as trivially easy (players solving in 
2 moves against a limit of 18). Remove it from levels.json and 
regenerate a replacement at the same difficulty slot. Renumber if needed."`}</Code>

    <H3>Level Quality Validation Prompt</H3>
    <Code>{`"Read levels/levels.json and run a quality audit:

1. For each level, check:
   - moves / optimal ratio (should be 1.15–2.5; flag outliers)
   - optimal moves is reasonable for grid size (5x5: 5-12, 12x12: 18-35)
   - grid has at least 3 distinct colors present (not trivially uniform)
   
2. Flag any levels that:
   - Have ratio > 2.5 (too forgiving — might bore players)
   - Have ratio < 1.1 (too tight — players can't solve without perfect play)
   - Have optimal == 1 (trivially solvable, shouldn't exist past level 5)

3. Print flagged levels as a table (id, tier, ratio, reason)
4. Ask me before removing any levels — just report for now."`}</Code>
  </div>
);

// ─── Section: Hooks & CI ──────────────────────────────────────────────────────
const HooksSection = () => (
  <div>
    <H2>Hooks & Automation</H2>
    <P>Hooks run automatically as Claude Code works. They enforce quality without you thinking about it.</P>

    <H3>settings.json Hooks</H3>
    <Code>{`// .claude/settings.json (full version with hooks)
{
  "permissions": {
    "allow": [
      "Bash(godot --headless*)",
      "Bash(python3 scripts/*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(git diff*)",
      "Bash(git status*)",
      "Bash(git log*)",
      "Read(**)",
      "Write(scripts/**)",
      "Write(scenes/**)",
      "Write(levels/**)",
      "Write(assets/**)",
      "Write(CLAUDE.md)",
      "Write(.claude/**)",
      "Write(project.godot)",
      "Write(export_presets.cfg)"
    ],
    "deny": [
      "Bash(rm -rf*)",
      "Bash(git push*)",
      "Bash(git reset --hard*)",
      "Write(config/admob_ids.json)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "bash -c 'if [[ \\"$CLAUDE_TOOL_INPUT_PATH\\" == *.gd ]]; then godot --headless --check-only \\"$CLAUDE_TOOL_INPUT_PATH\\" 2>&1 | grep -E \\"ERROR|Parse\\" || echo \\"GDScript OK\\"; fi'"
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "bash -c 'if [[ \\"$CLAUDE_TOOL_INPUT_PATH\\" == config/admob_ids.json ]]; then echo \\"BLOCKED: Never write real AdMob IDs\\" && exit 1; fi'"
        }]
      }
    ]
  }
}`}</Code>
    <Alert type="tip">
      The PostToolUse hook runs <code>godot --check-only</code> on every .gd file Claude writes.
      Parse errors surface immediately — Claude Code sees the output and self-corrects before
      moving to the next file. This eliminates an entire class of bugs.
    </Alert>

    <H3>Git Hooks (written by Claude Code in Phase 1)</H3>
    <Code>{`# .git/hooks/pre-commit (Claude Code writes this during setup)

#!/bin/bash
# Block commits containing real AdMob IDs
if git diff --cached --name-only | xargs grep -l "ca-app-pub-" 2>/dev/null | grep -v "AdManager.gd"; then
  echo "ERROR: Real AdMob IDs found outside AdManager.gd"
  echo "Move them to config/admob_ids.json (gitignored)"
  exit 1
fi

# Block committing broken GDScript
for f in $(git diff --cached --name-only | grep ".gd$"); do
  result=$(godot --headless --check-only "$f" 2>&1)
  if echo "$result" | grep -q "ERROR"; then
    echo "GDScript parse error in $f:"
    echo "$result"
    exit 1
  fi
done

echo "Pre-commit checks passed."`}</Code>

    <H3>Weekly Maintenance (Headless Cron)</H3>
    <Code>{`# crontab entry — runs every Sunday at 9am
0 9 * * 0 cd ~/shift && claude -p "/daily-puzzle && /audit && /commit" \\
  --dangerously-skip-permissions >> ~/.claude/cron.log 2>&1

# What this does every Sunday:
# 1. Generates next week's 7 daily puzzles
# 2. Runs full project audit
# 3. Commits everything with semantic messages
# 4. YOU review the commit on Monday morning`}</Code>
  </div>
);

// ─── Section: What YOU Do ────────────────────────────────────────────────────
const HumanSection = () => (
  <div>
    <H2>What YOU Actually Do</H2>
    <P>This is the honest list of everything that requires a human. It's short.</P>
    <Alert type="warn">
      Minimizing your role doesn't mean abandoning judgment. Device testing, taste decisions,
      and store submissions are irreplaceable human tasks. Claude Code handles the <em>craft</em>;
      you handle the <em>product</em>.
    </Alert>

    <H3>One-Time Manual Setup (~2 hours)</H3>
    <Table
      headers={["Task", "Why You", "Time"]}
      rows={[
        ["Create Godot project (click New Project)", "GUI only, no CLI", "2 min"],
        ["Install Claude Code + authenticate", "Account-bound", "5 min"],
        ["Apple Developer account ($99/yr)", "Requires your identity + credit card", "20 min"],
        ["Generate Android release keystore", "Security — never delegate key generation", "5 min"],
        ["Create AdMob account + get real ad unit IDs", "Account-bound, ad network verification", "30 min"],
        ["Create Google Play Console entry + pay $25 fee", "Account-bound", "20 min"],
        ["Create App Store Connect entry", "Apple ID required", "20 min"],
        ["Install Xcode on a Mac (iOS only)", "macOS-only, large download", "30 min"],
      ]}
    />

    <H3>Per-Phase Reviews (~10–20 min each)</H3>
    <P>After each Claude Code session, you do a review pass. You're not reading every line — you're checking the game works.</P>
    <Table
      headers={["Phase", "Your Review", "Time"]}
      rows={[
        ["Core Algorithm", "Run the test output, confirm all 4 tests pass", "5 min"],
        ["Level Generator", "Open levels.json, spot-check 10 random levels visually", "10 min"],
        ["Autoloads", "Open Godot, confirm no autoload errors in output panel", "5 min"],
        ["Game Scene", "Play 3 levels manually, try winning and losing", "15 min"],
        ["Menus & Flow", "Navigate every screen, tap every button", "20 min"],
        ["AdMob", "Test on physical Android device with test ad IDs", "20 min"],
        ["Polish", "Feel test: does it feel satisfying? Are animations smooth?", "20 min"],
        ["Export Config", "Follow README_EXPORT.md, produce a debug APK", "30 min"],
      ]}
    />

    <H3>Ongoing Product Decisions</H3>
    <P>These are judgment calls that Claude Code surfaces but you decide:</P>
    <ul style={{ color:"#a8b8c8", fontSize:"14px", lineHeight:"2.2", paddingLeft:"20px" }}>
      <li>Is the difficulty ramp good? (Play 10 levels at each tier boundary)</li>
      <li>Does the ad frequency feel acceptable? (Adjust the "every N levels" number)</li>
      <li>Does the win animation feel satisfying? (Describe what you want differently)</li>
      <li>Are the store screenshots appealing? (Claude drafts, you direct re-shots)</li>
      <li>What is the game called? (Claude has suggestions, you choose)</li>
      <li>What does the icon look like? (Describe it; Claude can generate SVG concepts)</li>
    </ul>

    <H3>Store Submission (Human-Only Steps)</H3>
    <Alert type="danger">
      Google Play and App Store submissions require human actions that cannot be automated:
      signing with your real keystore, App Store Connect 2FA, answering content rating
      questionnaires, setting pricing, and accepting developer agreements.
    </Alert>
    <P>Claude Code handles: store listing copy (description, keywords), screenshot captions, privacy policy draft, changelogs, and ASO keyword research. You handle: uploading, reviewing, submitting.</P>

    <H3>Total Estimated Human Time</H3>
    <Table
      headers={["Activity", "Estimated Time"]}
      rows={[
        ["Initial setup (one-time)", "2 hours"],
        ["Phase reviews (8 phases × 15 min avg)", "2 hours"],
        ["Device testing (Android + iOS)", "3 hours"],
        ["Store submission (both platforms)", "2 hours"],
        ["Bug reports during testing", "1 hour"],
        ["Total", "~10 hours across 8 weeks"],
      ]}
    />
    <Alert type="tip">
      Claude Code handles the remaining ~80–100 hours of development work that would otherwise
      require a programmer. Your 10 hours are all judgment, testing, and account management —
      the parts that actually require a human.
    </Alert>
  </div>
);

// ─── App Shell ────────────────────────────────────────────────────────────────
const contentMap = {
  philosophy: <PhilosophySection />,
  setup:      <SetupSection />,
  claudemd:   <ClaudeMdSection />,
  commands:   <CommandsSection />,
  phases:     <PhasesSection />,
  codegen:    <CodeGenSection />,
  levels:     <LevelPipelineSection />,
  hooks:      <HooksSection />,
  human:      <HumanSection />,
};

export default function App() {
  const [active, setActive] = useState("philosophy");

  return (
    <div style={{ minHeight:"100vh", background:"#04080e",
      fontFamily:"'Segoe UI',system-ui,sans-serif", color:"#a8b8c8", display:"flex" }}>

      {/* Sidebar */}
      <div style={{ width:"210px", flexShrink:0, background:"#080c12",
        borderRight:"1px solid #1e2530", padding:"0", position:"sticky",
        top:0, height:"100vh", overflowY:"auto", display:"flex", flexDirection:"column" }}>

        <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid #1e2530" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
            <div style={{ width:"28px", height:"28px", background:"linear-gradient(135deg,#38bdf8,#a78bfa)",
              borderRadius:"6px", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"14px" }}>⬡</div>
            <span style={{ color:"#e2eaf3", fontWeight:"800", fontSize:"16px", letterSpacing:"-0.5px" }}>SHIFT</span>
          </div>
          <div style={{ color:"#4a5568", fontSize:"11px" }}>Claude Code-First Dev Plan</div>
        </div>

        <div style={{ padding:"10px 0", flex:1 }}>
          {sections.map(s=>(
            <button key={s.id} onClick={()=>setActive(s.id)} style={{
              display:"block", width:"100%", textAlign:"left",
              padding:"9px 18px", background:active===s.id?"#0d1420":"transparent",
              borderLeft:active===s.id?"3px solid #38bdf8":"3px solid transparent",
              color:active===s.id?"#e2eaf3":"#6b7c8d",
              fontSize:"13px", fontWeight:active===s.id?"600":"400",
              cursor:"pointer", border:"none",
              borderLeft:active===s.id?"3px solid #38bdf8":"3px solid transparent",
              transition:"all 0.12s",
            }}>{s.label}</button>
          ))}
        </div>

        <div style={{ padding:"16px 18px", borderTop:"1px solid #1e2530" }}>
          <div style={{ marginBottom:"6px" }}>
            <Chip color="#38bdf8">Claude Code</Chip>
            <Chip color="#a78bfa">Godot 4.x</Chip>
          </div>
          <div>
            <Chip color="#4ade80">500+ Levels</Chip>
            <Chip color="#fb923c">AdMob</Chip>
          </div>
          <div style={{ color:"#4a5568", fontSize:"10px", marginTop:"10px", lineHeight:"1.5" }}>
            ~10 hrs human time<br/>Claude Code does the rest
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"36px 48px", overflowY:"auto", maxWidth:"820px" }}>
        {contentMap[active]}
      </div>
    </div>
  );
}
