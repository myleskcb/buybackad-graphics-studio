import SwiftUI

/// WeBuy.AD for iPhone: the studio at https://webuy.ad in a native shell
/// (StudioView), the way the iPhones LA app wraps its own web app.
@main
struct WeBuyADApp: App {
    var body: some Scene {
        WindowGroup {
            StudioView()
        }
    }
}
