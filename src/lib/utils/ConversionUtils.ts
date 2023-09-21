// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.

import { Base64 } from "js-base64"

/**
 * Conversion Utilities. 
 *  
 */

export class ConversionUtils {

    static arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = ""
        const bytes = new Uint8Array(buffer)
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return Base64.encode(binary)
    }
}