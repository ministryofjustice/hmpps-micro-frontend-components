# Client-side JS

`*.ts` files in this folder are built into javascript bundles by esbuild.

Each component that needs interactivity has it’s own bundle and `index.ts` is only used for previewing components
on the development page within this app – it is not served to clients.

Extending govuk-frontend components should probably be avoided so that excessive boilerplate is not included.
