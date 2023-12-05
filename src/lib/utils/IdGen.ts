// © 2023 Brill Software Limited - Brill Utils, distributed under the MIT License.

/**
 * ID Generator
 * 
 */

export class IdGen {
    private static count: number = 0 // Global count that is incremented every time an id is requested.

    /**
     * Generates an id string that is a base 36 number. e.g. x2qa3
     * Repeats after 2 billion calls but that should be way more than enough.
     * 
     */
    static next(): string {
        if (IdGen.count++ > 2000000000) { // Limit id length to 6 characters
            IdGen.count = 0
        }
        return IdGen.count.toString(36)
    }
}