import Foundation

/// Where each link goes. The studio (every page on webuy.ad) stays in the web
/// view; our pages a customer reads and comes back from open in a Safari sheet
/// over the app; paying for a plan or credits and managing the subscription
/// open in the Safari app, because Apple lets a US app send customers to pay on
/// the web (guideline 3.1.1(a), 2025) but not take a subscription's card inside
/// the app; Phone, Messages, Mail, Maps and the App Store open their own apps.
enum NavigationPolicy {
    static let origin = URL(string: "https://webuy.ad")!

    enum Destination: Equatable { case webView, sheet, safari, system, blocked }

    /// A Debug build can start on a local copy of the site instead
    /// (WEBUY_START_URL, e.g. http://127.0.0.1:8898/?demo=1), trusted like
    /// webuy.ad. A Release build has no such door.
    static let start: URL = {
        #if DEBUG
        if let s = ProcessInfo.processInfo.environment["WEBUY_START_URL"], let u = URL(string: s) { return u }
        #endif
        return origin
    }()

    static func trusted(_ url: URL?) -> Bool {
        #if DEBUG
        if start != origin, let url, url.host == start.host, url.port == start.port, url.scheme == start.scheme { return true }
        #endif
        guard let url, url.scheme == "https", let host = url.host?.lowercased() else { return false }
        return (host == "webuy.ad" || host == "www.webuy.ad") &&
            (url.port == nil || url.port == 443) && url.user == nil && url.password == nil
    }

    /// A page of ours to read and come back from, opened over the studio
    /// instead of replacing the ad being made.
    static func document(_ url: URL?) -> Bool {
        guard trusted(url), let path = url?.path else { return false }
        return ["/terms.html", "/privacy.html", "/about.html", "/learn.html"].contains(path) ||
            path.hasPrefix("/ads/")
    }

    /// Stripe's checkout and billing pages: paid in Safari, never in the app.
    static func payment(_ url: URL?) -> Bool {
        guard let url, url.scheme == "https", let host = url.host?.lowercased() else { return false }
        return host == "checkout.stripe.com" || host == "billing.stripe.com"
    }

    /// Hosts iOS opens in their own app.
    static func opensInSystemApp(_ url: URL?) -> Bool {
        guard let url, url.scheme == "https", let host = url.host?.lowercased() else { return false }
        return ["maps.apple.com", "apps.apple.com", "itunes.apple.com"].contains(host)
    }

    /// `newWindow` is target=_blank or window.open; `tapped` is a link the
    /// customer activated in the main frame.
    static func destination(_ url: URL?, newWindow: Bool, tapped: Bool) -> Destination {
        guard let url else { return .blocked }
        if trusted(url) {
            if newWindow || (tapped && document(url)) { return .sheet }
            return .webView
        }
        switch url.scheme?.lowercased() {
        case "tel", "mailto", "sms":
            return .system
        case "https":
            if payment(url) { return .safari }
            if opensInSystemApp(url) { return .system }
            return .sheet
        case "about", "blob", "data":
            // The page's own frames and downloads (a made ad is a blob or a
            // data URL; StudioView hands it to the share sheet).
            return newWindow ? .blocked : .webView
        default:
            return .blocked
        }
    }
}
