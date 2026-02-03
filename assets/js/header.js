import { ApplicationInsights } from '@microsoft/applicationinsights-web'

document.addEventListener('DOMContentLoaded', initHeader, false)
const tabOpenClass = 'connect-dps-common-header__toggle-open'
function initHeader() {
  const searchToggle = document.querySelector('.connect-dps-common-header__search-menu-toggle')
  const searchMenu = document.querySelector('#connect-dps-common-header-search-menu')

  const userToggle = document.querySelector('.connect-dps-common-header__user-menu-toggle')
  const userMenu = document.querySelector('#connect-dps-common-header-user-menu')

  const servicesToggle = document.querySelector('.connect-dps-common-header__services-menu-toggle')
  const servicesMenu = document.querySelector('#connect-dps-common-header-services-menu')

  const searchSubmitBtn = searchMenu && searchMenu.querySelector('button[type="submit"]')
  const submitUrl = searchMenu && searchMenu.querySelector('form').getAttribute('action')

  if (searchToggle) {
    hideFallbackLinks()
    searchToggle.removeAttribute('hidden')
    userToggle.removeAttribute('hidden')
    servicesToggle.removeAttribute('hidden')

    closeTabs([
      [searchToggle, searchMenu],
      [userToggle, userMenu],
      [servicesToggle, servicesMenu],
    ])

    searchToggle.addEventListener('click', function (event) {
      closeTabs([
        [userToggle, userMenu],
        [servicesToggle, servicesMenu],
      ])
      toggleMenu(searchToggle, searchMenu)
    })
    userToggle.addEventListener('click', function (event) {
      closeTabs([
        [searchToggle, searchMenu],
        [servicesToggle, servicesMenu],
      ])
      toggleMenu(userToggle, userMenu)
    })
    servicesToggle.addEventListener('click', function (event) {
      closeTabs([
        [searchToggle, searchMenu],
        [userToggle, userMenu],
      ])
      toggleMenu(servicesToggle, servicesMenu)
    })

    searchSubmitBtn.addEventListener('click', function (event) {
      event.preventDefault()
      const searchTerms = searchMenu.querySelector('#connect-dps-common-header-prisoner-search').value
      const parsed = searchTerms.replace(' ', '+')
      window.location.href = submitUrl + '?keywords=' + parsed
    })
  }

  const { connectionString, activeCaseload, enabledCaseloads } = document.querySelector(
    '#dps-header-app-insights-config',
  ).dataset

  if (
    (enabledCaseloads.split(',').includes(activeCaseload) || enabledCaseloads.split(',').includes('***')) &&
    connectionString !== ''
  ) {
    tryTelemetry()
  }
}

function closeTabs(tabTuples) {
  tabTuples.forEach(([toggle, menu]) => {
    menu.setAttribute('hidden', 'hidden')
    toggle.classList.remove(tabOpenClass)
    toggle.parentElement.classList.remove('item-open')
    toggle.setAttribute('aria-expanded', 'false')
    if (toggle.dataset.textForShow) toggle.setAttribute('aria-label', toggle.dataset.textForShow)
  })
}

function toggleMenu(toggle, menu) {
  const isOpen = !menu.getAttribute('hidden')
  const header = document.querySelector('.connect-dps-common-header')
  header.classList.remove('connect-dps-service-menu-open')
  header.classList.remove('connect-dps-search-menu-open')
  if (isOpen) {
    closeTabs([[toggle, menu]])
  } else {
    if (menu.id === 'connect-dps-common-header-services-menu') {
      header.classList.add('connect-dps-service-menu-open')
    }
    if (menu.id === 'connect-dps-common-header-search-menu') {
      header.classList.add('connect-dps-search-menu-open')
    }
    menu.removeAttribute('hidden')
    toggle.classList.add(tabOpenClass)
    toggle.parentElement.classList.add('item-open')
    toggle.setAttribute('aria-expanded', 'true')
    if (toggle.dataset.textForHide) toggle.setAttribute('aria-label', toggle.dataset.textForHide)
  }
}

function hideFallbackLinks() {
  const searchLink = document.querySelector('.connect-dps-common-header__search-menu-link')
  const userLink = document.querySelector('.connect-dps-common-header__user-menu-link')
  const servicesLink = document.querySelector('.connect-dps-common-header__services-menu-link')
  searchLink.setAttribute('hidden', 'hidden')
  userLink.setAttribute('hidden', 'hidden')
  servicesLink.setAttribute('hidden', 'hidden')
}

async function tryTelemetry() {
  try {
    // Test fetch to see if app insights is allowed by content security policy
    await fetch('https://js.monitor.azure.com/scripts/b/ai.config.1.cfg.json', { method: 'GET' })
    await fetch('https://northeurope-0.in.applicationinsights.azure.com/v2/track', { method: 'POST' })
    initAppInsights()
  } catch (e) {
    console.warn(
      'hmpps-micro-frontend-components: Component app insights disabled due to content security policy. ' +
        'Serverside app insights instances are unaffected. ' +
        'To enable, either update hmpps-connect-dps-components dependency or allow connect-src ' +
        "'https://northeurope-0.in.applicationinsights.azure.com' and '*.monitor.azure.com'",
    )
  }
}

function initAppInsights() {
  const { hashedUserId, activeCaseload, clientId, connectionString, buildNumber } = document.querySelector(
    '#dps-header-app-insights-config',
  ).dataset

  const snippet = {
    config: {
      connectionString: connectionString,
      autoTrackPageVisitTime: false, // no need
      disableFetchTracking: true, // otherwise we get spammed with GA fetch requests being incorrectly reported as failing
    },
  }

  const init = new ApplicationInsights(snippet)
  const appInsights = init.loadAppInsights()

  appInsights.addTelemetryInitializer(function (envelope) {
    envelope.tags['ai.cloud.role'] = 'hmpps-micro-frontend-components'
    envelope.tags['ai.application.ver'] = buildNumber
    if (t.baseType == 'Event') return true // only allow custom events to be tracked
    return false // disable everything else
  })

  const headerEl = document.querySelector('.connect-dps-header-wrapper')

  const menuToggleBtn = headerEl.querySelector('.connect-dps-common-header__services-menu-toggle')
  menuToggleBtn.addEventListener('click', () => {
    const expanded = menuToggleBtn.getAttribute('aria-expanded') === 'true'
    appInsights.trackEvent({
      name: expanded ? 'frontend-components-service-menu-expanded' : 'frontend-components-service-menu-collapsed',
      properties: { activeCaseload, clientId, hashedUserId },
    })
  })

  headerEl.querySelectorAll('.connect-dps-service-menu-link').forEach(link => {
    link.addEventListener('click', () => {
      const serviceId = link.getAttribute('data-service-id')
      appInsights.trackEvent({
        name: 'frontend-components-service-clicked',
        properties: { service: serviceId, activeCaseload, clientId, hashedUserId },
      })
    })
  })

  // Force send when leaving page
  addEventListener('pagehide', () => {
    appInsights.flush()
  })
}
