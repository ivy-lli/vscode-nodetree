import * as vscode from 'vscode';
import { NodeDependenciesProvider } from './NodeDependenciesProvider';

export function activate(context: vscode.ExtensionContext) {
  const nodeDependencyProvider = new NodeDependenciesProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependencyProvider);
  vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependencyProvider.refresh());
  vscode.commands.registerCommand('nodeDependencies.addEntry', () => nodeDependencyProvider.addEntry());
  vscode.commands.registerCommand('nodeDependencies.editEntry', args => nodeDependencyProvider.showEntry(args));
  vscode.commands.registerCommand('nodeDependencies.deleteEntry', args => nodeDependencyProvider.showEntry(args));
}

export function deactivate() {}
