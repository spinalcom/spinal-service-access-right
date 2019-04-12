"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Constants_1 = require("./Constants");
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const G_root = window ? window : global;
class SpinalServiceAccessRight {
    constructor(ngSpinalcore, authService) {
        this.loadedPromise = {};
        this.spinalcore = ngSpinalcore;
        this.authService = authService;
    }
    load(path) {
        //getSpinalcore from params
        if (typeof this.loadedPromise[path] !== 'undefined') {
            return this.loadedPromise[path];
        }
        this.loadedPromise[path] = this.spinalcore.load(path)
            .catch(e => {
            this.loadedPromise[path] = undefined;
            throw new Error(`loading error ${path}`);
        });
        return this.loadedPromise[path];
    }
    getRoleFromName(names) {
        return this.load(Constants_1.ROLE_LST_PATH)
            .then((rolesLst) => {
            if (rolesLst) {
                const res = [];
                const roles = rolesLst.roles;
                for (let i = 0; i < roles.length; i++) {
                    if (names.includes(roles[i].name.get()))
                        res.push(roles[i]);
                }
                return res;
            }
            return undefined;
        })
            .catch((e) => {
            console.log('getRoleFromName error:', e);
            return undefined;
        });
    }
    getAppProfileFromName(name) {
        return this.load(Constants_1.APP_PROFILE_LST_PATH)
            .then((appProfileLst) => {
            if (appProfileLst) {
                const appProfile = appProfileLst.apps;
                for (let i = 0; i < appProfile.length; i++) {
                    if (name === appProfile[i].name.get()) {
                        return appProfile[i];
                    }
                }
            }
            return undefined;
        })
            .catch((e) => {
            console.log('getAppProfileFromName error:', e);
            return undefined;
        });
    }
    getAppProfilesFromAliasName(name) {
        return this.load(Constants_1.ALIAS_APP_PROFILE_LST_PATH)
            .then((appProfileAliasesLst) => {
            if (appProfileAliasesLst) {
                const appProfileAliases = appProfileAliasesLst.aliases;
                for (let i = 0; i < appProfileAliases.length; i++) {
                    console.log(appProfileAliases[i].name.get(), name);
                    if (name === appProfileAliases[i].name.get()) {
                        return appProfileAliases[i].appProfile;
                    }
                }
            }
            return undefined;
        })
            .catch((e) => {
            console.log('getAppProfileFromName error:', e);
            return undefined;
        });
    }
    getRoleFromAliasName(name) {
        const appProfilePromise = this.getAppProfilesFromAliasName(name);
        if (appProfilePromise) {
            console.log('ads loris');
            return appProfilePromise.then((ptr) => {
                return new Promise((resolve) => {
                    if (ptr)
                        ptr.load(resolve);
                    resolve(null);
                }).then((appProfile) => {
                    if (appProfile)
                        return appProfile.roles;
                    return null;
                });
            });
        }
        else
            console.log('asdsadsad', name);
    }
    static getUserProfileDir(ngSpinalCore) {
        return ngSpinalCore.load('/etc')
            .then(etcDir => {
            for (let i = 0; i < etcDir.length; i++) {
                const file = etcDir[i];
                if (file.name === Constants_1.USERS_PROFILE_DIR_NAME)
                    return file;
            }
            const Dir = new spinal_core_connectorjs_type_1.Directory();
            etcDir.add_file(Constants_1.USERS_PROFILE_DIR_NAME, Dir);
            return Dir;
        });
    }
    /**
     * @return the list of role of an user
     */
    getCurrentUserRoles() {
        const path = `etc/${Constants_1.USERS_PROFILE_DIR_NAME}/` + this.authService.get_user().username;
        return this.load(path)
            .then((userProfile) => {
            return userProfile.roles;
        });
    }
    /**
     *
     * @param alias {string} name of the alias
     */
    checkUserAccess(alias) {
        console.log(alias);
        return this.getCurrentUserRoles()
            .then((userRoles) => {
            return this.getRoleFromAliasName(alias)
                .then((allowedRole) => {
                if (allowedRole)
                    //Check if user has access to a role
                    for (let i = 0; i < userRoles.length; i++) {
                        for (let j = 0; j < allowedRole.length; j++) {
                            if (userRoles[i].name === allowedRole[i].name) {
                                return true;
                            }
                        }
                    }
                return false;
            });
        });
    }
    /**
     * Get the user right on the file
     * @param {any} spinalcore. ngSpinalcore from angular
     * @param {string} serverId. ID of the file
     * @return {number} right flags
     */
    getRight(spinalcore, serverId) {
        const userId = G_root.FileSystem._userid;
        return spinalcore.load_right(serverId)
            .then(userRight => {
            for (let i = 0; i < userRight.length; i++) {
                if (userRight[i].user.id.get() === parseInt(userId)) {
                    return userRight[i].flag.get();
                }
            }
            return -1;
        });
    }
}
exports.SpinalServiceAccessRight = SpinalServiceAccessRight;
//# sourceMappingURL=AccessRightService.js.map