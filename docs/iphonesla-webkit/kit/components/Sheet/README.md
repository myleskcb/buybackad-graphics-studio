# Sheet

An iOS sheet for a task (checkout, building a lot, telling us about a phone), on a stage that shows the service's fade.

**You provide** `.wk-stage` with the service class, holding `.wk-sheet`: `.wk-grabber`, `.wk-nav` (three spans: the way out, the sheet's name, an optional action), one `h1.wk-large-title`, an optional `.wk-sub`, then grouped lists and one block button.

- Nav buttons take the service colour (`trade`, `wholesale`, else `accent`); the centre is `nav-title`.
- Write the large title the way a person talks: "Almost yours", "Your lot", "Tell us about it".
- On a phone the stage is the page; on a wider screen it is a panel with `radius-card` corners and the sheet stays 400px wide.
