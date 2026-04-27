#!/usr/bin/env sh
set -eu

info_msg() {
  printf '\x1b[36m%s\x1b[0m\n' "$*"
}

# make integration_tests current working directory
cd "$(dirname "$0")"

info_msg Cloning the latest hmpps-template-typescript
[ -d hmpps-template-typescript ] && rm -rf hmpps-template-typescript
git clone https://github.com/ministryofjustice/hmpps-template-typescript.git

info_msg Installing the latest @ministryofjustice/hmpps-connect-dps-components
cd hmpps-template-typescript
npx @ministryofjustice/hmpps-connect-dps-components

info_msg Building template project
npm run build
cat ../../feature-test-app.env >> feature.env

info_msg Starting template project
npm run start-feature
