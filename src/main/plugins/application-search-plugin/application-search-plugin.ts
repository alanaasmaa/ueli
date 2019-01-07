import { SearchPlugin } from "../../search-plugin";
import { SearchResultItem } from "../../../common/search-result-item";
import { ApplicationRepository } from "./application-repository";
import { PluginType } from "../../plugin-type";
import { Application } from "./application";

export class ApplicationSearchPlugin implements SearchPlugin {
    public readonly pluginType = PluginType.ApplicationSearchPlugin;
    private readonly applicationRepository: ApplicationRepository;
    private readonly executeApplication: (searchResultItem: SearchResultItem) => Promise<void>;

    constructor(applicationRepository: ApplicationRepository, executeApplication: (searchResultItem: SearchResultItem) => Promise<void>) {
        this.applicationRepository = applicationRepository;
        this.executeApplication = executeApplication;
    }

    public getAll(): Promise<SearchResultItem[]> {
        return new Promise((resolve, reject) => {
            this.applicationRepository.getAll()
                .then((applications) => {
                    const searchResultItemPromises = applications.map((application) => this.createSearchResultItemFromApplication(application));
                    Promise.all(searchResultItemPromises)
                        .then((searchResultItems) => resolve(searchResultItems))
                        .catch((err) => reject(err));
                })
                .catch((err) => reject(err));
        });
    }

    public execute(searchResultItem: SearchResultItem): Promise<void> {
        return new Promise((resolve, reject) => {
            this.executeApplication(searchResultItem)
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }

    public refreshIndex(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.applicationRepository.refreshIndex()
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }

    public clearCache(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.applicationRepository.clearCache()
                .then(() => resolve())
                .catch((err) => reject(`Error while trying to clear application repository cache: ${err}`));
        });
    }

    private createSearchResultItemFromApplication(application: Application): Promise<SearchResultItem> {
        return new Promise((resolve) => {
            resolve({
                description: application.filePath,
                executionArgument: application.filePath,
                icon: application.icon,
                name: application.name,
                originPluginType: this.pluginType,
            });
        });
    }
}