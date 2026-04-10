# Copilot Worktrees

A VS Code extension that brings **git worktree management** to your sidebar — with one-click **GitHub Copilot CLI** launching in a terminal in the editor area.

Think of it like the Remote Explorer panel, but for git worktrees + Copilot.

![Copilot Worktrees](media/worktree.svg)

## Features

### 🌲 Sidebar Worktree Panel
- Lists all git worktrees with branch names, commit IDs, and current-workspace indicator
- Activity bar icon for quick access

### 🚀 One-Click Copilot Launch
- **Launch Copilot CLI** in any worktree — opens a terminal *in the editor area* (as a tab, not the bottom panel)
- **Open + Launch**: Opens a worktree in a new VS Code window and automatically starts Copilot CLI

### 🪟 Open in New Window
- Open any worktree in a new VS Code window with a single click

### ➕ Create & Remove Worktrees
- Create new worktrees with branch name and base branch inputs
- Remove worktrees with a confirmation dialog

## Usage

1. Open a git repository in VS Code
2. Click the **Copilot Worktrees** icon in the Activity Bar (left sidebar)
3. Your worktrees appear in the panel:
   - Click the **🚀 rocket icon** to open in a new window with Copilot
   - Click the **🪟 window icon** to open in a new window
   - Right-click for more options (launch Copilot, remove, etc.)
4. Use the **+** button in the panel header to create a new worktree

## Configuration

| Setting | Default | Description |
|---|---|---|
| `copilotWorktrees.copilotCommand` | `"copilot"` | Command to launch Copilot CLI (e.g. `"gh copilot"`) |
| `copilotWorktrees.terminalLocation` | `"editor"` | Where to open the terminal: `"editor"` (as a tab) or `"panel"` (bottom) |

## Requirements

- **Git** installed and available in PATH
- **GitHub Copilot CLI** installed (the `copilot` command, or configure a custom command)
- VS Code 1.85+

## Development

```bash
git clone https://github.com/nickvazz/copilot-worktrees-vscode.git
cd copilot-worktrees-vscode
npm install
npm run compile
# Press F5 in VS Code to launch the Extension Development Host
```

## License

MIT — see [LICENSE](LICENSE).
