declare module "tinycolor2" {
    interface Tinycolor {
        toRgbString(): string;
        toRgb(): {
            /**
             * 0-255
             */
            r: number;
            /**
             * 0-255
             */
            g: number;
            /**
             * 0-255
             */
            b: number;
            /**
             * 0-1
             */
            a: number;
        };
    }

    export default function tinycolor(s: string): Tinycolor;
}
