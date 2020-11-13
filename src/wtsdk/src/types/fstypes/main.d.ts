/// <reference path='./FSTypes.d.ts' />

declare module "WorkingTitle" {
  export class WTDataStore {
    /**
     * Retrieves a key from the datastore, possibly returning the default value
     * @param key The name of the key to retrieve
     * @param defaultValue The default value to use if the key does not exist
     * @returns Either the stored value of the key, or the default value
     */
    static get(key: string, defaultValue: string | number | boolean): any;

    /**
     * Stores a key in the datastore
     * @param key The name of the value to store
     * @param The value to store
     */
    static set(key: string, value: string | number | boolean): any;
  }
}