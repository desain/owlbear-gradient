import type { GradientShape, GradientStop } from "./GradientTarget";

export interface ToolMetadata {
    readonly css: string;
    readonly type: GradientShape;
    readonly angle?: number;
    readonly stops: GradientStop[];
}
