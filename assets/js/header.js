document.addEventListener('DOMContentLoaded', initHeader, false)
function initHeader() {
  const searchToggle = document.querySelector('.connect-dps-common-header__search-menu-toggle')
  const searchMenu = document.querySelector('.connect-dps-common-header__search-menu')

  if (searchToggle) {
    hideLink()

    searchToggle.removeAttribute('hidden')
    searchToggle.setAttribute('aria-expanded', 'false')

    searchToggle.addEventListener('click', function (event) {
      toggleSearchMenu(searchToggle, searchMenu)
    })
  }
}

function toggleSearchMenu(searchToggle, searchMenu) {
  const isOpen = !searchMenu.getAttribute('hidden')

  if (isOpen) {
    searchMenu.setAttribute('hidden', 'hidden')
    searchToggle.classList.remove('connect-dps-common-header__search-menu-toggle-open')
    searchToggle.setAttribute('aria-expanded', 'false')
    searchToggle.setAttribute('aria-label', searchToggle.dataset.textForShow)
  } else {
    searchMenu.removeAttribute('hidden')
    searchToggle.classList.add('connect-dps-common-header__search-menu-toggle-open')
    searchToggle.setAttribute('aria-expanded', 'true')
    searchToggle.setAttribute('aria-label', searchToggle.dataset.textForHide)
  }
}

function hideLink() {
  const searchLink = document.querySelector('.connect-dps-common-header__search-menu-link')
  searchLink.setAttribute('hidden', 'hidden')
}
