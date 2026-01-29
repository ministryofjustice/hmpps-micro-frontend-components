import { ApplicationInsights } from '@microsoft/applicationinsights-web';

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

  initTelemetry();

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

function initTelemetry() {
  // Not a regular app-insights setup (azureAppInsights.ts)
  // It's initialised on the client side + configured via data attributes available in the DOM.
  // Allows services using this header to provide app insights with minimal config on their side.

  const {
    activeCaseload,
    clientId,
    hashedUserId,
    buildNumber,
    connectionString,
  } = document.querySelector('#dps-header-app-insights-config').dataset;

  const snippet = {
    config: {
      connectionString: connectionString,
      autoTrackPageVisitTime: false, // no need
      disableFetchTracking: true, // otherwise we get spammed with GA fetch requests being incorrectly reported as failing
    }
  }
  
  const init = new ApplicationInsights(snippet)
  const appInsights = init.loadAppInsights();

  appInsights.addTelemetryInitializer(function (envelope) {
    envelope.tags["ai.cloud.role"] = "Frontend Components"
    envelope.tags["ai.application.ver"] = buildNumber
  });

  const headerEl = document.querySelector('.connect-dps-header-wrapper');

  const menuToggleBtn = headerEl.querySelector('.connect-dps-common-header__services-menu-toggle');
  menuToggleBtn.addEventListener('click', () => {
    const expanded = menuToggleBtn.getAttribute('aria-expanded') === 'true';
    appInsights.trackEvent({
      name: expanded ? 'frontend-components-service-menu-expanded' : 'frontend-components-service-menu-collapsed',
      properties: { activeCaseload, clientId, hashedUserId }
    });
    appInsights.flush(); // forces immediate send
  });

  headerEl.querySelectorAll('.connect-dps-service-menu-link').forEach(link => {
    link.addEventListener('click', () => {
      const serviceId = link.getAttribute('data-service-id');
      appInsights.trackEvent({
        name: 'frontend-components-service-clicked',
        properties: { service: serviceId, activeCaseload, clientId, hashedUserId }
      });
      appInsights.flush(); // forces immediate send
    });
  });
}