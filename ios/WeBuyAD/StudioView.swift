import SwiftUI
import WebKit
import SafariServices

/// The studio's web view and its state. Adapted from the iPhones LA app's
/// CustomerView (iphoneslainv ios/), without its native sign-in and push: the
/// studio signs in with email in the page. What the app adds to the website:
/// a made ad or video goes to the iOS share sheet (Save Image or Save Video
/// puts it in Photos, or straight to Instagram, Messages, AirDrop), the
/// camera and photo library for the ad's pictures, iOS alerts for the page's
/// confirm and prompt, payments in Safari, and a screen that says when the
/// connection is gone.
@MainActor
final class StudioBrowser: ObservableObject {
    @Published var failure = false
    @Published var loading = true
    /// A page has been drawn. Until then the first launch shows a spinner on
    /// the app's own background, never a blank screen.
    @Published var hasPage = false
    @Published var progress = 0.0
    weak var webView: WKWebView?
    let initialURL = NavigationPolicy.start
    var failedURL: URL?

    /// The error screen stays up until the new page arrives (didCommit).
    func retry() {
        guard let webView else { return }
        loading = true
        if let target = failedURL,
           NavigationPolicy.destination(target, newWindow: false, tapped: false) == .webView {
            webView.load(URLRequest(url: target))
        } else if webView.url == nil || !hasPage {
            webView.load(URLRequest(url: initialURL))
        } else {
            webView.reload()
        }
    }
}

struct StudioView: View {
    @StateObject private var browser = StudioBrowser()

    var body: some View {
        ZStack {
            StudioWebView(browser: browser)
            if !browser.hasPage && !browser.failure {
                ProgressView()
                    .controlSize(.large)
                    .accessibilityLabel("Loading WeBuy.AD")
            }
            if browser.failure {
                ContentUnavailableView {
                    Label("Could not connect", systemImage: "wifi.exclamationmark")
                } description: {
                    Text("Check your connection, then try again. The ad you were making is kept on this iPhone.")
                } actions: {
                    if browser.loading {
                        ProgressView().accessibilityLabel("Trying again")
                    } else {
                        Button("Try again") { browser.retry() }.buttonStyle(.borderedProminent)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color("LaunchBackground"))
            }
        }
        // Drawn over the page, so a load never pushes the studio down.
        .overlay(alignment: .top) {
            if browser.loading && browser.hasPage && !browser.failure {
                ProgressView(value: browser.progress)
                    .progressViewStyle(.linear)
                    .tint(Color(red: 0.239, green: 0.545, blue: 1.0))
                    .accessibilityLabel("Loading")
            }
        }
        // The site's own ground (#070d1c dark, #f2f4f8 light) under the
        // status bar and the home bar, so the app never flashes white.
        .background(Color("LaunchBackground").ignoresSafeArea())
    }
}

struct StudioWebView: UIViewRepresentable {
    @ObservedObject var browser: StudioBrowser

    func makeCoordinator() -> Coordinator { Coordinator(browser) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        // The studio opens some pages in a new tab after a network wait; they
        // come to createWebViewWith (a Safari sheet) instead of being dropped.
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        // The page reads this to know it is in the app (app.js IN_IOS_APP):
        // checkout and billing then open in Safari.
        configuration.applicationNameForUserAgent = "Mobile/15E148 WeBuyADApp/1.0"
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.allowsBackForwardNavigationGestures = true
        view.allowsLinkPreview = false
        view.isOpaque = false
        view.backgroundColor = .clear
        view.scrollView.backgroundColor = .clear
        #if DEBUG
        if #available(iOS 16.4, *) { view.isInspectable = true }
        #endif
        browser.webView = view
        context.coordinator.observe(view)
        view.load(URLRequest(url: browser.initialURL))
        return view
    }

    func updateUIView(_ view: WKWebView, context: Context) {}

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
        let browser: StudioBrowser
        private var observations: [NSKeyValueObservation] = []
        /// Where each download is being written, until it is handed to the share sheet.
        private var downloads: [ObjectIdentifier: URL] = [:]

        init(_ browser: StudioBrowser) {
            self.browser = browser
            super.init()
        }

        func topController() -> UIViewController? {
            var top = browser.webView?.window?.rootViewController
            while let next = top?.presentedViewController, !next.isBeingDismissed { top = next }
            return top
        }

        func observe(_ view: WKWebView) {
            observations = [
                view.observe(\.estimatedProgress, options: [.new]) { [weak self] view, _ in
                    let value = view.estimatedProgress
                    Task { @MainActor in self?.browser.progress = value }
                },
            ]
        }

        // MARK: loading and its failures

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            browser.loading = true
        }

        func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
            browser.failure = false; browser.failedURL = nil; browser.hasPage = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            browser.loading = false; browser.failure = false; browser.failedURL = nil; browser.hasPage = true
            #if DEBUG
            // A test's script, run once on the first page (WEBUY_TEST_JS). Debug builds only.
            if !ranTestScript, let js = ProcessInfo.processInfo.environment["WEBUY_TEST_JS"] {
                ranTestScript = true
                webView.evaluateJavaScript(js) { _, error in if let error { print("WEBUY_TEST_JS:", error) } }
            }
            #endif
        }
        #if DEBUG
        private var ranTestScript = false
        #endif

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            let error = error as NSError
            // A navigation this app cancelled (a link opened elsewhere: WebKit's
            // 102), one a newer load replaced, or a download is not a lost connection.
            let cancelled = (error.domain == NSURLErrorDomain && error.code == NSURLErrorCancelled) ||
                (error.domain == "WebKitErrorDomain" && [102, 204].contains(error.code))
            browser.loading = webView.isLoading
            guard !cancelled || (!browser.hasPage && !webView.isLoading) else { return }
            browser.loading = false
            browser.failedURL = error.userInfo[NSURLErrorFailingURLErrorKey] as? URL
            browser.failure = true
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            self.webView(webView, didFailProvisionalNavigation: navigation, withError: error)
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            // Never silently replay a payment: say so and let Try again reload.
            browser.failure = true; browser.loading = false; browser.failedURL = nil
        }

        // MARK: where links go

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            // A made ad or video (<a download> on a blob or data URL).
            if action.shouldPerformDownload { decisionHandler(.download); return }
            if action.targetFrame?.isMainFrame == false {
                decisionHandler(url.scheme == "https" || url.scheme == "about" || url.scheme == "blob" ? .allow : .cancel)
                return
            }
            if action.targetFrame == nil { decisionHandler(.allow); return }   // createWebViewWith decides
            let destination = NavigationPolicy.destination(url, newWindow: false,
                                                           tapped: action.navigationType == .linkActivated)
            if destination == .webView {
                decisionHandler(.allow)
            } else {
                decisionHandler(.cancel)
                open(url, as: destination)
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse,
                     decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
            // A file the web view cannot show (a ZIP of ads) is a download too.
            if !response.canShowMIMEType { decisionHandler(.download); return }
            if let http = response.response as? HTTPURLResponse,
               let disposition = http.value(forHTTPHeaderField: "Content-Disposition"),
               disposition.lowercased().hasPrefix("attachment") {
                decisionHandler(.download); return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            // target=_blank and window.open never make a second web view.
            if let url = action.request.url {
                let destination = NavigationPolicy.destination(url, newWindow: true, tapped: true)
                if destination == .webView { webView.load(action.request) } else { open(url, as: destination) }
            }
            return nil
        }

        private func open(_ url: URL, as destination: NavigationPolicy.Destination) {
            switch destination {
            case .sheet:
                guard let top = topController(), url.scheme == "https" else { return }
                let safari = SFSafariViewController(url: url)
                safari.dismissButtonStyle = .close
                top.present(safari, animated: true)
            case .safari, .system:
                UIApplication.shared.open(url)
            case .webView:
                browser.webView?.load(URLRequest(url: url))
            case .blocked:
                break
            }
        }

        // MARK: downloads: a made ad goes to the share sheet

        func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
            download.delegate = self
        }

        func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
            download.delegate = self
        }

        func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                      suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
            let folder = FileManager.default.temporaryDirectory.appendingPathComponent("ads", isDirectory: true)
            try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            var name = (suggestedFilename as NSString).lastPathComponent
            if name.isEmpty || name == "Unknown" { name = "webuy-ad.png" }
            let file = folder.appendingPathComponent(name)
            try? FileManager.default.removeItem(at: file)
            downloads[ObjectIdentifier(download)] = file
            completionHandler(file)
        }

        func downloadDidFinish(_ download: WKDownload) {
            guard let file = downloads.removeValue(forKey: ObjectIdentifier(download)) else { return }
            share(file)
        }

        func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
            downloads.removeValue(forKey: ObjectIdentifier(download))
            let alert = UIAlertController(title: "The download did not finish",
                                          message: "Try the download again.", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            topController()?.present(alert, animated: true)
        }

        /// Save Image or Save Video puts it in Photos; Instagram, Messages,
        /// Mail and AirDrop take it from here too.
        private func share(_ file: URL) {
            guard let top = topController() else { return }
            let sheet = UIActivityViewController(activityItems: [file], applicationActivities: nil)
            if let view = browser.webView {
                sheet.popoverPresentationController?.sourceView = view
                sheet.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
            }
            top.present(sheet, animated: true)
        }

        // MARK: alert(), confirm() and prompt()

        private func dialogTitle(_ frame: WKFrameInfo) -> String? {
            let origin = frame.securityOrigin
            return origin.protocol == "https" && (origin.host == "webuy.ad" || origin.host == "www.webuy.ad") ? nil : origin.host
        }

        /// WebKit requires every completion handler to be called exactly once.
        private func show(_ alert: UIAlertController, otherwise answer: () -> Void) {
            guard let top = topController(), top.viewIfLoaded?.window != nil else { answer(); return }
            top.present(alert, animated: true)
        }

        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let alert = UIAlertController(title: dialogTitle(frame), message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
            show(alert) { completionHandler() }
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let alert = UIAlertController(title: dialogTitle(frame), message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
            show(alert) { completionHandler(false) }
        }

        func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String,
                     defaultText: String?, initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping (String?) -> Void) {
            let alert = UIAlertController(title: dialogTitle(frame), message: prompt, preferredStyle: .alert)
            alert.addTextField { $0.text = defaultText }
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(nil) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak alert] _ in
                completionHandler(alert?.textFields?.first?.text ?? "")
            })
            show(alert) { completionHandler(nil) }
        }

        func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                     decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            // iOS asks once for the camera (NSCameraUsageDescription); WebKit
            // must not ask a second time on top of it for our own page.
            let ours = origin.protocol == "https" && origin.host == "webuy.ad" &&
                (origin.port == 0 || origin.port == 443) && frame.isMainFrame
            decisionHandler(ours ? .grant : .deny)
        }
    }
}
