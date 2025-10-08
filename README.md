# hmpps-micro-frontend-components
[![repo standards badge](https://img.shields.io/badge/endpoint.svg?&style=flat&logo=github&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-micro-frontend-components)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-report/hmpps-micro-frontend-components "Link to report")
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

1. [Incorporating components](readme/incorporating.md)
2. [Building and Running](readme/building_and_running.md)
3. [Testing](readme/testing.md)
4. [Maintenance](readme/maintenance.md)
