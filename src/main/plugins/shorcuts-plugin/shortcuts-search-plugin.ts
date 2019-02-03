import { SearchPlugin } from "../../search-plugin";
import { PluginType } from "../../plugin-type";
import { SearchResultItem } from "../../../common/search-result-item";
import { UserConfigOptions } from "../../../common/config/user-config-options";
import { ShortcutsOptions } from "../../../common/config/shortcuts-options";
import { IconHelpers } from "../../../common/icon/icon-helpers";
import { defaultShortcutIcon } from "../../../common/config/default-shortcuts-options";
import { Shortcut } from "./shortcut";
import { ShortcutType } from "./shortcut-type";

interface ExecutionArgumentDecodeResult {
    shortcutType: ShortcutType;
    executionArgument: string;
}

export class ShortcutsSearchPlugin implements SearchPlugin {
    public readonly pluginType = PluginType.ShortcutsSearchPlugin;
    private config: ShortcutsOptions;
    private readonly urlExecutor: (url: string) => Promise<void>;
    private readonly filePathExecutor: (filePath: string) => Promise<void>;

    constructor(
        config: ShortcutsOptions,
        urlExecutor: (url: string) => Promise<void>,
        filePathExecutor: (filePath: string) => Promise<void>,
        ) {
        this.config = config;
        this.urlExecutor = urlExecutor;
        this.filePathExecutor = filePathExecutor;
    }

    public getAll(): Promise<SearchResultItem[]> {
        return new Promise((resolve) => {
            const result = this.config.shortcuts.map((shortcut): SearchResultItem => {
                return {
                    description: shortcut.description,
                    executionArgument: this.encodeExecutionArgument(shortcut),
                    icon: IconHelpers.isValidIcon(shortcut.icon)
                        ? shortcut.icon
                        : defaultShortcutIcon,
                    name: shortcut.name,
                    originPluginType: this.pluginType,
                };
            });

            resolve(result);
        });
    }

    public clearCache(): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public execute(searchResultItem: SearchResultItem): Promise<void> {
        return new Promise((resolve, reject) => {
            const decodeResult = this.decodeExecutionArgument(searchResultItem.executionArgument);
            switch (decodeResult.shortcutType) {
                case ShortcutType.Url:
                    return this.executeUrl(decodeResult.executionArgument);
                case ShortcutType.FilePath:
                    return this.executeFilePath(decodeResult.executionArgument);
                default:
                    reject(`Unsupported shortcut type: ${decodeResult.shortcutType}`);
            }
        });
    }

    public isEnabled(): boolean {
        return this.config.isEnabled;
    }

    public refreshIndex(): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public updateConfig(updatedConfig: UserConfigOptions): Promise<void> {
        return new Promise((resolve) => {
            this.config = updatedConfig.shortcutsOptions;
            resolve();
        });
    }

    private executeUrl(url: string): Promise<void> {
        return this.urlExecutor(url);
    }

    private executeFilePath(filePath: string): Promise<void> {
        return this.filePathExecutor(filePath);
    }

    private getExecutionArgumentPrefix(shortcutType: string): string {
        return `[[[${shortcutType}]]]`;
    }

    private encodeExecutionArgument(shortcut: Shortcut): string {
        return `${this.getExecutionArgumentPrefix(shortcut.type)}${shortcut.executionArgument}`;
    }

    private decodeExecutionArgument(executionArgument: string): ExecutionArgumentDecodeResult {
        for (const s of Object.values(ShortcutType)) {
            const shortcutType: ShortcutType = s;
            if (executionArgument.startsWith(this.getExecutionArgumentPrefix(shortcutType))) {
                return {
                    executionArgument: executionArgument.replace(this.getExecutionArgumentPrefix(shortcutType), ""),
                    shortcutType,
                };
            }
        }

        throw new Error(`Unknown shortcut type; ${executionArgument}`);
    }
}