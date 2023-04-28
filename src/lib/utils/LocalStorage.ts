// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.

/**
 * Local Storage Utilities
 * 
 */
export class LocalStorage {

    /**
     * Sets a local storage value. This is not gauranted to work as local storgage might be disabled.
     * 
     * @param key 
     * @param value 
     */
    static setValue(key: string, value: string) {
        try {
            window.localStorage.setItem(key, value)
        } catch(e) {
            // Ignore exception
        }
    }
    
    /**
     * Gets a value from local storage. Returns a zero length string if the value was not previously 
     * stored or local storage is disabled.
     * 
     * @param key 
     * @param value 
     */
    static getValue(key: string): string {
        try {
            const value = window.localStorage.getItem(key)
            return (value ? value : "")
        } catch(e) {
            return ""
        }
    }
}