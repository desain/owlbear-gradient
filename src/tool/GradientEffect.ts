import {
    buildEffect,
    isEffect,
    type Effect,
    type Item,
    type Vector2,
} from "@owlbear-rodeo/sdk";
import {
    pairs,
    withIndices,
    type HasParameterizedMetadata,
} from "owlbear-utils";
import { METADATA_KEY_GRADIENT, METADATA_KEY_IS_GRADIENT } from "../constants";
import type { GradientShape, GradientTarget, Pattern } from "./GradientTarget";

export type GradientEffect = Effect &
    HasParameterizedMetadata<typeof METADATA_KEY_IS_GRADIENT, true>;

export function isGradientEffect(item: Item): item is GradientEffect {
    return isEffect(item) && !!item.metadata[METADATA_KEY_IS_GRADIENT];
}

export function buildGradientEffect(target: GradientTarget) {
    const effect = buildEffect()
        .name("Gradient Fill")
        .metadata({ [METADATA_KEY_IS_GRADIENT]: true })
        .position(target.position)
        .attachedTo(target.id)
        .disableAttachmentBehavior(["COPY", "LOCKED"])
        .effectType("ATTACHMENT")
        .zIndex(target.zIndex + 1)
        .locked(true)
        .disableHit(true)
        .build();
    fixEffect(target, effect);
    return effect;
}

const controlPointUniform = (i: number) => `cp${i}`;
const cp0 = controlPointUniform(0);
const cp1 = controlPointUniform(1);
const stopColorUniform = (i: number) => `s${i}c`;
const stopAlphaLeftUniform = (i: number) => `s${i}al`;
const stopAlphaExpression = (i: number) => stopAlphaLeftUniform(i) + ".x";
const left = (i: number) => stopAlphaLeftUniform(i) + ".y";
const color = (i: number) =>
    `(vec4(${stopColorUniform(i)},1.0) * ${stopAlphaExpression(i)})`;

function uvFunction(shape: GradientShape) {
    switch (shape) {
        case "LINEAR":
            return "linearSt";
        case "RADIAL":
            return "radialSt";
    }
}

function patternFunction(pattern?: Pattern) {
    switch (pattern) {
        case undefined:
            return "gradient";
        case "STRIPE":
            return "stripe";
        case "SIN":
            return "sinWave";
        case "TRIANGLE_WAVE":
            return "triangleWave";
        case "HATCH":
            return "hatch";
        case "CHECKER":
            return "checker";
    }
}

export function fixEffect(target: GradientTarget, effect: Effect) {
    effect.layer = target.layer;
    effect.zIndex = target.zIndex + 1;
    const metadata = target.metadata[METADATA_KEY_GRADIENT];
    if (
        !metadata ||
        metadata.stops.length < 2 ||
        metadata.controlPointOffsets.length < 2
    ) {
        return;
    }
    effect.uniforms = [
        ...metadata.controlPointOffsets.map((offset, i) => ({
            name: controlPointUniform(i),
            value: offset,
        })),
        ...metadata.stops.map((stop, i) => ({
            name: stopColorUniform(i),
            value: stop.color,
        })),
        ...metadata.stops.map((stop, i) => ({
            name: stopAlphaLeftUniform(i),
            value: { x: stop.alpha, y: stop.left },
        })),
    ];

    const indexedStops = [...withIndices(metadata.stops)];
    const colorLast = color(metadata.stops.length - 1);
    effect.sksl = `
        ${metadata.controlPointOffsets
            .map((_, i) => `uniform vec2 ${controlPointUniform(i)};`)
            .join("\n")}
        ${metadata.stops
            .map((_, i) => `uniform vec3 ${stopColorUniform(i)};`)
            .join("\n")}
        ${metadata.stops
            .map((_, i) => `uniform vec2 ${stopAlphaLeftUniform(i)};`)
            .join("\n")}
        
        const float PI = 3.1415926538;
        
        // TODO: find matrix that takes unit line on X axis to a->b, invert, multiply p?
        vec2 linearSt(vec2 p, vec2 a, vec2 b) {
            vec2 ab = b - a;
            vec2 ap = p - a;
            float denom = dot(ab, ab);
            if (denom == 0.0) { return vec2(0.0); } // degenerate segment: define uv=origin

            vec2 perpab = vec2(ab.y,-ab.x);
            return vec2(dot(ap, ab) / denom, dot(ap,perpab) / denom);
        }
        
        vec2 radialSt(vec2 p, vec2 a, vec2 b) {
            vec2 ab = b - a;
            vec2 ap = p - a;
            if (a == b) { return vec2(0.0); } // degenerate segment: define uv=origin
            float det = ab.x * ap.y - ab.y * ap.x;
            float angle = atan(det, dot(ab, ap));
            return vec2(length(ap) / length(ab),
                        4 * angle / PI);
        }

        vec4 gradient(vec2 st) {
            if (st.s <= ${left(0)}) return ${color(0)};
            ${[...pairs(indexedStops)]
                .map(
                    ([[, ai], [, bi]]) => `else if (st.s <= ${left(bi)}) {
                        float a = (st.s - ${left(ai)}) / (${left(bi)} - ${left(
                        ai,
                    )});
                        return mix(${color(ai)}, ${color(bi)}, a);
                    }`,
                )
                .join("\n")}
            else return ${color(metadata.stops.length - 1)};
        }

        vec4 stripe(vec2 st) {
            return mix(${color(0)}, ${colorLast},
                smoothstep(-0.01, 0.01, sin(st.s * 2.0 * PI)));
        }

        vec4 sinWave(vec2 st) {
            return stripe(st + vec2(0.2 * sin(st.t * PI)));
        }

        vec4 triangleWave(vec2 st) {
            float a = 0.2; // amplitude; period = 1
            // fract = mod 1
            float wave = 4 * a * abs(fract(st.t-0.25) - 0.5) - a;
            return stripe(st + vec2(wave));
        }
        
        vec4 hatch(vec2 st) {
            return any(lessThan(fract(st), vec2(0.1)))
                ? ${color(0)} : ${colorLast};
        }

        vec4 checker(vec2 st) {
            bvec2 b = lessThan(fract(st), vec2(0.5));
            return b[0] != b[1] ? ${color(0)} : ${colorLast};
        }
        
        half4 main(in vec2 coord) {
            vec2 st = ${uvFunction(metadata.type)}(coord, ${cp0}, ${cp1});
            return ${patternFunction(metadata.pattern)}(st);
        }
    `;
}

export function moveControlPoint(
    effect: GradientEffect,
    index: number,
    offset: Vector2,
) {
    const uniform = effect.uniforms.find(
        (u) => u.name === controlPointUniform(index),
    );
    if (uniform) {
        uniform.value = offset;
    }
}
