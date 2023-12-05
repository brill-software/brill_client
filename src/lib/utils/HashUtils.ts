// © 2021 Brill Software Limited - Brill Utils, distributed under the MIT License.

/**
 * Hash Utilities
 * 
 */

export class HashUtils {                         
    /**
     * Async method that takes a password and returns a SHA-256 hash. A pepper value is added to the password
     * before it's hashed. The pepper is held in the application.yaml file on the server. The pepper can 
     * be used to make passwords unique to a particular server and make sure users/passwords can't be 
     * copied from the Development to Production database.
     * 
     * The purpose of using a hash on the client is to ensure that the server has no knowledge of the users 
     * cleartext password. The server uses the hash as the password. It also prevents web browsers from issuing 
     * warning messages about passwords passed in the clear.
     * 
     * @param pepper A pepper value.
     * @param pwd The password.
     * @returns SHA-256 hash.
     */
    static async hashPwd(pepper: string, pwd: string): Promise<string> {
        const encoder = new TextEncoder();
        const data: Uint8Array = encoder.encode(pwd + pepper)
        const hashBuffer: ArrayBuffer = await crypto.subtle.digest("SHA-256", data) 
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        return hashHex
    }
}