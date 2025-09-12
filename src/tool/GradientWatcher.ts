import OBR, { isEffect, type BlendMode, type Item } from "@owlbear-rodeo/sdk";
import type { ItemWatcher, Patcher } from "owlbear-utils";
import { METADATA_KEY_GRADIENT } from "../constants";
import { buildControlPoint } from "./ControlPoint";
import { buildGradientEffect, fixEffect } from "./GradientEffect";
import { isGradientTarget, type GradientTarget } from "./GradientTarget";

export class GradientWatcher implements ItemWatcher<GradientTarget> {
    readonly #targetId: string;
    #effectId?: string;
    #previousBlendMode?: BlendMode;
    #showControlPoints = false;
    #controlPoints?: [a: string, b: string];

    static readonly isTarget = (item: Item): item is GradientTarget =>
        isGradientTarget(item);

    readonly #createEffect = (target: GradientTarget, patcher: Patcher) => {
        const effect = buildGradientEffect(target);
        this.#effectId = effect.id;
        this.#previousBlendMode =
            target.metadata[METADATA_KEY_GRADIENT]?.blendMode;
        patcher.addLocal(effect);
    };

    constructor(target: GradientTarget, patcher: Patcher) {
        this.#targetId = target.id;
        if (target.metadata[METADATA_KEY_GRADIENT]) {
            this.#createEffect(target, patcher);
        }
    }

    readonly handleItemUpdate = (target: GradientTarget, patcher: Patcher) => {
        const metadata = target.metadata[METADATA_KEY_GRADIENT];
        const effectShouldExist = !!metadata;

        // Workaround: OBR doesn't currently support updating blend modes on effects.
        // To change the blend mode, we have to recreate the effect.
        const blendMode = metadata?.blendMode;
        if (this.#effectId && blendMode !== this.#previousBlendMode) {
            patcher.deleteLocal(this.#effectId);
            this.#effectId = undefined;
            this.#previousBlendMode = undefined;
        }

        if (!this.#effectId && effectShouldExist) {
            this.#createEffect(target, patcher);
        } else if (this.#effectId && !effectShouldExist) {
            patcher.deleteLocal(this.#effectId);
            this.#effectId = undefined;
            if (this.#controlPoints) {
                patcher.deleteLocal(...this.#controlPoints);
                this.#controlPoints = undefined;
            }
        } else if (this.#effectId && effectShouldExist) {
            void patcher.updateLocal(this.#effectId, (effect) => {
                if (isEffect(effect)) {
                    fixEffect(target, effect);
                }
            });
        }
        this.#fixControlPoints(patcher);
    };

    readonly handleItemDelete = (/*patcher: Patcher*/) => {
        void this;
        // if (this.#effectId) {
        //     patcher.deleteLocal(this.#effectId);
        // }
        // if (this.#controlPoints) {
        //     patcher.deleteLocal(...this.#controlPoints);
        // }
    };

    readonly handleMessage = (message: unknown, patcher: Patcher) => {
        if (typeof message === "boolean") {
            this.#showControlPoints = message;
            this.#fixControlPoints(patcher);
        }
    };

    readonly #fixControlPoints = (patcher: Patcher) => {
        if (this.#showControlPoints && !this.#controlPoints) {
            void this.#createControlPoints();
        } else if (!this.#showControlPoints && this.#controlPoints) {
            patcher.deleteLocal(...this.#controlPoints);
            this.#controlPoints = undefined;
        }
    };

    readonly #createControlPoints = async () => {
        const [target] = await OBR.scene.items.getItems([this.#targetId]);
        if (!target || !isGradientTarget(target)) {
            return;
        }
        const metadata = target.metadata[METADATA_KEY_GRADIENT];
        if (!metadata) {
            return;
        }
        const cpA = buildControlPoint(
            target,
            metadata.controlPointOffsets[0],
            0,
        );
        const cpB = buildControlPoint(
            target,
            metadata.controlPointOffsets[1],
            1,
        );
        await OBR.scene.local.addItems([cpA, cpB]);
        this.#controlPoints = [cpA.id, cpB.id];
    };
}
