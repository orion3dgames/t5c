export interface GenerateOptions {
    files: string[];
    output: string;
    decorator?: string;
    namespace?: string;
}
export declare function generate(targetId: string, options: GenerateOptions): void;
