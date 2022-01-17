import { CommentRange, SourceFile } from "ts-morph";

class PrimitiveComment {
    public text: string;
    public start: number;
    public end: number;
    public file: SourceFile;

    constructor(comment: CommentRange) {
        this.text = comment.getText();
        this.start = comment.getPos();
        this.end = comment.getEnd();
        this.file = comment.getSourceFile();
    }

    public getFullText(): string {
        return this.text;
    }

    public getText(): string {
        return this.text;
    }

    public remove(): void {
        this.file.removeText(this.start, this.end);
    }

    /**
     * Dummy method to match ts compiler API
     */
    public wasForgotten(): boolean {
        return false;
    }
}

export { PrimitiveComment };
