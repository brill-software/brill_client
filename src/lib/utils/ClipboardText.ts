// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.

/**
 * Provides read/write access to he brower clipboard. 
 * 
 */

export class ClipboardText {

    static text = ""

    /**
     * Saves text to the Client copy paste clipboard.
     * 
     * Note that when stepping through this code with the debugger,
     * an error occurs due to the React app window not having focus. Solution
     * is don't step through this code with the debugger!
     * 
     * Should the clipboard not be available, a local variable is used as a fallback.
     * 
     * @param text
     */
    static async write(text: string) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text) 
            }
        } catch (error) {
            console.error("Failed to write to clipboard.")
        }
        this.text = text
    }

    /**
     * Reads the contents of the Client clipboard.
     * 
     * @returns Text
    */
    static async read(): Promise<string> {
        try {
            if (navigator.clipboard) {
                return await navigator.clipboard.readText()
            }
        } catch (error) {
            console.error("Failed to read clipboard contents.")
        }
        return this.text
    }
}