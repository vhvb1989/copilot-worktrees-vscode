import * as vscode from 'vscode';
import { WorktreeProvider } from './worktreeProvider';
import { GitWorktreeService } from './gitWorktreeService';
import { WorktreeItem } from './worktreeItem';

export function activate(context: vscode.ExtensionContext) {
    const gitService = new GitWorktreeService();
    const provider = new WorktreeProvider(gitService);

    const treeView = vscode.window.createTreeView('copilotWorktrees', {
        treeDataProvider: provider,
        showCollapseAll: false,
    });

    context.subscriptions.push(
        treeView,

        vscode.commands.registerCommand('copilotWorktrees.refresh', () => {
            provider.refresh();
        }),

        vscode.commands.registerCommand('copilotWorktrees.openInNewWindow', (item: WorktreeItem) => {
            const uri = vscode.Uri.file(item.worktree.path);
            vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: true });
        }),

        vscode.commands.registerCommand('copilotWorktrees.launchCopilot', (item: WorktreeItem) => {
            launchCopilotTerminal(item.worktree.path, item.worktree.branch);
        }),

        vscode.commands.registerCommand('copilotWorktrees.openAndLaunchCopilot', async (item: WorktreeItem) => {
            // Open the worktree folder in a new window.
            // The new window will activate this extension, which writes a
            // startup marker so that copilot is auto-launched in that window.
            const markerUri = vscode.Uri.joinPath(
                vscode.Uri.file(item.worktree.path),
                '.vscode',
                '.copilot-worktree-launch',
            );
            // Ensure .vscode dir exists
            try {
                await vscode.workspace.fs.createDirectory(
                    vscode.Uri.joinPath(vscode.Uri.file(item.worktree.path), '.vscode'),
                );
            } catch { /* may already exist */ }
            await vscode.workspace.fs.writeFile(markerUri, Buffer.from('launch'));

            const uri = vscode.Uri.file(item.worktree.path);
            vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: true });
        }),

        vscode.commands.registerCommand('copilotWorktrees.createWorktree', async () => {
            const branchName = await vscode.window.showInputBox({
                prompt: 'Branch name for the new worktree',
                placeHolder: 'feature/my-feature',
                validateInput: (v) => v.trim() ? null : 'Branch name is required',
            });
            if (!branchName) { return; }

            const baseBranch = await vscode.window.showInputBox({
                prompt: 'Base branch to create from',
                value: 'main',
            });
            if (baseBranch === undefined) { return; }

            try {
                const repoRoot = await gitService.getRepoRoot();
                const repoName = repoRoot.split(/[\\/]/).pop() ?? 'repo';
                const parentDir = vscode.Uri.joinPath(vscode.Uri.file(repoRoot), '..');
                const worktreePath = vscode.Uri.joinPath(parentDir, `${repoName}-${branchName.replace(/\//g, '-')}`).fsPath;

                await gitService.createWorktree(worktreePath, branchName, baseBranch || 'main');
                provider.refresh();
                vscode.window.showInformationMessage(`Worktree '${branchName}' created.`);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage(`Failed to create worktree: ${msg}`);
            }
        }),

        vscode.commands.registerCommand('copilotWorktrees.removeWorktree', async (item: WorktreeItem) => {
            if (item.worktree.isCurrent) {
                vscode.window.showWarningMessage('Cannot remove the current worktree.');
                return;
            }
            const answer = await vscode.window.showWarningMessage(
                `Remove worktree '${item.worktree.branch || item.worktree.path}'?`,
                { modal: true },
                'Remove',
            );
            if (answer !== 'Remove') { return; }

            try {
                await gitService.removeWorktree(item.worktree.path);
                provider.refresh();
                vscode.window.showInformationMessage('Worktree removed.');
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage(`Failed to remove worktree: ${msg}`);
            }
        }),
    );

    // On activation, check for the launch marker (set by openAndLaunchCopilot).
    checkStartupMarker();
}

function launchCopilotTerminal(cwd: string, branch?: string) {
    const config = vscode.workspace.getConfiguration('copilotWorktrees');
    const command = config.get<string>('copilotCommand', 'copilot');
    const locationPref = config.get<string>('terminalLocation', 'editor');

    const location = locationPref === 'panel'
        ? vscode.TerminalLocation.Panel
        : vscode.TerminalLocation.Editor;

    const name = branch ? `Copilot (${branch})` : 'Copilot';

    const terminal = vscode.window.createTerminal({
        name,
        cwd,
        location,
    });
    terminal.show();
    terminal.sendText(command);
}

async function checkStartupMarker() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) { return; }

    const markerUri = vscode.Uri.joinPath(folders[0].uri, '.vscode', '.copilot-worktree-launch');
    try {
        await vscode.workspace.fs.stat(markerUri);
        // Marker exists — delete it and launch copilot
        await vscode.workspace.fs.delete(markerUri);
        launchCopilotTerminal(folders[0].uri.fsPath);
    } catch {
        // No marker — normal activation, nothing to do
    }
}

export function deactivate() {}
