import * as child_process from 'child_process';
import * as path from 'path';

export interface Worktree {
    path: string;
    branch: string;
    commitId: string;
    isBare: boolean;
    isCurrent: boolean;
}

export class GitWorktreeService {
    constructor(private cwd?: string) {}

    async getRepoRoot(): Promise<string> {
        return this.git('rev-parse', '--show-toplevel');
    }

    async getMainWorktreeRoot(): Promise<string> {
        const root = await this.getRepoRoot();
        let commonDir = await this.git('rev-parse', '--git-common-dir');

        if (!path.isAbsolute(commonDir)) {
            commonDir = path.resolve(root, commonDir);
        }

        // For normal repos, commonDir ends with /.git
        if (commonDir.endsWith('/.git') || commonDir.endsWith('\\.git')) {
            return path.dirname(commonDir);
        }
        return root;
    }

    async listWorktrees(): Promise<Worktree[]> {
        let root: string;
        try {
            root = await this.getRepoRoot();
        } catch {
            return [];
        }

        const output = await this.git('worktree', 'list', '--porcelain');
        const worktrees: Worktree[] = [];
        let current: Partial<Worktree> = {};

        for (const line of output.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('worktree ')) {
                current.path = trimmed.slice('worktree '.length);
            } else if (trimmed.startsWith('HEAD ')) {
                current.commitId = trimmed.slice('HEAD '.length);
            } else if (trimmed.startsWith('branch ')) {
                const ref = trimmed.slice('branch '.length);
                current.branch = ref.replace('refs/heads/', '');
            } else if (trimmed === 'bare') {
                current.isBare = true;
            } else if (trimmed === '') {
                if (current.path && !current.isBare) {
                    const absPath = path.resolve(current.path);
                    const absCwd = path.resolve(root);
                    worktrees.push({
                        path: current.path,
                        branch: current.branch ?? '',
                        commitId: current.commitId ?? '',
                        isBare: false,
                        isCurrent: absPath === absCwd,
                    });
                }
                current = {};
            }
        }

        // Handle last entry if no trailing newline
        if (current.path && !current.isBare) {
            const absPath = path.resolve(current.path);
            const absCwd = path.resolve(root);
            worktrees.push({
                path: current.path,
                branch: current.branch ?? '',
                commitId: current.commitId ?? '',
                isBare: false,
                isCurrent: absPath === absCwd,
            });
        }

        return worktrees;
    }

    async createWorktree(wtPath: string, branch: string, base: string): Promise<void> {
        await this.git('worktree', 'add', wtPath, '-b', branch, base);
    }

    async removeWorktree(wtPath: string): Promise<void> {
        await this.git('worktree', 'remove', wtPath);
    }

    private git(...args: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            child_process.execFile('git', args, { cwd: this.cwd, maxBuffer: 1024 * 1024 }, (err, stdout) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }
}
