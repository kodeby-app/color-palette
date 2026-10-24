# Color Palette

Make a color palette that works: shades for every color, a contrast check for readable text, and CSS or Tailwind code to copy. Free, no sign-up, and nothing leaves your device.

An example app made by the Kodeby team and listed on [kodeby.app](https://kodeby.app).

## What it does

- Five colors that go together: a dark, three colorful ones and a light, ready for a website or app
- Press Space for new colors, and lock the ones you want to keep
- Pick a style: analogous, complementary, triadic or one color
- Change any color with the color picker or by typing a hex code
- Eleven shades (50 to 950) for the color you select, made in the OKLCH color space so the steps look even
- A contrast check for text and background, with WCAG AA and AAA results for normal and large text
- Copy the palette as CSS variables, Tailwind config, SCSS or JSON, with or without shades
- Save palettes in your browser, and share a palette with a link
- English and Norwegian

## Privacy

Everything is stored in your browser's local storage. There is no server, no account, no analytics and no cookies.
A shared link carries the colors in the part after `#`, which browsers never send to a server.
The Content Security Policy in `vercel.json` blocks all network requests from the page (`connect-src 'none'`). Only kodeby.app may show the page in a frame, for the "Try it here" demo on its app page.

## Run locally

It is plain HTML, CSS and JavaScript with no build step:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Import the repository in Vercel with the default settings (Framework preset: Other, no build command).

## License

MIT
