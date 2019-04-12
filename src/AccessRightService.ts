import {
  AppProfile,
  Role,
  RoleLst,
  AppProfileLst, AppProfileAliasLst, AppProfileAlias, UserProfile
} from "spinal-model-access-rights";
import {
  ALIAS_APP_PROFILE_LST_PATH,
  APP_PROFILE_LST_PATH,
  ROLE_LST_PATH, USERS_PROFILE_DIR_NAME
} from "./Constants";
import { Directory } from "spinal-core-connectorjs_type";

export interface G_ROOT {
  [key: string]: any;

  spinal?: {
    [key: string]: any;
    spinalSystem?: any;
  };
}

const G_root: G_ROOT = window ? window : global;

export class SpinalServiceAccessRight {
  private loadedPromise: { [key: string]: Promise<any> } = {};
  private spinalcore: any;
  private authService: any;

  constructor(ngSpinalcore, authService) {
    this.spinalcore = ngSpinalcore;
    this.authService = authService;
  }

  load(path: string) {
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

  getRoleFromName(names: string[]): Promise<Role> {
    return this.load(ROLE_LST_PATH)
      .then((rolesLst: RoleLst) => {
        if (rolesLst) {
          const res = [];
          const roles: spinal.Lst<Role> = rolesLst.roles;
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

  getAppProfileFromName(name: string): Promise<AppProfile> {
    return this.load(APP_PROFILE_LST_PATH)
      .then((appProfileLst: AppProfileLst) => {
        if (appProfileLst) {
          const appProfile: spinal.Lst<AppProfile> = appProfileLst.apps;
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

  getAppProfilesFromAliasName(name: string): Promise<spinal.Ptr<AppProfile>> {
    return this.load(ALIAS_APP_PROFILE_LST_PATH)
      .then((appProfileAliasesLst: AppProfileAliasLst) => {
        if (appProfileAliasesLst) {
          const appProfileAliases: spinal.Lst<AppProfileAlias> = appProfileAliasesLst.aliases;
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

  getRoleFromAliasName(name: string): Promise<spinal.Lst<Role>> {
    const appProfilePromise: Promise<spinal.Ptr<AppProfile>> = this.getAppProfilesFromAliasName(name);
    if (appProfilePromise){
      return appProfilePromise.then((ptr: spinal.Ptr<AppProfile>) => {
        return new Promise((resolve) => {
          if (ptr)
            ptr.load(resolve)
          resolve(null)
        }).then((appProfile: AppProfile) => {
          if (appProfile)
            return appProfile.roles;
          return null;
        })
      })
    }

  }

  static getUserProfileDir(ngSpinalCore) {
    return ngSpinalCore.load('/etc')
      .then(etcDir => {
        for (let i = 0; i < etcDir.length; i++) {
          const file = etcDir[i];
          if (file.name === USERS_PROFILE_DIR_NAME)
            return file;
        }
        const Dir = new Directory();
        etcDir.add_file(USERS_PROFILE_DIR_NAME, Dir);
        return Dir;
      })
  }

  /**
   * @return the list of role of an user
   */
  getCurrentUserRoles(): Promise<spinal.Lst<Role>> {
    const path = `etc/${USERS_PROFILE_DIR_NAME}/` + this.authService.get_user().username;
    return this.load(path)
      .then((userProfile: UserProfile) => {
        return userProfile.roles;
      });

  }

  /**
   *
   * @param alias {string} name of the alias
   */
  checkUserAccess(alias: string): Promise<boolean> {
    console.log(alias);
    return this.getCurrentUserRoles()
      .then((userRoles: spinal.Lst<Role>) => {
        return this.getRoleFromAliasName(alias)
          .then((allowedRole: spinal.Lst<Role>) => {
            if (allowedRole) 
            //Check if user has access to a role
            for (let i = 0; i < userRoles.length; i++) {
              for (let j = 0; j < allowedRole.length; j++) {
                if (userRoles[i].name === allowedRole[i].name) {
                  return true
                }
              }
            }
            return false;
          })
      })
  }

  /**
   * Get the user right on the file
   * @param {any} spinalcore. ngSpinalcore from angular
   * @param {string} serverId. ID of the file
   * @return {number} right flags
   */
  getRight(spinalcore, serverId): Promise<number> {
    const userId = G_root.FileSystem._userid;
    return spinalcore.load_right(serverId)
      .then(userRight => {
        for (let i = 0; i < userRight.length; i++) {
          if (userRight[i].user.id.get() === parseInt(userId)) {
            return userRight[i].flag.get();
          }
        }
        return -1;
      })
  }

}
