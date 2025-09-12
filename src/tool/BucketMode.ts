import type {
    BoundingBox,
    Item,
    Matrix,
    Metadata,
    ToolContext,
    ToolEvent,
    ToolMode,
    Vector2,
} from "@owlbear-rodeo/sdk";
import OBR, { Math2, MathM } from "@owlbear-rodeo/sdk";
import {
    hexToRgb,
    matrixMultiply,
    ORIGIN,
    WHITE_RGB,
    zeroToOne,
    type Watcher,
} from "owlbear-utils";
import logo from "../../assets/logo.svg";
import {
    ID_MODE_GRADIENT,
    ID_POPOVER_SETTINGS,
    ID_TOOL_DRAWING,
    METADATA_KEY_CONTROL_POINT_INDEX,
    METADATA_KEY_GRADIENT,
} from "../constants";
import {
    isControlPoint,
    KEY_FILTER_CONTROL_POINT,
    KEY_FILTER_NOT_CONTROL_POINT,
} from "./ControlPoint";
import { isGradientEffect, moveControlPoint } from "./GradientEffect";
import {
    DEFAULT_GRADIENT_SHAPE,
    isGradientTarget,
    KEY_FILTER_GRADIENT_TARGET,
    type GradientStop,
} from "./GradientTarget";
import type { ToolMetadata } from "./ToolMetadata";

function getDefaultStops(metadata: Metadata): GradientStop[] {
    const fillColor = metadata.fillColor as string | undefined;
    const stop2Color = (fillColor ? hexToRgb(fillColor) : null) ?? WHITE_RGB;
    return [
        {
            color: WHITE_RGB,
            alpha: zeroToOne(0),
            left: zeroToOne(0),
        },
        {
            color: stop2Color,
            alpha: zeroToOne(1),
            left: zeroToOne(1),
        },
    ];
}

function getDefaultControlPoints(
    toolMetadata: ToolMetadata | undefined,
    inverseTransform: Matrix,
    bounds: BoundingBox,
): [a: Vector2, b: Vector2] {
    const shape = toolMetadata?.type ?? DEFAULT_GRADIENT_SHAPE;
    const centerOffset = Math2.rotate(
        { x: 0, y: Math.min(bounds.width, bounds.height) / 2 },
        ORIGIN,
        toolMetadata?.angle ?? 0,
    );
    let worldPoints: Vector2[];
    switch (shape) {
        case "RADIAL":
            worldPoints = [
                bounds.center,
                Math2.add(bounds.center, centerOffset),
            ];
            break;
        case "LINEAR": {
            worldPoints = [
                Math2.add(bounds.center, centerOffset),
                Math2.subtract(bounds.center, centerOffset),
            ];
            break;
        }
    }
    if (worldPoints.length !== 2) {
        throw Error("invalid world control points");
    }
    return worldPoints.map((p) => matrixMultiply(inverseTransform, p)) as [
        a: Vector2,
        b: Vector2,
    ];
}

export class BucketMode implements ToolMode {
    id = ID_MODE_GRADIENT;
    icons = [
        {
            icon: logo,
            label: "Gradient Paint Bucket",
            filter: {
                activeTools: [ID_TOOL_DRAWING],
                permissions: ["DRAWING_UPDATE" as const],
            },
        },
    ];
    cursors = [
        {
            cursor: "grabbing",
            filter: {
                dragging: true,
                target: KEY_FILTER_CONTROL_POINT,
            },
        },
        {
            cursor: "grab",
            filter: {
                target: KEY_FILTER_CONTROL_POINT,
            },
        },
        {
            cursor: "pointer",
            filter: {
                target: KEY_FILTER_GRADIENT_TARGET,
            },
        },
        {
            cursor: "not-allowed",
        },
    ];
    preventDrag = {
        target: KEY_FILTER_NOT_CONTROL_POINT,
    };

    #dragCpState?: {
        startPosition: Vector2;
        targetId: string;
        targetInverseTransform: Matrix;
        controlPointId: string;
        controlPointIndex: number;
        effectId: string;
    };
    readonly #watcher: Watcher;
    constructor(watcher: Watcher) {
        this.#watcher = watcher;
    }

    readonly onActivate = () => this.#watcher.handleMessage(true);
    readonly onDeactivate = () => this.#watcher.handleMessage(false);

    readonly onClick = (_context: ToolContext, elementId: string) => {
        void this;
        void OBR.popover.open({
            height: 600,
            width: 350,
            id: ID_POPOVER_SETTINGS,
            url: "/src/popoverSettings/popoverSettings.html",
            anchorElementId: elementId,
            anchorOrigin: {
                horizontal: "CENTER",
                vertical: "BOTTOM",
            },
            transformOrigin: {
                horizontal: "CENTER",
                vertical: "TOP",
            },
            hidePaper: true,
        });
        return true;
    };

    readonly onToolClick = async (context: ToolContext, event: ToolEvent) => {
        void this;
        const toolMetadata = context.metadata[METADATA_KEY_GRADIENT] as
            | ToolMetadata
            | undefined;

        if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
            return this.#removeGradient(event.target);
        }

        if (
            event.target &&
            isGradientTarget(event.target) &&
            !isControlPoint(event.target)
        ) {
            const inverseTransform = MathM.inverse(
                MathM.fromItem(event.target),
            );
            const bounds = await OBR.scene.items.getItemBounds([
                event.target.id,
            ]);
            await OBR.scene.items.updateItems([event.target], ([target]) => {
                if (target) {
                    target.style.fillColor = "#000000";
                    target.style.fillOpacity = 0.01;
                    const oldMetadata = target.metadata[METADATA_KEY_GRADIENT];
                    target.metadata[METADATA_KEY_GRADIENT] = {
                        controlPointOffsets:
                            oldMetadata?.controlPointOffsets ??
                            getDefaultControlPoints(
                                toolMetadata,
                                inverseTransform,
                                bounds,
                            ),
                        type: toolMetadata?.type ?? DEFAULT_GRADIENT_SHAPE,
                        pattern: toolMetadata?.pattern,
                        blendMode: toolMetadata?.blendMode,
                        stops:
                            toolMetadata?.stops ??
                            getDefaultStops(context.metadata),
                    };
                }
            });
        }
    };

    // eslint-disable-next-line class-methods-use-this
    readonly #removeGradient = async (target?: Item) => {
        if (target && isGradientTarget(target)) {
            await OBR.scene.items.updateItems([target], ([target]) => {
                if (target) {
                    delete target.metadata[METADATA_KEY_GRADIENT];
                }
            });
        }
    };

    onToolDoubleClick = (_context: ToolContext, event: ToolEvent) =>
        this.#removeGradient(event.target);

    onToolDragStart = async (_context: ToolContext, event: ToolEvent) => {
        if (event.target && isControlPoint(event.target)) {
            const gradientTargetId = event.target.attachedTo;
            if (!gradientTargetId) {
                return;
            }
            const [gradientTarget] = await OBR.scene.items.getItems([
                gradientTargetId,
            ]);
            if (!gradientTarget) {
                return;
            }
            const [effect] = (
                await OBR.scene.local.getItems(isGradientEffect)
            ).filter((effect) => effect.attachedTo === gradientTargetId);
            if (!effect) {
                return;
            }

            this.#dragCpState = {
                controlPointId: event.target.id,
                controlPointIndex:
                    event.target.metadata[METADATA_KEY_CONTROL_POINT_INDEX],
                effectId: effect.id,
                targetId: gradientTarget.id,
                targetInverseTransform: MathM.inverse(
                    MathM.fromItem(gradientTarget),
                ),
                startPosition: event.target.position,
            };
        }
    };

    onToolDragMove = async (_context: ToolContext, event: ToolEvent) => {
        await this.#moveControlPoint(event.pointerPosition);
    };

    readonly #moveControlPoint = async (position: Vector2) => {
        if (this.#dragCpState) {
            const index = this.#dragCpState.controlPointIndex;
            const localOffset = matrixMultiply(
                this.#dragCpState.targetInverseTransform,
                position,
            );
            await OBR.scene.local.updateItems(
                [this.#dragCpState.controlPointId, this.#dragCpState.effectId],
                ([controlPoint, effect]) => {
                    if (
                        !controlPoint ||
                        !effect ||
                        !isControlPoint(controlPoint) ||
                        !isGradientEffect(effect)
                    ) {
                        return;
                    }

                    controlPoint.position = position;
                    moveControlPoint(effect, index, localOffset);
                },
            );
            return localOffset;
        } else {
            return undefined;
        }
    };

    onToolDragCancel = async () => {
        if (this.#dragCpState) {
            await this.#moveControlPoint(this.#dragCpState.startPosition);
            this.#dragCpState = undefined;
        }
    };

    onToolDragEnd = async (_context: ToolContext, event: ToolEvent) => {
        const localOffset = await this.#moveControlPoint(event.pointerPosition);
        if (this.#dragCpState && localOffset) {
            const index = this.#dragCpState.controlPointIndex;
            await OBR.scene.items.updateItems(
                [this.#dragCpState.targetId],
                ([target]) => {
                    if (!target || !isGradientTarget(target)) {
                        return;
                    }
                    const controlPoint =
                        target.metadata[METADATA_KEY_GRADIENT]
                            ?.controlPointOffsets?.[index];
                    if (!controlPoint) {
                        return;
                    }
                    controlPoint.x = localOffset.x;
                    controlPoint.y = localOffset.y;
                },
            );
        }
        this.#dragCpState = undefined;
    };
}
