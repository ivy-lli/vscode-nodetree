import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { fstat } from 'node:fs';

export class NodeDependenciesProvider implements vscode.TreeDataProvider<Dependency> {
  constructor(private wokspaceRoot: string) {}

  private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | null | void> = new vscode.EventEmitter<Dependency | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | null | void> = this._onDidChangeTreeData.event;

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Dependency): vscode.ProviderResult<Dependency[]> {
    if (!this.wokspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }
    if (element) {
      return Promise.resolve(
        this.getDepsInPackageJson(
          path.join(this.wokspaceRoot, 'node_modules', element.label, 'package.json')
        )
      );
    } else {
      const packageJsonPath = path.join(this.wokspaceRoot, 'package.json');
      if (this.pathExists(packageJsonPath)) {
        return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
      } else {
        vscode.window.showInformationMessage('Workspace has no package.json');
        return Promise.resolve([]);
      }
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  addEntry(): void {
    vscode.window.showTextDocument(vscode.Uri.parse(path.join(this.wokspaceRoot, 'package.json')));
  }

  showEntry(node: Dependency): void {
    vscode.window.showTextDocument(vscode.Uri.parse(node.packageJsonPath), {selection: this.getSelectionInPackageJson(node)});
  }

  private getSelectionInPackageJson(node: Dependency): vscode.Range {
    if (this.pathExists(node.packageJsonPath)) {
      const packageJson = fs.readFileSync(node.packageJsonPath, 'utf-8');
      const lines = packageJson.split('\n');
      for (let i = 0; lines.length; i++) {
        const pos = lines[i].indexOf(`"${node.label}"`);
        if (pos > 0) {
          return new vscode.Range(i, pos + 1, i, pos + node.label.length + 1);
        }
      }
    } 
    return new vscode.Range(0, 0, 0, 0);
  }

  private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
    if (this.pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const toDep = (moduleName: string, version: string): Dependency => {
        if (this.pathExists(path.join(this.wokspaceRoot, 'node_modules', moduleName))) {
          return new Dependency(moduleName, version, packageJsonPath, vscode.TreeItemCollapsibleState.Collapsed);
        } else {
          return new Dependency(moduleName, version, packageJsonPath, vscode.TreeItemCollapsibleState.None);
        }
      };

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map(dep =>
          toDep(dep, packageJson.dependencies[dep]))
        : [];
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map(dep =>
          toDep(dep, packageJson.devDependencies[dep]))
        : [];
      return deps.concat(devDeps);
    } else {
      return [];
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }

}

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly packageJsonPath: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
    const type = packageJsonPath.includes('node_modules') ? '-sub' : '';
    this.contextValue = 'dependency' + type;
    this.iconPath = new vscode.ThemeIcon('type-hierarchy' + type);
  }

}