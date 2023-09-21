// © 2021 Brill Software Limited - Brill Message Broker, distributed under the MIT License.
import * as secp from "@noble/secp256k1"

/**
 * CryptoService - Provides methods to generate client keys, generated a shared secret and 
 * to ecnrypt and decrypt messages. An ECDH key exchange is required with the server. The Client 
 * Private Key and Server Pulic Key are used to generate a Shared Secret. The Shared Secret is 
 * hashed using SHA-256. Once the Shared Secret is generated, the keys are deleted. From then
 * on, encryption / decryption is performed using the Shared Secret and the AES-CTR algorithm.
 */

export class CryptoService {

    // Keys are stored as hex.
    private static clientPrivateKey: Uint8Array | null = null
    private static clientPublicKey: Uint8Array | null = null
    private static sharedSecret: Uint8Array | null = null
    
    /**
     * Checks to see if we already have the Shared Secret. If not, an ECDH key exchange with the
     * server is required.
     * 
     * @returns true if the Shared Secret is available.
     */
    static isSharedSecretAvailable(): boolean {
        return (this.sharedSecret !== null) 
    }

    /**
     * Generates a Client Private Key using 32 random bytes. This is used to derive a Client Public Key.
     * The Client Public Key is returned, ready to be sent to the server.
     * 
     * @returns Client Public Key as a hex string.
     */
    static generateClientKeys(): string {
        CryptoService.clientPrivateKey = secp.utils.randomPrivateKey()
        CryptoService.clientPublicKey = secp.getPublicKey(CryptoService.clientPrivateKey) // secp256k1
        CryptoService.sharedSecret = null
        return secp.utils.bytesToHex(CryptoService.clientPublicKey)
    }

    /**
     * Generates a Shared Secret using the Client Private Key and the Server Public Key. The Shared
     * Secret should be identical to the value calculated by the server using the Client Public Key
     * and Server Private Key.
     * 
     * @param serverPublicKey The key received from the server as part of the ECDH key exchange.
     */
    static async generateSharedSecret(serverPublicKey: string) {
        if (!CryptoService.clientPrivateKey || !serverPublicKey) {
            throw new Error("The clientPrivateKey and serverPublicKey are required before a shared secret can be generated.")
        }

        const sharedSecret33 = secp.getSharedSecret(CryptoService.clientPrivateKey, serverPublicKey, true)
        
        // The array is 33 bytes long. The first byte is alway 03 and the remaining 32 are the shared secret.
        const sharedSecret =  sharedSecret33.slice(1)
        
        // Hash the shared secret using SHA-256. This is to remove weak bits due to the Diffie–Hellman exchange.
        const hashBuffer = await crypto.subtle.digest("SHA-256", sharedSecret) 
        CryptoService.sharedSecret = new Uint8Array(hashBuffer)
        
        // console.log(`Shared Secret = ${secp.utils.bytesToHex(CryptoService.sharedSecret)}`)
        
        // Delete the keys and only use the shared secret from now on.
        CryptoService.clientPublicKey = null
        CryptoService.clientPrivateKey?.fill(0)
        CryptoService.clientPrivateKey = null
    }

    /**
     * Encrypts a hex string using the Shared Secret and AES-CTR.
     * 
     * @param hex The data to be encrypted.
     * @returns Hex string containing the encrypted data.
     */
    static async encrypt(hex: string): Promise<string> {
        if (!CryptoService.sharedSecret) {
            throw new Error("Shared secret must be generated before performing encryption.")
        }
        const aesKey: CryptoKey = await crypto.subtle.importKey("raw", CryptoService.sharedSecret, "AES-CTR",  true, ["encrypt", "decrypt"])
        const data: Uint8Array = this.hexStringToUint8Array(hex)
        const cypherArray = await crypto.subtle.encrypt({name: "AES-CTR", counter: new Uint8Array(16), length: 128}, aesKey, data)
        const result = secp.utils.bytesToHex(new Uint8Array(cypherArray))
        // console.log("Cypher = " + result)
        return result
    }

    /**
     * Decrypts an encrypted hex string using the Shared Secret and AES-CTR.
     * 
     * @param hex The data to be encrypted.
     * @returns Hex string containing the encrypted data.
     */
    static async decrypt(hex: string): Promise<string> {
        if (!CryptoService.sharedSecret) {
            throw new Error("Shared secret must be generated before perforing decryption.")
        }
        const aesKey: CryptoKey = await crypto.subtle.importKey("raw", CryptoService.sharedSecret, "AES-CTR",  true, ["encrypt", "decrypt"])
        const data: Uint8Array = this.hexStringToUint8Array(hex)
        const decryptedArray = await crypto.subtle.decrypt({name: "AES-CTR", counter: new Uint8Array(16), length: 128}, aesKey, data)
        const result = secp.utils.bytesToHex(new Uint8Array(decryptedArray))
        // console.log("Decrypted = " + result)
        return result
    }

    private static hexStringToUint8Array(hexString: string): Uint8Array {
        if (hexString.length % 2 !== 0){
          throw new Error(`Invalid hexString: ${hexString}`)
        }
        var arrayBuffer = new Uint8Array(hexString.length / 2);
      
        for (var i = 0; i < hexString.length; i += 2) {
          var byteValue = parseInt(hexString.substring(i, i + 2), 16);
          if (isNaN(byteValue)){
            throw new Error(`Invalid hexString: ${hexString}`)
          }
          arrayBuffer[i/2] = byteValue;
        } 
        return arrayBuffer;
    }
}