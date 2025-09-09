# Gradient Paint Bucket

Owlbear Rodeo extension to draw gradients on shapes.

## Features

-   🎨 Draw linear and radial gradients on objects
-   🕹️ Easily adjust gradients with control points

## How to use

### Setting a Gradient

With the drawing tool selected, click on the Gradient Paint Bucket icon in the top row:

![paint bucket icon](https://owlbear-gradient.nicholassdesai.workers.dev/paint-bucket-icon.png)

Set your gradient parameters using the control window:

![gradient controls](https://owlbear-gradient.nicholassdesai.workers.dev/gradient-controls.png)

-   Toggle between linear and radial gradients above the color controls
-   The top color row is a preview of your gradient
    -   In the preview, click on a gradient stop to change its color, or drag it to reposition
    -   Delete stops by clicking them then clicking the trash icon
-   The next row is a hue slider
-   The bottom row is a transparency slider

### Applying to Shapes

With the tool selected, click a shape to apply the gradient:

![example gradient](https://owlbear-gradient.nicholassdesai.workers.dev/example-gradient.png)

While the tool is selected, you will see control points on the shapes that have gradients. You can move these to adjust the gradient.

![control points](https://owlbear-gradient.nicholassdesai.workers.dev/control-points.png)

Double-click or shift-click a shape to remove its gradient.

## Support

If you need support for this extension you can message me in the [Owlbear Rodeo Discord](https://discord.com/invite/u5RYMkV98s) @Nick or open an issue on [GitHub](https://github.com/desain/owlbear-gradient/issues).

## Development

After checkout, run `pnpm install`.

## How it Works

This project is a Typescript app with Vite as a bundler, using Material UI React components and a Zustand store.

Icons from https://game-icons.net.

## Building

This project uses [pnpm](https://pnpm.io/) as a package manager.

To install all the dependencies run:

`pnpm install`

To run in a development mode run:

`pnpm dev`

To make a production build run:

`pnpm build`

## To do

-   UI for patterns

## License

GNU GPLv3
