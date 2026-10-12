# GroupedList

iOS grouped rows: a section header, then a rounded group of rows on `cell`, separated by inset hairlines.

**You provide** `p.wk-section` (uppercase, `label-2`) then `.wk-group` holding `.wk-row` elements:
- a device row: `.wk-thumb` with the photo, `.wk-row__t` (`b` name, a spec line, a line with a `.wk-grade` and battery or count), and `.wk-row__v` with the amount;
- `.wk-row--two` for label and value, `.wk-row--total` for the last line of a summary;
- `.wk-row--add` for an action in the service colour, `.wk-row--nav` (a link) with `.wk-chev`;
- `.wk-foot` under a group for a short note.

**Buying and selling are always named.** A device the customer gets goes under "You're buying" with `.wk-dot--buy`; one they give goes under "You're selling" with `.wk-dot--sell`, and its amount is `wk-row__v--credit` with a minus sign. The dot never stands alone: the words carry the meaning.

Specs read storage · colour · carrier, then grade and battery: "256 GB · Cosmic Orange · Unlocked", "Grade A · Battery 100%".
