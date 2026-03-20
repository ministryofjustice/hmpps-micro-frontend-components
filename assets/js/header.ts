const itemOpenClass = 'connect-dps-common-header__navigation__item-open'
const tabOpenClass = 'connect-dps-common-header__toggle-open'

function initHeader() {
  const searchToggle = document.querySelector<HTMLButtonElement>('.connect-dps-common-header__search-menu-toggle')
  const searchMenu = document.querySelector<HTMLDivElement>('#connect-dps-common-header-search-menu')!

  const userToggle = document.querySelector<HTMLButtonElement>('.connect-dps-common-header__user-menu-toggle')!
  const userMenu = document.querySelector<HTMLUListElement>('#connect-dps-common-header-user-menu')!

  const servicesToggle = document.querySelector<HTMLButtonElement>('.connect-dps-common-header__services-menu-toggle')!
  const servicesMenu = document.querySelector<HTMLDivElement>('#connect-dps-common-header-services-menu')!

  const searchSubmitBtn = searchMenu && searchMenu.querySelector<HTMLButtonElement>('button[type="submit"]')
  const submitUrl = searchMenu && searchMenu.querySelector('form')?.getAttribute('action')

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

    searchToggle.addEventListener('click', function () {
      closeTabs([
        [userToggle, userMenu],
        [servicesToggle, servicesMenu],
      ])
      toggleMenu(searchToggle, searchMenu)
    })
    userToggle.addEventListener('click', function () {
      closeTabs([
        [searchToggle, searchMenu],
        [servicesToggle, servicesMenu],
      ])
      toggleMenu(userToggle, userMenu)
    })
    servicesToggle.addEventListener('click', function () {
      closeTabs([
        [searchToggle, searchMenu],
        [userToggle, userMenu],
      ])
      toggleMenu(servicesToggle, servicesMenu)
    })

    searchSubmitBtn?.addEventListener('click', function (event) {
      event.preventDefault()
      const searchTerms = searchMenu.querySelector<HTMLInputElement>('#connect-dps-common-header-prisoner-search')!.value
      const parsed = searchTerms.replace(' ', '+')
      window.location.href = submitUrl + '?keywords=' + parsed
    })

    function closeUserMenuOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeTabs([[userToggle, userMenu]])
        userToggle.focus()
      }
    }
    userToggle.addEventListener('keydown', closeUserMenuOnEscape)
    userMenu.addEventListener('keydown', closeUserMenuOnEscape)

    let closeUserMenuTimer: number | null = null
    function cancelCloseUserMenu() {
      if (closeUserMenuTimer) {
        clearTimeout(closeUserMenuTimer)
      }
    }
    function closeUserMenuSoon() {
      closeUserMenuTimer = setTimeout(() => {
        closeTabs([[userToggle, userMenu]])
      }, 100) as unknown as number
    }
    userToggle.addEventListener('focus', cancelCloseUserMenu)
    userToggle.addEventListener('blur', closeUserMenuSoon)
    userMenu.querySelectorAll<HTMLAnchorElement>('.connect-dps-common-header__submenu-link').forEach(userMenuLink => {
      userMenuLink.addEventListener('focus', cancelCloseUserMenu)
      userMenuLink.addEventListener('blur', closeUserMenuSoon)
    })
  }
}

function closeTabs(tabTuples: [toggle: HTMLButtonElement, menu: HTMLElement][]) {
  tabTuples.forEach(([toggle, menu]) => {
    menu.setAttribute('hidden', 'hidden')
    toggle.classList.remove(tabOpenClass)
    toggle.parentElement!.classList.remove(itemOpenClass)
    toggle.setAttribute('aria-expanded', 'false')
    if (toggle.dataset.textForShow) {
      toggle.setAttribute('aria-label', toggle.dataset.textForShow)
    }
  })
}

function toggleMenu(toggle: HTMLButtonElement, menu: HTMLElement) {
  const isOpen = !menu.getAttribute('hidden')
  const header = document.querySelector<HTMLDivElement>('.connect-dps-common-header')!
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
    toggle.parentElement!.classList.add(itemOpenClass)
    toggle.setAttribute('aria-expanded', 'true')
    if (toggle.dataset.textForHide) toggle.setAttribute('aria-label', toggle.dataset.textForHide)
  }
}

function hideFallbackLinks() {
  const searchLink = document.querySelector<HTMLAnchorElement>('.connect-dps-common-header__search-menu-link')!
  const userLink = document.querySelector<HTMLDivElement>('.connect-dps-common-header__user-menu-link')!
  const servicesLink = document.querySelector<HTMLDivElement>('.connect-dps-common-header__services-menu-link')!
  searchLink.setAttribute('hidden', 'hidden')
  userLink.setAttribute('hidden', 'hidden')
  servicesLink.setAttribute('hidden', 'hidden')
}

document.addEventListener('DOMContentLoaded', initHeader, false)
