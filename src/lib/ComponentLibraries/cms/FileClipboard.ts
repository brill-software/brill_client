// © 2022 Brill Software Limited - Brill CMS, distributed under the MIT License.

/**
 * File Clipboard for Copy and Paste. The Clipboard is retained across workspace and branch switches.
 * 
 * The file data can contain either a single file or a tree of directories and files. 
 * 
 */

export class FileClipboardEntry {
    topic: string
    fileData: any
    constructor(topic: string, fileData: any) {
        this.topic = topic
        this.fileData = fileData
    }
}

export class FileClipboard {
    private static entry: FileClipboardEntry | undefined = undefined

    static hasContent() : boolean {
        return this.entry !== undefined
    }

    static save(topic: string, fileData: any) {
        this.entry = new FileClipboardEntry(topic, fileData)
    }

    static retrieve() : FileClipboardEntry | undefined {
        return this.entry
    }
}

