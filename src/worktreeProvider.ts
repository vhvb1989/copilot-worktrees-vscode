import * as vscode from 'vscode';
import { GitWorktreeService } from './gitWorktreeService';
import { WorktreeItem } from './worktreeItem';

export class WorktreeProvider implements vscode.TreeDataProvider<WorktreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<WorktreeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private gitService: GitWorktreeService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: WorktreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(): Promise<WorktreeItem[]> {
        const worktrees = await this.gitService.listWorktrees();
        return worktrees.map((wt) => new WorktreeItem(wt));
    }
}
