/**
 * Cap on the `backUrl` we hand to the caseload switcher. A pathological page url could otherwise
 * produce a request line that an ingress rejects; dropping the parameter degrades to DPS’ referer
 * fallback, which still gets the user back to the service they came from.
 */
const MAX_BACK_URL_LENGTH = 2000

class DPSHeader {
  static init(): void {
    const $header = document.querySelector<HTMLElement>('[data-module="cdps-header"]')
    if ($header) {
      new this($header)
    }
  }

  private menuItems: MenuItem[] = []

  constructor($header: HTMLElement) {
    this.menuItems = ['user', 'services', 'search']
      .map(name => {
        const $item = $header.querySelector<HTMLDivElement>(`.cdps-header__item--${name}`)
        const $button = $item?.querySelector<HTMLAnchorElement>('.cdps-header__link')
        const $menu = $header.querySelector<HTMLDivElement>(`.cdps-header__menu--${name}`)
        if ($item && $button && $menu) {
          return new MenuItem(this, name, $item, $button, $menu)
        }
      })
      .filter<MenuItem>(menuItem => !!menuItem)

    const $caseloadAnchor = $header.querySelector<HTMLAnchorElement>('.cdps-header__item--caseload .cdps-header__link')
    if ($caseloadAnchor) {
      this.initBackUrl($caseloadAnchor)
    }
  }

  closeMenus(except?: string): void {
    this.menuItems.filter(menuItem => menuItem.name !== except).forEach(menuItem => menuItem.close())
  }

  /**
   * Tells the caseload switcher where to send the user back to. Set once up front so the link is
   * always usable, then refreshed just before navigation: the page url may have moved on since load
   * (e.g. filters applied via `history.pushState`) and we want where the user actually is, not where
   * they landed.
   */
  private initBackUrl($caseloadAnchor: HTMLAnchorElement): void {
    const setBackUrl = () => {
      this.setBackUrl($caseloadAnchor)
    }
    setBackUrl()
    // pointerdown covers the middle and modified clicks a click listener would miss,
    // focus covers keyboard use; both fire before the browser reads the href
    $caseloadAnchor.addEventListener('pointerdown', setBackUrl)
    $caseloadAnchor.addEventListener('focus', setBackUrl)
  }

  private setBackUrl($caseloadAnchor: HTMLAnchorElement): void {
    try {
      const url = new URL($caseloadAnchor.href)
      const backUrl = window.location.href
      if (backUrl.length > MAX_BACK_URL_LENGTH) {
        // Drop rather than leave behind a stale value set before the url grew
        url.searchParams.delete('backUrl')
      } else {
        url.searchParams.set('backUrl', backUrl)
      }
      $caseloadAnchor.href = url.href
    } catch {}
  }
}

class MenuItem {
  private closeTimer: number | null = null

  constructor(
    private readonly header: DPSHeader,
    readonly name: string,
    private readonly $item: HTMLDivElement,
    private readonly $button: HTMLAnchorElement,
    private readonly $menu: HTMLDivElement,
  ) {
    $item.classList.add('cdps-header__item--with-menu')

    $button.role = 'button'
    $button.ariaControlsElements = [$menu]
    $button.ariaExpanded = 'false'
    $button.href = '#'
    $button.addEventListener('click', event => {
      this.toggle(event)
    })
    if (name === 'user') {
      this.initClosingMenu()
    }
  }

  private initClosingMenu(): void {
    // close on blur
    const closeSoon = this.closeSoon.bind(this)
    const cancelCloseSoon = this.cancelCloseSoon.bind(this)
    this.$button.addEventListener('focus', cancelCloseSoon)
    this.$button.addEventListener('blur', closeSoon)
    this.$menu.querySelectorAll('a').forEach($link => {
      $link.addEventListener('focus', cancelCloseSoon)
      $link.addEventListener('blur', closeSoon)
    })

    // close on escape press
    this.$button.addEventListener('keydown', event => {
      this.closeOnEscape(event)
    })
    this.$menu.addEventListener('keydown', event => {
      this.closeOnEscape(event)
    })
  }

  get isOpen(): boolean {
    return this.$button.ariaExpanded === 'true'
  }

  toggle(event: PointerEvent | KeyboardEvent): void {
    event.preventDefault()
    this.header.closeMenus(this.name)
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  open(): void {
    this.$item.classList.add('cdps-header__item--with-open-menu')
    this.$button.ariaExpanded = 'true'
    this.$menu.ariaHidden = 'false'
    this.$menu.removeAttribute('hidden')
  }

  close(): void {
    this.$item.classList.remove('cdps-header__item--with-open-menu')
    this.$button.ariaExpanded = 'false'
    this.$menu.ariaHidden = 'true'
    this.$menu.setAttribute('hidden', 'hidden')
  }

  closeSoon(): void {
    this.closeTimer = setTimeout(() => {
      this.close()
    }, 100)
  }

  cancelCloseSoon(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer)
      this.closeTimer = null
    }
  }

  closeOnEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      this.close()
      this.$button.focus()
    }
  }
}

document.addEventListener('DOMContentLoaded', (): void => {
  DPSHeader.init()
})
