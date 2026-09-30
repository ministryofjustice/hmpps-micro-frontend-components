# hmpps-micro-frontend-components

[![Ministry of Justice Repository Compliance Badge](https://github-community.service.justice.gov.uk/repository-standards/api/hmpps-micro-frontend-components/badge?style=flat)](https://github-community.service.justice.gov.uk/repository-standards/hmpps-micro-frontend-components)
[![Docker Repository on GHCR](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://ghcr.io/ministryofjustice/hmpps-micro-frontend-components)
[![Pipeline [test -> build -> deploy]](https://github.com/ministryofjustice/hmpps-micro-frontend-components/actions/workflows/pipeline.yml/badge.svg?branch=main)](https://github.com/ministryofjustice/hmpps-micro-frontend-components/actions/workflows/pipeline.yml)

This project provides front-end components to be injected into HMPPS applications.

The application allows access to the components via two paths. The `/{component}` level and `/develop/{component}`.

The root level component contains the minimum requirements of the component to be incorporated into other applications. It is authed via a user token sent through on the `x-user-token` header and returns a json payload containing a stringified html block.

The `/develop/` path displays the component in an HTML page including the required blocks and assets for display. This is to be used for development of components and is authed via `hmpps-auth` as the other applications are.

## Available components
* Header
* Footer

## Contents

- [Incorporating components](readme/incorporating.md)
- [Configuring services](readme/configuring-services.md)
- [Building and running](readme/building-and-running.md)
- [Testing](readme/testing.md)
- [Maintenance](readme/maintenance.md)
