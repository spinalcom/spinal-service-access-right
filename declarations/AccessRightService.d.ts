import { AppProfile, Role } from "spinal-model-access-rights";
export interface G_ROOT {
    [key: string]: any;
    spinal?: {
        [key: string]: any;
        spinalSystem?: any;
    };
}
export declare class SpinalServiceAccessRight {
    private loadedPromise;
    private spinalcore;
    private authService;
    constructor(ngSpinalcore: any, authService: any);
    load(path: string): Promise<any>;
    getRoleFromName(names: string[]): Promise<Role>;
    getAppProfileFromName(name: string): Promise<AppProfile>;
    getAppProfilesFromAliasName(name: string): Promise<spinal.Ptr<AppProfile>>;
    getRoleFromAliasName(name: string): Promise<spinal.Lst<Role>>;
    static getUserProfileDir(ngSpinalCore: any): any;
    /**
     * @return the list of role of an user
     */
    getCurrentUserRoles(): Promise<spinal.Lst<Role>>;
    /**
     *
     * @param alias {string} name of the alias
     */
    checkUserAccess(alias: string): Promise<boolean>;
    /**
     * Get the user right on the file
     * @param {any} spinalcore. ngSpinalcore from angular
     * @param {string} serverId. ID of the file
     * @return {number} right flags
     */
    getRight(spinalcore: any, serverId: any): Promise<number>;
}
