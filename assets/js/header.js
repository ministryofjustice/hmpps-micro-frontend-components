document.addEventListener('DOMContentLoaded', initHeader, false)
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
      toggleMenu(searchToggle, searchMenu, 'connect-dps-common-header__search-menu-toggle-open')
    })
    userToggle.addEventListener('click', function (event) {
      toggleMenu(userToggle, userMenu, 'connect-dps-common-header__user-menu-toggle-open')
    })
  }
}

function toggleMenu(toggle, menu, toggleClass) {
  const isOpen = !menu.getAttribute('hidden')

  if (isOpen) {
    menu.setAttribute('hidden', 'hidden')
    toggle.classList.remove(toggleClass)
    toggle.setAttribute('aria-expanded', 'false')
    toggle.setAttribute('aria-label', toggle.dataset.textForShow)
  } else {
    menu.removeAttribute('hidden')
    toggle.classList.add(toggleClass)
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
