import { useEffect } from 'react'

// Google Analytics Measurement ID - replace with your actual GA4 ID
const GA_MEASUREMENT_ID = 'GTM-K6NQ5S24'

export default function GoogleAnalytics() {
  useEffect(() => {
    // Load Google Analytics script
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(script1)

    // Initialize gtag
    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      // Set default consent to 'denied' until user accepts
      gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });

      gtag('config', '${GA_MEASUREMENT_ID}');
    `
    document.head.appendChild(script2)

    // Cleanup function
    return () => {
      // Remove scripts if component unmounts (though unlikely)
      const scripts = document.querySelectorAll(`script[src*="googletagmanager"]`)
      scripts.forEach(script => script.remove())
    }
  }, [])

  return null
}