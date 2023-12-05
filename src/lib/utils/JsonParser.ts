// © 2023 Brill Software Limited - Brill Utils, distributed under the MIT License.

/**
 * JSON Parser.
 * 
 */
export class JsonParser {

    static parse(json: string): any{
        try {
            return JSON.parse(json)
        } catch (error) {
            console.log(`Json parse error while parsing ${json}`)
            return undefined
        }
    }
}