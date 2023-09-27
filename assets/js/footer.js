document.addEventListener('DOMContentLoaded', hijackLink, false)
function hijackLink() {
  const feedbackLink = document.querySelector('.connect-dps-common-footer__link')

  if (feedbackLink) {
    feedbackLink.addEventListener('click', function (event) {
      event.preventDefault()
      alert('Feedback link clicked')
    })
  }
}
