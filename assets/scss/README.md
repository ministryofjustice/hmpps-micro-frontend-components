# Client-side CSS

`*.scss` files in this folder are built into stylesheet bundles by esbuild.

Each component has it’s own bundle and `index.scss` is only used for previewing components
on the development page within this app – it is not served to clients.

**NB: At present, the components rely on clients to include govuk-frontend styles globally in pages.
For example, styling for the `govuk-visually-hidden` class is not bundled.**
