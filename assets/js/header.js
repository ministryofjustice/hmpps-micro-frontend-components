document.addEventListener('DOMContentLoaded', initHeader, false)
const tabOpenClass = 'connect-dps-common-header__toggle-open'
function initHeader() {
  const searchToggle = document.querySelector('.connect-dps-common-header__search-menu-toggle')
  const searchMenu = document.querySelector('.connect-dps-common-header__search-menu')

  const userToggle = document.querySelector('.connect-dps-common-header__user-menu-toggle')
  const userMenu = document.querySelector('#connect-dps-common-header-user-menu')

  if (searchToggle) {
    hideFallbackLinks()

    searchToggle.removeAttribute('hidden')
    searchToggle.setAttribute('aria-expanded', 'false')
    userToggle.removeAttribute('hidden')
    userToggle.setAttribute('aria-expanded', 'false')

    searchToggle.addEventListener('click', function (event) {
      closeTabs([[userToggle, userMenu]])
      toggleMenu(searchToggle, searchMenu)
    })
    userToggle.addEventListener('click', function (event) {
      closeTabs([[searchToggle, searchMenu]])
      toggleMenu(userToggle, userMenu)
    })
  }
}

function closeTabs(tabTuples) {
  tabTuples.forEach(([tab, menu]) => {
    menu.setAttribute('hidden', 'hidden')
    tab.classList.remove(tabOpenClass)
    tab.setAttribute('aria-expanded', 'false')
    tab.setAttribute('aria-label', tab.dataset.textForShow)
  })
}

function toggleMenu(toggle, menu) {
  const isOpen = !menu.getAttribute('hidden')

  if (isOpen) {
    menu.setAttribute('hidden', 'hidden')
    toggle.classList.remove(tabOpenClass)
    toggle.setAttribute('aria-expanded', 'false')
    toggle.setAttribute('aria-label', toggle.dataset.textForShow)
  } else {
    menu.removeAttribute('hidden')
    toggle.classList.add(tabOpenClass)
    toggle.setAttribute('aria-expanded', 'true')
    toggle.setAttribute('aria-label', toggle.dataset.textForHide)
  }
}

function hideFallbackLinks() {
  const searchLink = document.querySelector('.connect-dps-common-header__search-menu-link')
  const userLink = document.querySelector('.connect-dps-common-header__user-menu-link')
  searchLink.setAttribute('hidden', 'hidden')
  userLink.setAttribute('hidden', 'hidden')
}
