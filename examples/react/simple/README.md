# React + Vite example

A basic `redux-requests-factory` example built with React 19, Redux 5,
React Redux 9, TypeScript, and Vite.

Every request function forwards the factory-provided `AbortSignal` to `fetch`,
so `cancelRequestAction` stops the underlying network request as well as its
Redux lifecycle.

## Run

Build the library from the repository root, then install and run the example:

```bash
npm run build
cd examples/react/simple
npm install
npm run dev
```

Use `npm run build` to type-check the example and create a production bundle.
