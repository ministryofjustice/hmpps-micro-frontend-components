# Description

This project provides front-end components to be injected into HMPPS applications.

The application allows access to the components via two paths. The `/{component}` level and `/develop/{component}`.

The root level component contains the minimum requirements of the component to be incorporated into other applications. It is authed via a user token sent through on the `x-user-token` header and returns a json payload containing a stringified html block.

The `/develop/` path displays the component in an HTML page including the required blocks and assets for display. This is to be used for development of components and is authed via `hmpps-auth` as the other applications are.

## Available components
* Header
* Footer

## Contents

1. [Incorporating components](readme/incorporating.md)
2. [Building and Running](readme/building_and_running.md)
3. [Testing](readme/testing.md)
4. [Maintenance](readme/maintenance.md)