import * as vscode from 'vscode';
import * as path from 'path';
import { Worktree } from './gitWorktreeService';

export class WorktreeItem extends vscode.TreeItem {
    constructor(public readonly worktree: Worktree) {
        const dirName = path.basename(worktree.path);
        const label = worktree.branch
            ? worktree.branch
            : `(detached: ${worktree.commitId.slice(0, 7)})`;

        super(label, vscode.TreeItemCollapsibleState.None);

        this.description = dirName;
        this.tooltip = new vscode.MarkdownString(
            `**${label}**\n\n` +
            `📁 \`${worktree.path}\`\n\n` +
            `Commit: \`${worktree.commitId.slice(0, 10)}\`` +
            (worktree.isCurrent ? '\n\n✅ **Current workspace**' : ''),
        );

        this.contextValue = 'worktree';

        if (worktree.isCurrent) {
            this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
            this.description = `${dirName} — current`;
        } else {
            this.iconPath = new vscode.ThemeIcon('git-branch');
        }
    }
}
