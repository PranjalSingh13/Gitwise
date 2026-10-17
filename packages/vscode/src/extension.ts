import * as vscode from 'vscode';

const API_BASE = 'http://localhost:4000/api/v1';

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('gitwise');
  context.subscriptions.push(diagnosticCollection);

  // Register Webview Provider for the Activity Bar
  const sidebarProvider = new GitWiseSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('gitwise.sidebarView', sidebarProvider)
  );

  // Command 1: Deep Scan Workspace
  const analyzeWorkspaceCmd = vscode.commands.registerCommand('gitwise.analyzeWorkspace', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage('GitWise: Please open a project folder first.');
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const folderName = workspaceFolders[0].name;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `GitWise: Deep-scanning "${folderName}" with AI...`,
        cancellable: false
      },
      async (progress) => {
        try {
          progress.report({ increment: 20, message: 'Scanning files & dependencies...' });

          const res = await fetch(`${API_BASE}/analyze/repo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              repoName: folderName,
              dirPath: rootPath
            })
          });

          if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
          }

          progress.report({ increment: 60, message: 'Synthesizing health score...' });
          const report = await res.json() as any;

          // Update VS Code Problems tab
          diagnosticCollection.clear();
          const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();

          for (const finding of report.findings || []) {
            const fileUri = vscode.Uri.file(`${rootPath}/${finding.filePath}`);
            const line = Math.max(0, (finding.lineStart || 1) - 1);
            const range = new Range(line, 0, line, 120);

            const severity = finding.severity === 'critical' || finding.severity === 'high'
              ? vscode.DiagnosticSeverity.Error
              : vscode.DiagnosticSeverity.Warning;

            const diag = new vscode.Diagnostic(
              range,
              `[GitWise ${finding.ruleId}] ${finding.title}: ${finding.rootCause}`,
              severity
            );
            diag.source = 'GitWise';

            const list = diagnosticsByFile.get(fileUri.fsPath) || [];
            list.push(diag);
            diagnosticsByFile.set(fileUri.fsPath, list);
          }

          diagnosticsByFile.forEach((diags, filePath) => {
            diagnosticCollection.set(vscode.Uri.file(filePath), diags);
          });

          // Show Notification
          const action = await vscode.window.showInformationMessage(
            `GitWise: Analysis Complete! Health Score: ${report.healthScore.overallScore}/100 (Grade ${report.healthScore.grade}) with ${report.findings.length} findings.`,
            'Open Web Dashboard'
          );

          if (action === 'Open Web Dashboard') {
            vscode.env.openExternal(vscode.Uri.parse('http://localhost:5173'));
          }

          sidebarProvider.updateReport(report);
        } catch (err: any) {
          vscode.window.showErrorMessage(`GitWise Deep-Scan failed: ${err.message}. Make sure the GitWise API is running on port 4000.`);
        }
      }
    );
  });

  // Command 2: Explain Git Error
  const explainErrorCmd = vscode.commands.registerCommand('gitwise.explainError', async () => {
    const errorText = await vscode.window.showInputBox({
      prompt: 'Paste your Git error message',
      placeHolder: 'e.g. fatal: refusing to merge unrelated histories or non-fast-forward push...'
    });

    if (!errorText) return;

    try {
      const res = await fetch(`${API_BASE}/explain/error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorText })
      });
      const data = await res.json() as any;

      const message = `${data.errorSignature}\n\n${data.plainEnglishSummary}\n\nRecommended Fix:\n${data.recommendedCommands.join('\n')}`;
      vscode.window.showInformationMessage(message, { modal: true });
    } catch {
      vscode.window.showErrorMessage('Failed to connect to GitWise Git Doctor API.');
    }
  });

  // Command 3: Scan Active File
  const scanActiveFileCmd = vscode.commands.registerCommand('gitwise.scanActiveFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active file open.');
      return;
    }

    const content = editor.document.getText();
    const filePath = vscode.workspace.asRelativePath(editor.document.uri);

    try {
      const res = await fetch(`${API_BASE}/analyze/repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: 'single-file',
          files: [{ path: filePath, content }]
        })
      });
      const data = await res.json() as any;

      if (data.findings && data.findings.length > 0) {
        vscode.window.showWarningMessage(`GitWise found ${data.findings.length} findings in ${filePath}! Check Problems panel.`);
      } else {
        vscode.window.showInformationMessage(`GitWise: No exposed secrets or unsafe patterns found in ${filePath}.`);
      }
    } catch {
      vscode.window.showErrorMessage('Failed to scan file.');
    }
  });

  context.subscriptions.push(analyzeWorkspaceCmd, explainErrorCmd, scanActiveFileCmd);
}

class Range extends vscode.Range {
  constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
    super(new vscode.Position(startLine, startChar), new vscode.Position(endLine, endChar));
  }
}

class GitWiseSidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _lastReport?: any;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    this._updateContent();

    webviewView.webview.onDidReceiveMessage(data => {
      if (data.type === 'triggerDeepScan') {
        vscode.commands.executeCommand('gitwise.analyzeWorkspace');
      } else if (data.type === 'triggerDoctor') {
        vscode.commands.executeCommand('gitwise.explainError');
      } else if (data.type === 'openFullDashboard') {
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:5173'));
      }
    });
  }

  public updateReport(report: any) {
    this._lastReport = report;
    this._updateContent();
  }

  private _updateContent() {
    if (!this._view) return;

    const reportHtml = this._lastReport ? `
      <div style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 8px; padding: 12px; margin-bottom: 12px; text-align: center;">
        <div style="font-size: 28px; font-weight: 800; color: #818cf8;">Grade ${this._lastReport.healthScore.grade}</div>
        <div style="font-size: 14px; opacity: 0.85;">Health Score: ${this._lastReport.healthScore.overallScore}/100</div>
        <div style="font-size: 12px; margin-top: 6px; color: #a5b4fc;">${this._lastReport.findings.length} findings detected</div>
      </div>
      <div style="font-size: 12px; line-height: 1.4; margin-bottom: 12px; color: #cbd5e1;">
        ${this._lastReport.architectureSummary.overview}
      </div>
    ` : `
      <div style="text-align: center; padding: 20px 0; opacity: 0.7; font-size: 13px;">
        Click below to run a deep scan on the current project.
      </div>
    `;

    this._view.webview.html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 12px; color: var(--vscode-foreground); }
            button { width: 100%; padding: 8px 12px; background: #6366f1; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 8px; }
            button:hover { background: #4f46e5; }
            .btn-outline { background: transparent; border: 1px solid var(--vscode-button-border, #4b5563); color: var(--vscode-foreground); }
            .btn-outline:hover { background: rgba(255,255,255,0.05); }
          </style>
        </head>
        <body>
          <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px;">
            <span style="color: #6366f1;">●</span> GitWise Companion
          </h3>
          ${reportHtml}
          <button onclick="vscode.postMessage({ type: 'triggerDeepScan' })">🚀 Analyze Current Repo</button>
          <button class="btn-outline" onclick="vscode.postMessage({ type: 'triggerDoctor' })">🩺 Git Error Doctor</button>
          <button class="btn-outline" onclick="vscode.postMessage({ type: 'openFullDashboard' })">🌐 Open Full Dashboard</button>
          <script>
            const vscode = acquireVsCodeApi();
          </script>
        </body>
      </html>
    `;
  }
}

export function deactivate() {}
