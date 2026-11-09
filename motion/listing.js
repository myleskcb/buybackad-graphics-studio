// THE LISTING: a title and a description for the ad on screen.
//
// The owner, 2026-11-09: "include our iPhones LA esque Title and description
// generator to complete a full ad", "with a quick ad generator function that
// makes a photo or video with the title and description corresponding",
// "relevant to the photo image and the elements in image", and "maximize
// title and description keywords and length".
//
// iPhones LA's listings site writes its WE BUY titles and descriptions in
// app/buy_ad_copy.py (myleskcb/iphoneslainv-1): angles x tones of whole,
// plain sentences, filled with the models, the area and what to message, and
// held to checks before an ad can be approved. This is that maker, ported:
//   - ANGLES and TONES are its patterns, word for word, but for "an OfferUp
//     message" made "a message" (a listing here may go on Marketplace or
//     Craigslist too); `wholesale` is new, in the same voice, from the shop's
//     own rules (a lot quoted as one, IMEIs verified when we meet).
//   - lint() and legitimacy() are its checks: what blocks approval there
//     blocks here, and the same spam signals cost the same points.
//   - The ad decides the words: the phones on the picture (their models and
//     finishes), the lines printed on it, the audience it was made for, its
//     area and its language. readAd() says what it read, so the page can show it.
//   - "Maximize keywords and length": every title the patterns can make, with
//     every tail that fits, is checked and scored on the distinct search words
//     it carries and its length, up to 80 characters with the model in the
//     first 60 (the feed's cut). A description grows, paragraph by paragraph,
//     with the models' storage sizes and colours, the conditions, the carrier,
//     how to get ready and, for a Spanish ad, a paragraph in Spanish, for as
//     long as it stays under 2,900 characters and passes every check. The
//     checks are the limit: a word said eight times, a list of search phrases
//     or six models in a row reads as spam, and is left out.
//
// The listing always says the post is buying. The phones in the picture are
// the models wanted, and the description says so: a buy ad dressed as a phone
// for sale is the one thing the iPhones LA checks score hardest (bait_title).

export const TITLE_MAX = 80;
export const TITLE_FEED = 60;
export const BODY_MAX = 3000;
const BODY_AIM = 2900;

// What Apple shipped, from iPhones LA's lineup (device-lineup/iphones.json,
// 2026-11-09), under the names the video maker's phones carry.
export const LINEUP = {
  "iPhone 18 Pro Max": ["256GB", "512GB", "1TB", "2TB"], "iPhone 18 Pro": ["256GB", "512GB", "1TB", "2TB"],
  "iPhone 17 Pro Max": ["256GB", "512GB", "1TB", "2TB"], "iPhone 17 Pro": ["256GB", "512GB", "1TB"],
  "iPhone Air": ["256GB", "512GB", "1TB"], "iPhone 17": ["256GB", "512GB"], "iPhone 17e": ["256GB", "512GB"],
  "iPhone 16 Pro Max": ["256GB", "512GB", "1TB"], "iPhone 16 Pro": ["128GB", "256GB", "512GB", "1TB"],
  "iPhone 16 Plus": ["128GB", "256GB", "512GB"], "iPhone 16": ["128GB", "256GB", "512GB"], "iPhone 16e": ["128GB", "256GB", "512GB"],
  "iPhone 15 Pro Max": ["256GB", "512GB", "1TB"], "iPhone 15 Pro": ["128GB", "256GB", "512GB", "1TB"],
  "iPhone 15 Plus": ["128GB", "256GB", "512GB"], "iPhone 15": ["128GB", "256GB", "512GB"],
  "iPhone 14 Pro Max": ["128GB", "256GB", "512GB", "1TB"], "iPhone 14 Pro": ["128GB", "256GB", "512GB", "1TB"],
  "iPhone 14 Plus": ["128GB", "256GB", "512GB"], "iPhone 14": ["128GB", "256GB", "512GB"],
  "iPhone 13 Pro Max": ["128GB", "256GB", "512GB", "1TB"], "iPhone 13 Pro": ["128GB", "256GB", "512GB", "1TB"],
  "iPhone 13": ["128GB", "256GB", "512GB"], "iPhone 13 mini": ["128GB", "256GB", "512GB"],
  "iPhone 12 Pro Max": ["128GB", "256GB", "512GB"], "iPhone 12 Pro": ["128GB", "256GB", "512GB"],
  "iPhone 12": ["64GB", "128GB", "256GB"], "iPhone 12 mini": ["64GB", "128GB", "256GB"],
  "iPhone 11 Pro Max": ["64GB", "256GB", "512GB"], "iPhone 11 Pro": ["64GB", "256GB", "512GB"], "iPhone 11": ["64GB", "128GB", "256GB"],
};

// The iPhone family, as buy_ad_copy.FAMILIES has it (the video maker draws iPhones).
const FAMILY = {
  label: "iPhone", plural: "iPhones", device_word: "phone",
  details: "the model, storage, carrier (or unlocked) and condition",
  extra: "Carrier, or unlocked", where_to_find: "Settings > General > About",
};

export const TONES = {
  plain: { label: "Straightforward", note: "The original voice; the default." },
  professional: { label: "Professional", note: "Explain the quote and inspection in order." },
  urgent: { label: "Same day", note: "Ask about today's availability; never promise a deadline." },
  friendly: { label: "Friendly", note: "Help a seller describe what they have." },
};

// ---------------------------------------------------------------------------
// The angles. {models} {lead} {a_lead} {family} {family_plural} {device_word}
// {area} {details} {details_cap} {extra} {where_to_find}
// `tails` lengthen a title; `more` are the paragraphs a description can grow by.
// ---------------------------------------------------------------------------
export const ANGLES = {
  general: {
    label: "We buy these",
    tones: {
      plain: {
        titles: ["We buy {models}", "Sell us your {lead}", "We buy {models} in {area}"],
        bodies: [
          "We buy {models} in person around {area}.\n\nSend us a message with {details}, and we'll reply with an offer. If it works for you, we meet at our shop or a public spot nearby, look the {device_word} over together, and pay you right there.\n\nScratches, a cracked screen or a tired battery are fine. It just needs to be signed out of your Apple account and not reported lost or stolen. The price on this post is about what we pay for a clean one; we'll quote yours from what you tell us.",
          "Have {a_lead} you're not using? We're a local Apple resale shop and we buy them outright, so there's no store credit, no shipping and no waiting on a check.\n\nMessage us:\n• The model and storage ({where_to_find})\n• {extra}\n• Any cracks, dents or battery messages\n\nWe'll send an offer, and if you like it we can meet around {area} the same day or the next. The price on this post is about what we pay for a clean one; yours depends on its condition. Hablamos español.",
          "Thinking about selling your {lead}? Here's how it works with us.\n\nWhat do you buy? {models}, new or used.\nHow do I get a price? Message us {details} and we'll reply with an offer.\nWhere do we meet? Around {area}, at our shop or a public spot, usually the same day.\nHow do I get paid? On the spot, once we've looked the {device_word} over together.\n\nIt needs to be signed out of your Apple account and not reported lost or stolen. The price on this post is about what we pay for a clean one.",
          "Hi, we're a small {area} shop that buys used Apple devices. If your {lead} is sitting in a drawer, we'd like to make you an offer for it.\n\nSend us {details}. We'll get back to you with a number, and if it works we meet nearby and you're paid right there.\n\nIt has to be signed out of your Apple account and not reported lost or stolen. The price on this post is about what we pay for a clean one; yours depends on its condition.",
        ],
      },
      professional: {
        titles: ["Buyback assessment for {lead}", "Sell your {lead} through our shop"],
        bodies: [
          "Offer request for {models}.\n\nPlease include {details} in your message. We use that description to quote the device before arranging an inspection in {area}. Payment follows the check together. The price on this post describes a clean example, not an individual valuation. Only devices released from their owner's Apple account and not reported lost or stolen can be purchased.",
          "Selling to our resale shop starts with information, not a visit. Describe your {lead}, including {details}. We reply with a number for you to consider.\n\nAn agreed meeting lets both of us check its condition before payment. Sign out of Apple before bringing it; lost or stolen devices are excluded. For reference, the price on this post is for a clean unit. Location: {area}.",
        ],
      },
      urgent: {
        titles: ["Same-day buyback enquiry for {lead}", "Sell your {lead} today if ready"],
        bodies: [
          "Ready to sell your {lead} today? Ask us what meeting times are available around {area}. Include {details} so we can discuss the offer first.\n\nBefore heading over, agree the time with us and sign out of your Apple account. We check the device and pay at the meeting; nothing needs shipping. The price on this post is a clean-device example. We cannot take anything reported lost or stolen.",
          "Today's checklist for selling {models}:\nSend the specifications and any damage in a message.\nWait for our quote and confirmation of a time.\nBack up your data and remove your Apple account before the visit.\n\nWe meet locally in {area}; availability decides whether today works. The price on this post assumes clean condition, and the actual offer depends on your device. Reported lost or stolen items are not accepted.",
        ],
      },
      friendly: {
        titles: ["Done with your {lead}? We buy it", "Sell your spare {lead} when ready"],
        bodies: [
          "Not sure what your {lead} is worth? Start by telling us about it. {details_cap} gives us somewhere to start, and a few words on any wear help too.\n\nWe're here in {area}. If you like the offer, we'll arrange to look it over with you and pay there. The price on this post gives an idea for a clean one. Please sign out of Apple first; it can't be reported lost or stolen.",
          "Found {a_lead} you no longer use? You don't need to know every specification to start a conversation. {where_to_find} can help identify it; send what you find and ask if you're stuck.\n\nA message lets us work out an offer before you travel to meet in {area}. Your condition matters more than the price on this post, which illustrates a clean device. You'll need to remove your Apple account. We don't purchase lost or stolen goods.",
        ],
      },
    },
    tails: [" in {area}", ", new or used", " - local buyer", " - paid on the spot"],
  },
  damaged: {
    label: "Cracked or damaged",
    tones: {
      plain: {
        titles: ["We buy {lead} with a cracked screen", "Cracked {lead}? We buy it", "We buy damaged {models}"],
        bodies: [
          "Dropped your {lead}? We buy them with cracked screens, cracked backs and worn-out batteries.\n\nTell us what's damaged and whether it still turns on. We'll give you an honest offer for it as it is, so you don't need to fix anything first.\n\nWe meet around {area} and pay on the spot once we've checked it. It has to be signed out of your Apple account and not reported lost or stolen. The price on this post is about what we pay for one with a cracked screen; yours is quoted from what you tell us.",
          "A cracked {lead} still has value. We buy them with broken screens, cracked backs, worn-out batteries and missing buttons.\n\nMessage us {details} and tell us what's wrong with it. The more you tell us, the fairer the number and the fewer surprises when we meet.\n\nWe meet around {area} and pay you on the spot. The {device_word} must be signed out of your Apple account and not reported lost or stolen. The price on this post is about what we pay for one with a cracked screen.",
        ],
      },
      professional: {
        titles: ["Damaged {lead} buyback assessment", "Sell your cracked {lead} for inspection"],
        bodies: [
          "Condition report for {models}: please describe the fault, whether it powers on, and any visible damage. Include {details}.\n\nOur assessment concerns the device as it is; repairs are not required before quoting. We arrange inspection and payment in {area} if you accept. The price on this post represents a cracked-screen unit. Apple sign-out is required, and reported lost or stolen items are excluded.",
          "A broken screen is different from a device that will not start. When requesting an offer on your {lead}, explain what still works as well as what does not.\n\nThe specifications and a clear description help us quote the right condition. An in-person check precedes payment at the agreed {area} meeting. The price on this post is an example with cracked glass. Remove the owner's Apple account before sale; no lost or stolen devices.",
        ],
      },
      urgent: {
        titles: ["Cracked {lead} buyback today", "Sell your damaged {lead} this afternoon"],
        bodies: [
          "Cracked your {lead} and looking to sell today? Describe the damage before setting off. Tell us {details}, then ask which times we can meet in {area}.\n\nDon't book a repair just for our quote: we can assess it as described. The price on this post is for one with a cracked screen, not a clean example. It must be signed out of Apple and must not be reported lost or stolen.",
          "Before this afternoon's plans, message us about your broken {lead}. What happened, does it turn on, and what does the screen show? Those answers let us discuss an offer without guessing.\n\nA same-day meeting depends on availability, so confirm with us first. We pay after checking it together locally. The price on this post reflects cracked-screen condition. You'll need Apple sign-out; reported lost or stolen devices cannot be bought.",
        ],
      },
      friendly: {
        titles: ["Dropped your {lead}? We buy it", "Sell your worn {lead} as it is"],
        bodies: [
          "A tumble doesn't have to mean your {lead} sits in a drawer forever. Tell us what happened and where it's cracked. We buy damaged devices, so describe yours as it really is.\n\nIf our offer works for you, we can meet around {area} and take a look together. You don't have to fix it first. The price on this post is a cracked-screen example. Sign out of your Apple account; nothing reported lost or stolen, please.",
          "Scratches are easy to describe; an occasional fault can be harder to explain. For your {lead}, just tell us what you notice when using it, along with {details}.\n\nWe'll work from that to make an offer and arrange a nearby meeting if you want to sell. The price on this post is based on cracked glass, so other damage may change the number. Apple account removal is needed before handover. Lost or stolen items aren't eligible.",
        ],
      },
    },
    tails: [" in {area}", " as is", " - local buyer", ", cracked screen or back"],
  },
  upgrade: {
    label: "Upgrading",
    tones: {
      plain: {
        titles: ["Upgrading? We buy your {lead}", "Sell your old {lead} before you upgrade"],
        bodies: [
          "Getting a new {family}? Sell us your old {lead} first.\n\nMessage us {details}. We reply with an offer, and if you're happy with it we meet around {area} and pay you there.\n\nBefore we meet: back it up, sign out of your Apple account and erase it. We're happy to walk you through it. The price on this post is about what we pay for a clean one.",
          "Getting a new {family}? Your old {lead} can pay for part of it.\n\nBefore we meet, back it up, sign out of your Apple account and erase it. If you get stuck on any of that, message us and we'll walk you through it.\n\nSend us {details} for an offer. We meet around {area} and you're paid on the spot. The price on this post is about what we pay for a clean one.",
        ],
      },
      professional: {
        titles: ["Replacement-device buyback for {lead}", "Sell your previous {lead} after setup"],
        bodies: [
          "Plan the sale of your {lead} around setting up its replacement. Keep your data backed up, then sign out and erase the old device before the meeting.\n\nFor a valuation, supply {details}. Once a quote and meeting are agreed, we inspect and pay in person in {area}. The price on this post uses a clean unit as the reference. The device must belong to you and cannot be reported lost or stolen.",
          "Moving to another {family}? Our purchase of the previous {lead} is separate from buying its replacement: you sell outright.\n\nSend the specifications and condition for a quote. Arrange the handover after transferring your files and removing your Apple account. At the meeting we check the old device with you before paying. The price on this post assumes clean condition; your quote reflects what you describe. No reported lost or stolen devices.",
        ],
      },
      urgent: {
        titles: ["Upgrade-day buyback for {lead}", "Sell your previous {lead} this week"],
        bodies: [
          "New {family} already set up? Your old {lead} could be ready for a sale today. Message {details} and ask about available times in {area}.\n\nCheck that your photos and files are backed up before erasing anything. Sign out of Apple too. We can discuss the number and a meeting once you're ready; timing is by agreement. The price on this post shows a clean example. We don't buy devices reported lost or stolen.",
          "If this is your upgrade week, contact us before packing your {lead} away. Tell us its condition and specifications now, then agree a visit after the replacement is working.\n\nNo need to erase it before saving your data. When you do sell, remove the Apple account and bring it for a check and payment. The price on this post is a guide for a clean one. Ask whether today's schedule has space. A lost or stolen report rules out purchase.",
        ],
      },
      friendly: {
        titles: ["New device arrived? Sell us your {lead}", "We buy your {lead} after you upgrade"],
        bodies: [
          "Enjoying your new {family}? When you've finished moving everything over, we'd like to hear about the old {lead}. Send {details} whenever you're ready.\n\nKeep a backup, sign out of Apple and erase it before handing it over. If the steps are confusing, ask us. We can arrange a {area} meeting after discussing an offer. The price on this post refers to a clean device, not every device. It must not be reported lost or stolen.",
          "The old {lead} often gets forgotten once its replacement arrives. Before putting it away, check the model and tell us how it's holding up. We can make an offer from those details.\n\nThere is time to get your own files safely moved before agreeing to meet. We buy outright and pay after looking it over together. The price on this post illustrates clean condition. Please remove your Apple account for the sale; we can't take lost or stolen items.",
        ],
      },
    },
    tails: [" in {area}", " - local buyer", ", new or used"],
  },
  local: {
    label: "Local shop",
    tones: {
      plain: {
        // the third is new: an ad without an area still needs a local title
        titles: ["Sell your {lead} to a local {area} shop", "We buy {family_plural} in {area}", "Sell your {lead} to a local shop"],
        bodies: [
          "We're a small {area} shop that buys and resells Apple devices, and we're looking for {family_plural}, especially {models}.\n\nHow it works:\n1. Message us {details}\n2. Get an offer back\n3. Meet nearby and get paid on the spot\n\nWorking or damaged is fine. It must be signed out of the owner's Apple account and not reported lost or stolen. The price on this post is about what we pay for a clean one.",
          "We're a local {area} shop, not a mail-in service, so there's no shipping and no waiting for a check. We buy {family_plural}, including {models}.\n\nMessage us {details}. We'll send an offer, meet you nearby, look it over together and pay you right there.\n\nIt must be signed out of the owner's Apple account and not reported lost or stolen. The price on this post is about what we pay for a clean one.",
        ],
      },
      professional: {
        titles: ["Neighbourhood buyback for {lead}", "Sell your {lead} by appointment"],
        bodies: [
          "Local sale of {models}, arranged by message. Please provide {details} before requesting a visit. A quote gives you a number to consider without travelling first.\n\nWe agree a meeting in {area}, inspect together and pay directly. The price on this post is based on a clean example; condition determines your individual offer. The seller needs to sign out of their Apple account. Devices reported lost or stolen are not eligible.",
          "An in-person purchase has three parts: description, agreement, inspection. For your {lead}, begin with the specifications and condition in a message.\n\nAfter considering our quote, choose an agreed meeting at the shop or a nearby public place. We check the item before payment. For comparison, the price on this post represents a clean unit. Apple accounts must be removed, and lost or stolen devices cannot be sold to us.",
        ],
      },
      urgent: {
        titles: ["Nearby {lead} buyback today", "Sell your {lead} during today's visit"],
        bodies: [
          "Already planning to be near {area} today? Ask about selling your {lead} while you're here. Send the model details and condition first so we can reply with an offer and discuss a time.\n\nPlease wait for confirmation before travelling. We pay at the local meeting after checking the device. The price on this post assumes a clean one. Sign out of Apple beforehand; we exclude anything reported lost or stolen.",
          "A local sale needn't involve packing a parcel. If you'd like to sell {models} today, message us your specifications and ask whether we can meet. Availability varies.\n\nWe agree the quote and the visit with you, then look over the device before paying. Keep your data backed up and remove the Apple account before handover. The price on this post is a clean-condition illustration, not a promise for every unit. Lost or stolen goods are excluded.",
        ],
      },
      friendly: {
        titles: ["Hi neighbour, sell us your {lead}", "Nearby shop: we buy your {lead}"],
        bodies: [
          "Hello from {area}. If selling your {lead} means meeting someone new, we can arrange to meet at our shop or a public spot nearby. Start here with a message about {details}.\n\nWe'll discuss an offer before either of us makes plans. At the meeting we look it over together and pay there. The price on this post gives a clean-device reference. Please remove your Apple account, and only offer devices not reported lost or stolen.",
          "Prefer talking about your {lead} before making a trip? That's what messages are for. Tell us the model and how you've used it; mention anything worth knowing about its condition.\n\nWe're a resale shop in {area}, and a local meeting lets us check it with you rather than asking you to ship it. The price on this post is for a clean example. Yours needs to be signed out of Apple and free of any lost or stolen report.",
        ],
      },
    },
    tails: [" - new or used", " - paid on the spot", ", meet nearby"],
  },
  // From iPhones LA's study of the resellers' WE BUY ads (2026-09-17): the
  // phrases sellers search ("iPhone buyer", "sell your iPhone", "same day"),
  // said the way a person says them.
  local_buyer: {
    label: "Local buyer",
    tones: {
      plain: {
        titles: ["Sell your {lead} to a local buyer", "We buy {lead} - same day, {area}"],
        bodies: [
          "Local {family} buyer in {area}. If you're ready to sell your {lead}, new or used, message us {details} and we'll send you an offer.\n\nWe meet nearby, usually the same day, check it over with you and you're paid on the spot. No shipping and no store credit.\n\nIt needs to be signed out of your Apple account and not reported lost or stolen. The price on this post is about what we pay for a clean one.",
          "Selling your {lead}? We're a local buyer in {area}.\n\n1. Message us {details}\n2. We reply with an offer\n3. Meet nearby the same day and get paid on the spot\n\nNew, used or cracked is fine. It needs to be signed out of your Apple account and not reported lost or stolen. The price on this post is about what we pay for a clean one.",
        ],
      },
      professional: {
        titles: ["Local {lead} buyback enquiry", "Sell your {lead} with an agreed time"],
        bodies: [
          "Availability enquiry: {models}, {area}. Send {details} and your preferred meeting time in a message. We respond with an offer and arrange the visit by agreement.\n\nThe purchase is completed after an inspection together, with payment at the meeting. The price on this post describes clean condition; a quote for your device may differ. Only owners able to remove their Apple account can sell. Reported lost or stolen devices are not purchased.",
          "To arrange a nearby sale of your {lead}, include both the device specifications and when you're available. We can then discuss its value and whether a same-day meeting suits.\n\nKeep the appointment confirmed in messages before setting off. Inspection takes place with you before payment. The price on this post uses a clean device for reference. Account sign-out is required before sale, and devices reported lost or stolen are excluded.",
        ],
      },
      urgent: {
        titles: ["Sell your {lead} at today's local meet", "Today nearby: we buy your {lead}"],
        bodies: [
          "Want to sell your {lead} without shipping it away? Send {details} and ask if there is a meeting available today around {area}.\n\nOur offer comes before your trip. After confirming a time, bring the device signed out of its Apple account; we look it over together and pay on the spot. The price on this post is a clean-unit guide, so damage changes the offer. Nothing reported lost or stolen can be accepted.",
          "This afternoon may work for a local {lead} sale: check with us first. A message describing condition and specifications gets the conversation started, and we agree a time if today's availability fits.\n\nAt handover we inspect and pay in person. Back up anything you need and disconnect the Apple account before selling. The price on this post reflects a clean example; your individual quote may differ. Devices with lost or stolen reports are excluded.",
        ],
      },
      friendly: {
        titles: ["Ready to part with your {lead}? We buy it", "Sell us your spare {lead} nearby"],
        bodies: [
          "Have a little time to talk about your {lead}? Tell us what you've got and when you could meet nearby. {details_cap} helps us come back with an offer.\n\nIf the number suits, we'll find an agreed time around {area}, check it with you and pay there. The price on this post is about a clean one; wear can change yours. You'll need to sign out of Apple before selling, and it must not be reported lost or stolen.",
          "Selling your {lead} locally starts with a conversation. You can ask about today's times while telling us the model, specifications and any problems. We don't need you to send it through the mail.\n\nOnce a time and offer suit, we meet, look it over and pay in person. The price on this post shows an example in clean condition. Please have your Apple account removed for the visit. We cannot buy items reported lost or stolen.",
        ],
      },
    },
    tails: [" in {area}", ", new or used", " - meet nearby", " - paid on the spot"],
  },
  // New here, in the same voice. iPhones LA's own rules for a lot: three or
  // more is wholesale, any amount (owner, 2026-08-20 and 2026-10-28), quoted
  // as one ("For the {units} phones ... we can pay"), IMEIs checked in person.
  wholesale: {
    label: "Wholesale buyer",
    tones: {
      plain: {
        titles: ["We buy {lead} in bulk - wholesale lots", "Wholesale buyer: sell your {lead} lot", "We buy {models} wholesale, by the lot", "Sell us your {family} lot - wholesale buyer"],
        bodies: [
          "We buy {family_plural} wholesale: a few at a time or a whole box, from resellers, repair shops, businesses refreshing their phones and anyone with a drawer full of them. Right now we're especially looking for {models}.\n\nMessage us a list with {details} for each one, or a photo of the lot. We'll quote the whole lot together, and if it works for you we meet around {area}, check each {device_word} with you and pay for the lot right there.\n\nMixed models and mixed condition are fine; just tell us which ones are cracked or show battery messages. Every {device_word} needs to be signed out of its Apple account and not reported lost or stolen, and we verify the IMEIs in person when we meet. The price on this post is about what we pay for one clean {lead}; a lot is quoted unit by unit.",
          "Wholesale lots of {family_plural}, bought outright by a local {area} shop. If you sell phones for a living, run a repair counter, or have a box of upgrades and returns to move, we'd like to quote it.\n\nHow it works:\n1. Message us the model, storage, carrier or unlocked, and condition of each, or a photo of the lot\n2. We send one offer for the whole lot\n3. Meet nearby, check them over together, and get paid for the lot on the spot\n\nWe're looking for {models} in particular, new, used or cracked. Each {device_word} must be signed out of its Apple account and not reported lost or stolen; we verify IMEIs when we meet. The price on this post is about what we pay for a single clean {lead}.",
        ],
      },
      professional: {
        titles: ["Wholesale buyback for {lead} lots", "Sell your {lead} inventory by the lot"],
        bodies: [
          "Bulk purchase of {models}, quoted as one lot. Please send a list giving {details} for each unit, or a photo of the devices with their About screens.\n\nWe reply with a single offer for the lot and arrange an inspection in {area}. Each unit is checked and its IMEI verified in person before payment for the whole lot. The price on this post describes one clean unit, not a lot valuation. Every device must be released from its owner's Apple account and not reported lost or stolen.",
        ],
      },
      urgent: {
        titles: ["Moving a {lead} lot today? We buy it", "Sell your {lead} lot this week"],
        bodies: [
          "Need to move a lot of {family_plural} this week? Send the list now, with {details} for each, and ask which meeting times are available around {area}.\n\nWe quote the lot before you travel, then check every unit with you and pay for it at the meeting; timing is by agreement. The price on this post is one clean unit, so damage and mixed models change the lot offer. Each device must be signed out of its Apple account and not reported lost or stolen.",
        ],
      },
      friendly: {
        titles: ["A box of {family_plural}? We buy the lot", "Sell us the whole {family} lot"],
        bodies: [
          "Got a box of {family_plural} you'd rather sell in one go? We buy them as a lot, mixed models and mixed condition welcome, {models} especially.\n\nA quick list is plenty: the model and storage of each ({where_to_find}), carrier or unlocked, and anything cracked. We'll come back with one number for the lot, meet you around {area}, check them over together and pay right there. The price on this post is about one clean {lead}. Each needs to be signed out of its Apple account and not reported lost or stolen.",
        ],
      },
    },
    tails: [" in {area}", " - mixed lots welcome", ", new or used", " - one offer per lot"],
  },
};

// The paragraphs a description grows by, for every angle or one. Each is a
// fact about how the buying works or about the phones on the picture, never a
// claim (no "best", no "top", no "cash"), and never a list of search phrases.
const MORE = {
  conditions: { not: ["damaged", "wholesale"], en: "New, used, cracked screen, cracked back, scratches, a worn battery or a battery service message: tell us what you've got as plainly as you can, and the offer will be close to what we pay when we meet." },
  damaged: { only: ["damaged"], en: "Cracked screens, cracked backs, dead pixels, Face ID that stopped working, a battery service message, a bent frame or a {device_word} that won't charge: tell us what it does and doesn't do, and we'll quote it as it is." },
  lots: { only: ["wholesale"], en: "A lot can be mixed: different models, storage sizes, colours and conditions in one batch. A simple list works (model, storage, carrier or unlocked, condition, and any cracks or battery messages), or a photo of the phones with their About screens open. We quote each one and give you a single number for the lot." },
  carrier: { en: "Tell us if it's unlocked or which carrier it's on (AT&T, Verizon, T-Mobile or another); we'll go over that in the chat." },
  find: { en: "Not sure which model you have? It's in {where_to_find}, along with the storage." },
  where: { en: "We're based in {area} and meet at our shop or a public spot nearby, by agreement." },
  local: { not: ["local", "local_buyer"], en: "We're local, so there's no shipping and no mail-in kit: we meet at our shop or a public spot around {area}, look it over together and you're paid right there." },
  prep: { not: ["upgrade"], en: "Before we meet: back up your photos, turn off Find My, sign out of your Apple account and erase it (Settings > General > Transfer or Reset). If any of that is new to you, message us and we'll walk you through it." },
  meet: { en: "At the meet we power it on and check the screen, cameras, buttons, Face ID and battery health with you, and confirm it's signed out. Then you're paid, and that's it." },
  box: { not: ["damaged"], en: "Still have the box, the charger or a case? Bring them along, and tell us if it's sealed or open box." },
  other: { en: "Have a different model from the ones pictured? Message us anyway and ask; tell us what you have and we'll let you know." },
};

// ---------------------------------------------------------------------------
// Filling a pattern (buy_ad_copy.fill, join_models)
// ---------------------------------------------------------------------------
/** "iPhone 17 Pro Max and 16 Pro": the family word once. */
export function joinModels(models, and = "and") {
  const names = models.filter(Boolean);
  if (!names.length) return "";
  const head = names[0];
  // "17 Pro Max" after an iPhone reads as one; a bare "16" does not, so it keeps its family word
  const items = [head, ...names.slice(1).map(n => head.startsWith("iPhone ") && /^iPhone \d+e? \S/.test(n) ? n.slice(7) : n)];
  return items.length === 1 ? items[0] : items.slice(0, -1).join(", ") + ` ${and} ` + items[items.length - 1];
}

function values(ctx, models) {
  const lead = models[0] || FAMILY.label;
  return {
    models: joinModels(models) || FAMILY.plural, lead, a_lead: (/^[aeiouAEIOU]|^i[A-Z]/.test(lead) ? "an " : "a ") + lead,
    family: FAMILY.label, family_plural: FAMILY.plural, device_word: FAMILY.device_word, area: ctx.area || "your area",
    details: FAMILY.details, details_cap: FAMILY.details[0].toUpperCase() + FAMILY.details.slice(1),
    extra: FAMILY.extra, where_to_find: FAMILY.where_to_find,
  };
}
export function fill(pattern, ctx, models = ctx.models, trim = true) {
  const v = values(ctx, models);
  const out = String(pattern).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : "")).replace(/[ \t]{2,}/g, " ");
  return trim ? out.trim() : out;
}

// ---------------------------------------------------------------------------
// Reading the ad: what is on the picture decides the words
// ---------------------------------------------------------------------------
const NEWEST = m => { const n = /iPhone (\d+)/.exec(m); return n ? Number(n[1]) * 10 + (/Pro Max/.test(m) ? 3 : / Pro/.test(m) ? 2 : /Plus|Air/.test(m) ? 1 : 0) : -1; };
const AUDIENCE_ANGLE = { wholesale: "wholesale", business_bulk: "wholesale", local_buyer: "local_buyer", locals: "local",
  broken_phones: "damaged", upgraders: "upgrade", holiday: "upgrade" };
const WORD_ANGLES = [
  ["wholesale", /WHOLESALE|\bBULK\b|\bLOTS?\b|MAYOREO|\bLOTE\b|BOX OF|RESELLER/i],
  ["damaged", /CRACK|BROKEN|DAMAGED|DROPPED|\bROT[AO]S?\b|DEAD BATTERY/i],
  ["local_buyer", /LOCAL (?:IPHONE )?BUYERS?|IPHONE BUYERS?|BUYER NEARBY|COMPRADOR(?:ES)? LOCAL|MEET NEARBY|NOS VEMOS/i],
  ["upgrade", /UPGRAD|NEW IPHONE|NEW PHONE|CAMBIASTE/i],
  ["local", /NEIGHBOU?R|FROM HERE|\bLOCALS?\b|VECINO|DE AQU[ÍI]/i],
];
export const ANGLE_KEYS = Object.keys(ANGLES);
/** The audience the quick ad uses for an angle (audiences.js), so the look, the
 *  words on the picture and the voice all say the same thing as the listing. */
export const ANGLE_AUDIENCE = { general: "none", damaged: "broken_phones", upgrade: "upgraders", local: "locals", local_buyer: "local_buyer", wholesale: "wholesale" };

const titleCase = s => /[a-z]/.test(s) || s.length <= 3 ? s : s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());

/** What the listing is written from: the ad's phones, words, audience, area
 *  and language. `meta` maps a phone id to its { model, finish }. */
export function readAd(st, meta = {}) {
  const phones = (st.phones || []).map(id => meta[id]).filter(Boolean);
  const finishes = {};
  for (const p of phones) {
    const model = p.upload ? "" : String(p.model || "");
    if (!/^iPhone /.test(model)) continue;
    (finishes[model] = finishes[model] || []);
    if (p.finish && !finishes[model].includes(p.finish)) finishes[model].push(p.finish);
  }
  const models = Object.keys(finishes).sort((a, b) => NEWEST(b) - NEWEST(a));
  const words = { hook: st.hook_text, headline: st.headline, tag: st.tag, label: st.number_label, cta: st.cta };
  const said = Object.values(words).filter(s => typeof s === "string").join(" · ");
  let angle = AUDIENCE_ANGLE[st.audience] || "", why = angle ? "audience" : "";
  if (!angle) for (const [k, re] of WORD_ANGLES) if (re.test(said)) { angle = k; why = "words"; break; }
  const typed = String(st.area || "").split(",")[0].trim();
  const area = typed ? titleCase(typed) : (/\bL\.?A\.?\b/.test(said) ? "LA" : "");
  const lang = st.lang === "es" || st.lang === "both" ? st.lang : "en";
  return { models, finishes, words, said, angle: angle || "general", why: why || "default", area, lang, uploads: (st.phones || []).filter(id => meta[id] && meta[id].upload).length };
}

// ---------------------------------------------------------------------------
// The checks (buy_ad_copy.lint and legitimacy), ported
// ---------------------------------------------------------------------------
const CRM_BUY_AD = /we\s*buy|cash\s*(4|for)|buy\s*back|buyback|sell\s*(me|us|your)|top\s*dollar|trade[-\s]*in|paying\s*cash/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}☀-➿\u{1F000}-\u{1F2FF}⌀-⏿‼⁉]/gu;
const URL_RE = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|la|io|co|us|app)\b/i;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE = /(?<!\d)(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/;
const ADDRESS = /\b\d{2,6}\s+[A-Za-z][A-Za-z ]{2,30}\b(street|st|ave|avenue|blvd|boulevard|rd|road|dr|drive|way|lane|ln)\b/i;
const LOCKED = /icloud[\s-]*lock|activation[\s-]*lock|\bmdm\b|blacklist|bad\s*(esn|imei)|\bfinanced\b|\bbalance\s+owed\b|still\s+owe|\bbloquead[oa]s?\b|\bfinanciad[oa]s?\b/i;
const BUY_LOCKED = /(we\s*buy|buying|sell\s*(us|me|your)|cash\s*for)[^.\n]{0,40}(icloud|activation|blacklist|bad\s*(esn|imei)|financed|locked|stolen)/i;
const PAYMENT = /\b(zelle|venmo|cash\s*app|cashapp|paypal|western\s*union|moneygram|crypto|bitcoin|gift\s*card)\b/i;
const OFF_APP = /\b(text|call|dm|whats\s*app|whatsapp|telegram|email)\s+(me|us)\b/i;
const SUPERLATIVE = /\b(best|highest|top)\s+(price|prices|offer|offers|payout|dollar)\b|\bguarantee(d)?\b|#\s*1\b|\bmost\s+money\b/i;
const STORAGE = /\b\d{2,4}\s*(gb|tb)\b/i;
const MODEL_WORD = /\b(iphone|ipad|macbook|imac|mac\s+mini|mac\s+studio|apple\s+watch|watch|airpods)\b/gi;
const STOP = new Set(["we", "buy", "your", "you", "our", "us", "a", "an", "the", "and", "or", "to", "for", "of", "in",
  "on", "it", "is", "with", "if", "we'll", "we're", "any", "at", "be", "can", "that", "this"]);
const TITLE_MODEL = /\b(?:iphone\s*)?1[1-9](?:\s*(?:pro\s*max|pro|plus|air|mini|max|e))?\b|\bm[1-6](?:\s*(?:pro|max|ultra))?\b|\bs2\d(?:\s*(?:ultra|plus))?\b/gi;
const NUMBERED_MODEL = /\b(?:iphone|ipad(?:\s*(?:pro|air|mini))?|macbook(?:\s*(?:pro|air))?|watch(?:\s*(?:series|ultra))?)\s*\d{1,2}(?:\s*(?:pro\s*max|pro|plus|max|mini|e))?/gi;
const CLAIM_RE = /\btop\s*(?:dollar|offers?|buyer|cash|price|payout)\b|\btop\s*\$|\bpaying\s*(?:the\s*most|top|more|best)\b|\b(?:very\s+)?high(?:est)?\s*(?:prices?|offers?|payouts?)\b|\bbest\s*(?:prices?|offers?|deals?)\b|\bguarantee(?:d)?\b|#\s*1\b|\bnumber\s*one\b|\bmost\s*money\b|\bbeat\s*any\b|\bno\s*one\s*pays\s*more\b|\bpay(?:s|ing)?\s+better\b|\bup\s*(?:to\s*)?\$\s*\d[\d,]*|\b(?:instant|fast|quick|easy)\s+(?:cash|money)\b|\bcash\s+(?:today|now|on\s+the\s+spot)\b|\bfa\$t\s*ca\$h\b|\b(?:trusted|legit|reliable)\s+buyers?\b/gi;
const CALL_NOW = /\bcall\s*(?:now|me|us)\b|\btext\s*(?:me|us|now)\b|\bdm\s*(?:me|us)\b|\bwhats\s*app\b|\btelegram\b|\bplz\s*call\b|\b(?:call|text|msg|message)\s*(?:or|\/|&)\s*(?:call|text|msg)\b/i;
const MARKDOWN = /\*\*[^*\n]{2,}\*\*|__[^_\n]{2,}__/;
const HASHTAG = /(?<![\w&])#(?=\w*[A-Za-z])\w{3,}/g;
const LOUD = /!{3,}|\${2,}|\?{3,}/;
const KEYWORDISH = /iphone|ipad|macbook|imac|apple|phone|buyer|buy|sell|cash|trade|unlock|near\s*me|repair/i;
const KEYWORD_BUY = /buyers?|\bbuy\b|\bbuying\b|\bsell\b|\bcash\b|\bwanted\b|\btrade\b|near\s*me|\bcompro\b/i;
const LOCK_WORD = /(?<!carrier\s)(?<!carrier-)\b(?:icloud[\s-]*locked|icloud|activation[\s-]*lock(?:ed)?|blacklist(?:ed)?|bad\s*(?:esn|imei)|financed|stolen|passcode[\s-]*locked|locked|bloquead[oa]s?|reportad[oa]s?|robad[oa]s?|financiad[oa]s?)\b/i;
const BUY_VERB = /\bwe\s*buy\b|\bi\s*buy\b|\bbuying\b|\bbuy\s+(?:all|any)\b|\bcompr(?:o|amos)\b|\blooking\s+to\s+buy\b|\bsell\s*(?:us|me)\b|\bcash\s*(?:4|for)\b|\baccept(?:s|ing)?\b|\bacepto\b|\bwe\s*take\b|\btake\s+(?:all|any)\b/gi;
const NEGATOR = /\b(?:no|not|never|except|without|sin|nada)\b|n[’']t\b/i;
const LOCK_OK = /^\s*(?:devices?|phones?|iphones?|ones?)?\s*(?:ok(?:ay)?|accepted|considered|welcome|fine|no\s+problem|are\s+ok|is\s+fine)\b/i;
const CARRIER_LOCKED = /\bcarrier[-\s]*locked\b|\blocked\s*or\s*unlocked\b/i;
export const LEGIT_AT = 80, BORDERLINE_AT = 60;

const finding = (code, message) => ({ code, message });
const caps = text => { const l = text.match(/\p{L}/gu) || []; return [l.length, l.length ? l.filter(c => c !== c.toLowerCase()).length / l.length : 0]; };
const tokens = (text, min = 0) => (text.toLowerCase().match(/[a-z0-9']+/g) || []).filter(w => !STOP.has(w) && w.length > min);
const repeats = (list, n) => [...new Set(list.filter(w => list.filter(x => x === w).length >= n))].sort();

/** The longest run of short search phrases written for the search box (buy_ad_copy.keyword_list). */
export function keywordList(text) {
  let best = "", bestN = 0;
  const consider = (run, joiner, minimum) => {
    if (run.length >= minimum && run.length > bestN) {
      const buyish = run.filter(p => KEYWORD_BUY.test(p)).length;
      if (buyish * 5 >= run.length * 2) { bestN = run.length; best = run.join(joiner); }
    }
  };
  for (const line of String(text || "").split(/[.!?\n]+/)) {
    let run = [];
    for (const part of line.split(/[,|/•·;]+/).map(p => p.trim()).filter(Boolean)) {
      const n = part.split(/\s+/).length;
      if (n >= 1 && n <= 5 && (KEYWORDISH.test(part) || new RegExp(TITLE_MODEL.source, "i").test(part))) { run.push(part); consider(run, ", ", 4); }
      else run = [];
    }
  }
  let run = [];
  for (const line of String(text || "").split("\n")) {
    const part = line.replace(/^[\s\-•·*\t]+|[\s\-•·*\t]+$/g, "");
    if (!part) continue;
    const n = part.split(/\s+/).length;
    if (n >= 1 && n <= 8 && !/[.!?:]$/.test(part)) { run.push(part); consider(run, " / ", 6); } else run = [];
  }
  return best;
}

function buysLocked(text) {
  for (const sentence of String(text || "").split(/[.!?\n]+/)) {
    for (const verb of sentence.matchAll(BUY_VERB)) {
      const end = verb.index + verb[0].length, tail = sentence.slice(end, end + 90), lock = LOCK_WORD.exec(tail);
      if (lock && !NEGATOR.test(tail.slice(0, lock.index))) return (verb[0] + tail.slice(0, lock.index + lock[0].length)).replace(/\s+/g, " ");
    }
    const re = new RegExp(LOCK_WORD.source, "gi");
    for (const lock of sentence.matchAll(re)) {
      const before = sentence.slice(Math.max(0, lock.index - 40), lock.index), after = LOCK_OK.exec(sentence.slice(lock.index + lock[0].length));
      if (after && !NEGATOR.test(before)) return sentence.slice(lock.index, lock.index + lock[0].length + after[0].length);
    }
  }
  return "";
}

/** How a post reads: { score, verdict, signals } (buy_ad_copy.legitimacy, without the price). */
export function legitimacy(title, body) {
  title = String(title || "").trim(); body = String(body || "").trim();
  const both = title + "\n" + body, signals = [];
  const add = (code, weight, message) => signals.push({ code, weight, message });
  const named = new Set((title.match(TITLE_MODEL) || []).map(m => m.toLowerCase().replace(/^iphone\s*/, "").split(/\s+/).join(" ")));
  if (named.size >= 3) add("title_models", 15, `The title names ${named.size} models one after another.`);
  const tw = (title.toLowerCase().match(/[a-z']+/g) || []).filter(w => !STOP.has(w));
  const rep = repeats(tw, 3);
  if (rep.length) add("title_repeats", 15, `"${rep[0]}" is in the title three times or more.`);
  const kw = keywordList(body);
  if (kw) add("keyword_list", 35, "The description has a list of search phrases, which reads as spam.");
  const models = new Set((body.match(NUMBERED_MODEL) || []).map(m => m.toLowerCase().replace(/\s+/g, " ")));
  if (models.size >= 6) add("model_dump", 15, `The description names ${models.size} models one after another.`);
  const [nt, ct] = caps(title); if (nt >= 8 && ct > .5) add("caps_title", 10, "The title is mostly capital letters.");
  const [nb, cb] = caps(body); if (nb >= 40 && cb > .3) add("caps_body", 15, "Much of the description is in capitals.");
  if ((title.match(EMOJI) || []).length) add("emoji_title", 10, "Emoji in the title.");
  const eb = (body.match(EMOJI) || []).length; if (eb >= 4) add("emoji_body", eb >= 10 ? 15 : 10, `${eb} emoji in the description.`);
  if (MARKDOWN.test(both)) add("markdown", 10, "**Bold** markup prints as asterisks.");
  if ((both.match(HASHTAG) || []).length >= 2) add("hashtags", 10, "Hashtags.");
  if (LOUD.test(both)) add("loud_punctuation", 5, "Runs of !!! or $$$.");
  if (PHONE.test(both) || EMAIL.test(both) || URL_RE.test(both)) add("contact_details", 30, "A phone number, email or link in the post.");
  else if (CALL_NOW.test(both)) add("off_app", 15, "Asks people to call or text instead of messaging in the app.");
  if (ADDRESS.test(both)) add("address", 20, "A street address in the post.");
  if (PAYMENT.test(both)) add("payment_apps", 5, "Names a payment app.");
  const tc = new Set((title.match(CLAIM_RE) || []).map(s => s.toLowerCase())), bc = new Set((body.match(CLAIM_RE) || []).map(s => s.toLowerCase()).filter(s => !tc.has(s)));
  if (tc.size || bc.size) add("claims", Math.min(30, 15 * tc.size + 8 * bc.size), "Claims nobody can check: " + [...tc, ...bc].join(", ") + ".");
  if (buysLocked(both)) add("locked_devices", 30, "Offers to buy locked, financed or blacklisted devices.");
  else if (LOCKED.test(both)) add("locked_words", 10, "Lock, finance or blacklist words.");
  else if (CARRIER_LOCKED.test(both)) add("carrier_locked", 5, "Promises about carrier-locked phones.");
  if (/\bcash\b/i.test(both)) add("cash", 5, "The word cash.");
  if (body && body.length < 60) add("thin", 15, "A description of a few words reads as a placeholder.");
  else if (body && body.length < 120) add("thin", 5, "A very short description.");
  const score = Math.max(0, 100 - signals.reduce((a, s) => a + s.weight, 0));
  return { score, verdict: score >= LEGIT_AT ? "legitimate" : score >= BORDERLINE_AT ? "borderline" : "spam", signals };
}

/** Blockers stop an ad being approved on iPhones LA, and here say "fix before
 *  posting"; warnings are shown beside it (buy_ad_copy.lint, without the price). */
export function lint(title, body) {
  title = String(title || "").trim(); body = String(body || "").trim();
  const blockers = [], warnings = [];
  if (!title) blockers.push(finding("title_missing", "The title is empty."));
  else {
    if (!CRM_BUY_AD.test(title)) blockers.push(finding("crm_title", "The title needs \"We buy\", \"Sell us your\", \"Sell your\" or \"Buyback\", so it reads as a buy ad and the replies come from sellers."));
    if (title.length > TITLE_MAX) blockers.push(finding("title_long", `The title is ${title.length} characters; keep it under ${TITLE_MAX}.`));
    else if (title.length > TITLE_FEED) warnings.push(finding("title_cut", `The feed shows the first ${TITLE_FEED} characters; the model is in them.`));
    const [n, c] = caps(title); if (n >= 8 && c > .5) warnings.push(finding("caps", "Mostly capital letters reads as shouting and as spam."));
    if ((title.match(EMOJI) || []).length) warnings.push(finding("title_emoji", "Emoji in a title read as spam."));
    const rep = repeats((title.toLowerCase().match(/[a-z0-9']+/g) || []).filter(w => !STOP.has(w)), 3);
    if (rep.length) blockers.push(finding("title_stuffed", `"${rep[0]}" is repeated three times: listings that add keywords to steer search are removed.`));
    if ((title.match(MODEL_WORD) || []).length > 3) warnings.push(finding("title_list", "The title names more than three devices; a list of models reads as keyword stuffing."));
    if (STORAGE.test(title)) warnings.push(finding("title_storage", "A storage size in the title reads like a phone for sale."));
  }
  if (!body) blockers.push(finding("body_missing", "The description is empty."));
  else if (body.length > BODY_MAX) blockers.push(finding("body_long", `The description is ${body.length} characters; keep it under ${BODY_MAX}.`));
  const both = title + "\n" + body;
  if (URL_RE.test(both)) blockers.push(finding("link", "Links and web addresses are not allowed in a listing."));
  if (EMAIL.test(both)) blockers.push(finding("email", "Email addresses are not allowed in a listing."));
  if (PHONE.test(both)) blockers.push(finding("phone", "Phone numbers are not allowed in a listing; the number is on the picture."));
  if (ADDRESS.test(both)) blockers.push(finding("address", "A street address is not allowed in a listing; name the city."));
  if (BUY_LOCKED.test(both)) blockers.push(finding("locked_devices", "Offering to buy locked, blacklisted, financed or stolen devices is prohibited."));
  else if (LOCKED.test(both)) warnings.push(finding("locked_words", "Words like iCloud lock, blacklist or financed draw the marketplaces' filters; \"signed out of your Apple account\" says it without them."));
  if (/\bcash\b/i.test(both)) warnings.push(finding("cash", "OfferUp's prohibited items include listings that offer cash as part of a purchase; \"paid on the spot\" says it without the word."));
  if (/trade[-\s]*in/i.test(both)) warnings.push(finding("trade_in", "\"Trade-in\" promises store credit."));
  if (SUPERLATIVE.test(both)) warnings.push(finding("claims", "\"Best price\", \"top dollar\" and \"guaranteed\" are claims nobody can check."));
  if (PAYMENT.test(both)) warnings.push(finding("payment", "Naming payment apps invites the risky-payment reading; say you pay on the spot."));
  if (OFF_APP.test(both)) warnings.push(finding("off_app", "Asking people to text, call or email moves them off the app; say \"message us\"."));
  if (body && (body.match(EMOJI) || []).length > 3) warnings.push(finding("body_emoji", "A row of emoji reads as spam."));
  if (body) {
    const t = tokens(body, 2), stuffed = [...new Set(t.filter(w => t.filter(x => x === w).length > 7))].sort();
    if (stuffed.length) warnings.push(finding("body_stuffed", `"${stuffed[0]}" appears ${t.filter(x => x === stuffed[0]).length} times in the description; that reads as keyword stuffing.`));
  }
  if (/any\s+condition/i.test(both)) warnings.push(finding("any_condition", "\"Any condition\" over-promises: an Apple-account-locked device can't be bought."));
  const legit = legitimacy(title, body);
  if (legit.verdict === "spam") blockers.push(finding("reads_as_spam", `This reads as spam (score ${legit.score} of 100).`));
  else if (legit.verdict === "borderline") warnings.push(finding("reads_borderline", `This reads as borderline (score ${legit.score} of 100).`));
  return { ok: !blockers.length, blockers, warnings, legit };
}

// ---------------------------------------------------------------------------
// Writing it
// ---------------------------------------------------------------------------
// The words sellers search for, scored once each in a title.
const SEARCH_WORDS = [/\bwe buy\b/i, /\bsell (your|us)\b/i, /\bbuyer\b/i, /\blocal\b/i, /\bwholesale\b/i, /\bbulk\b/i, /\blots?\b/i,
  /\bsame day\b/i, /\bcracked\b/i, /\bdamaged\b/i, /\bupgrad/i, /\bnew or used\b/i, /\bused\b/i, /\bnearby\b/i, /\bpaid on the spot\b/i,
  /\biphones?\b/i, /\bpro max\b/i, /\bpro\b/i, /\bplus\b/i, /\bmini\b/i, /\bscreen\b/i];
const ownWords = s => new Set(tokens(s, 2).filter(w => !/^\d/.test(w)));

/** Every title the angle can make for the ad, checked, best first. */
export function titleOptions(ctx, angle = ctx.angle, tone = "plain") {
  const A = ANGLES[angle] || ANGLES.general;
  const pats = [...new Set([...(A.tones[tone] || A.tones.plain).titles, ...A.tones.plain.titles])];
  const sets = [ctx.models.slice(0, 2), ctx.models.slice(0, 1)].filter((s, i, a) => i === 0 || s.length !== a[0].length);
  const out = new Map();
  pats.forEach((pat, pi) => {
    if (/\{area\}/.test(pat) && !ctx.area) return;
    for (const models of sets) {
      const base = fill(pat, ctx, models);
      const tails = A.tails.filter(t => ctx.area || !/\{area\}/.test(t)).map(t => fill(t, ctx, models, false));
      const tries = [base];
      for (const t1 of tails) { tries.push(base + t1); for (const t2 of tails) if (t2 !== t1) tries.push(base + t1 + t2); }
      for (const t of tries) {
        if (t.length > TITLE_MAX || out.has(t)) continue;
        // a tail that says again what the title says reads as padding
        const parts = t.slice(base.length).split(/(?= - |, | in )/).filter(Boolean);
        let seen = ownWords(base), padded = false;
        for (const p of parts) { const w = ownWords(p); if ([...w].some(x => seen.has(x) && x !== (ctx.area || "").toLowerCase())) padded = true; w.forEach(x => seen.add(x)); }
        if (padded) continue;
        // a title is one or two clauses, not a string of tags
        if ((t.match(/ - |, |: /g) || []).length > 2 || (t.match(/ - /g) || []).length > 1) continue;
        const check = lint(t, "x".repeat(200));
        if (!check.ok || check.warnings.some(w => w.code !== "title_cut")) continue;
        const lead = models[0] || "";
        if (lead && t.indexOf(lead) + lead.length > TITLE_FEED) continue;   // the model is what the feed shows
        // what is on the picture counts most: each pictured model named is worth a search word and a half
        const words = SEARCH_WORDS.filter(re => re.test(t)).length + (ctx.area && t.includes(ctx.area) ? 1 : 0);
        out.set(t, { title: t, pattern: pi, score: words * 12 + models.length * 18 + t.length * .25, words });
      }
    }
  });
  const ranked = [...out.values()].sort((a, b) => b.score - a.score);
  // one per pattern first, so "another title" is another sentence, not another tail
  const firsts = [], rest = [], seenPat = new Set();
  for (const o of ranked) (seenPat.has(o.pattern) ? rest : (seenPat.add(o.pattern), firsts)).push(o);
  return [...firsts, ...rest];
}

const joinWords = list => list.length <= 1 ? (list[0] || "") : list.slice(0, -1).join(", ") + " and " + list[list.length - 1];

/** What is on the picture, said for a reader: the models and their finishes,
 *  then every storage size each was made in. Longest first; the description
 *  takes the longest that still passes (the family word said eight times is
 *  stuffing, so the shorter ones say it once). */
function modelsParagraphs(ctx) {
  const ms = ctx.models.slice(0, 5);
  if (!ms.length) return [];
  const short = (m, i) => i ? m.replace(/^iPhone (?=\d+e? \S)/, "") : m;
  const finish = m => (ctx.finishes[m] || []).length ? ` in ${joinWords(ctx.finishes[m])}` : "";
  const sizes = m => ` in ${joinWords(LINEUP[m]).replace(/ and (\S+)$/, " or $1")}`;
  const open = "We're buying, not selling: the phones in the picture are the models we're looking for";
  const known = ms.filter(m => LINEUP[m]);
  const out = [];
  if (known.length) out.push(
    `${open}, the ${joinWords(ms.map(m => m + finish(m)))}. We buy them in every storage size Apple made (${known.map(m => m + sizes(m)).join("; ")}), in any colour.`,
    `${open}, the ${joinWords(ms.map((m, i) => short(m, i) + finish(m)))}. We buy them in every storage size Apple made (${known.map((m, i) => short(m, i) + sizes(m)).join("; ")}), in any colour.`);
  out.push(`${open}: the ${joinWords(ms.map((m, i) => short(m, i) + finish(m)))}, in any storage size and colour.`,
    `${open}: the ${joinModels(ms)}, in any storage size and colour.`,
    `${open}: the ${compactModels(ms)}, in any storage size and colour.`);
  return out;
}

/** "iPhone 18, 17 and 16 Pro Max, plus the iPhone 15": a set of the same kind
 *  said once, as a person writes it, so five Pro Maxes are not "Pro Max" five times. */
export function compactModels(models) {
  const groups = [];
  for (const m of models) {
    const g = /^iPhone (\d+e?)(?: (.+))?$/.exec(m);
    if (!g) { groups.push({ names: [m], suffix: null }); continue; }
    const suffix = g[2] || "", have = groups.find(x => x.suffix === suffix);
    if (have) have.names.push(g[1]); else groups.push({ names: [g[1]], suffix });
  }
  return groups.map((g, i) => (i ? "the " : "") + (g.suffix === null ? g.names[0] : `iPhone ${joinWords(g.names)}${g.suffix ? " " + g.suffix : ""}`)).join(", plus ");
}

function spanishParagraph(ctx, angle) {
  const where = ctx.area ? `en ${ctx.area}` : "cerca de ti";
  const lot = angle === "wholesale" ? " Si tienes varios, mándanos la lista de los equipos y te damos una sola oferta por todo el lote." : "";
  const which = ctx.models.length ? ": los modelos de la foto y otros" : "";
  return `Hablamos español. Compramos iPhone nuevos o usados, también con la pantalla o la tapa rota${which}.${lot} Mándanos un mensaje con el modelo, la capacidad, la compañía (o si está desbloqueado) y el estado, y te mandamos una oferta. Nos vemos ${where}, lo revisamos contigo y te pagamos en el momento. Tiene que estar fuera de tu cuenta de Apple y no reportado como perdido o robado.`;
}

// Without an area the patterns' "{area} shop" and "Hello from {area}" have
// nothing to name: said the way a person would say it without one.
const NO_AREA = [
  [/\ba small your area shop\b/g, "a small local shop"], [/\ba local your area shop\b/g, "a local shop"],
  [/\bHello from your area\./g, "Hello, neighbour."], [/\ba your area meeting\b/g, "a nearby meeting"],
  [/\bthe agreed your area meeting\b/g, "the agreed meeting"], [/\bLocation: your area\./g, "Location: nearby."],
  [/\b(enquiry: .+?), your area\./g, "$1, nearby."], [/\bnear your area today\b/g, "nearby today"],
  [/\bLocal iPhone buyer in your area\./g, "Local iPhone buyer, meeting nearby."], [/\ba local buyer in your area\./g, "a local buyer."],
  [/\bin your area\b/g, "nearby"], [/\baround your area\b/g, "nearby"],
];
const placeless = (text, ctx) => ctx.area ? text : NO_AREA.reduce((t, [re, to]) => t.replace(re, to), text);

/** A description for the ad: the angle's own, grown by what is on the picture
 *  and how the buying works, for as long as every check still passes. */
export function describe(ctx, angle = ctx.angle, tone = "plain", variant = 0, title = "We buy iPhones") {
  const A = ANGLES[angle] || ANGLES.general, T = A.tones[tone] || A.tones.plain;
  const parts = placeless(fill(T.bodies[((variant % T.bodies.length) + T.bodies.length) % T.bodies.length], ctx, ctx.models.slice(0, 3)), ctx).split("\n\n");
  const head = parts[0], last = parts.length > 1 ? parts[parts.length - 1] : "", middle = parts.slice(1, -1);
  const extras = [];
  const want = (k) => { const x = MORE[k]; return (!x.only || x.only.includes(angle)) && !(x.not || []).includes(angle); };
  const already = parts.join("\n\n");
  for (const k of ["where", "damaged", "lots", "conditions", "carrier", "local", "find", "prep", "meet", "box", "other"]) {
    if (!want(k)) continue;
    if (k === "where" && (!ctx.area || already.includes(ctx.area))) continue;   // the area is a search word: said once at least
    if (k === "find" && already.includes(FAMILY.where_to_find)) continue;
    if (k === "prep" && /\berase\b/i.test(already)) continue;
    extras.push(placeless(fill(MORE[k].en, ctx), ctx));
  }
  const pictured = modelsParagraphs(ctx);
  const spanish = ctx.lang !== "en" ? spanishParagraph(ctx, angle) : "";
  // the order a reader meets them in: what is on the picture first, the rules
  // last, then the Spanish; a paragraph stays only if the whole still passes
  let shown = "", es = false;
  const kept = [];
  const body = () => [head, shown, ...middle, ...kept, last, es ? spanish : ""].filter(Boolean).join("\n\n");
  // the title's own notes (the feed's cut) are the title's: the body is held to everything else
  const fine = () => { const t = body(); if (t.length > BODY_AIM) return false; const c = lint(title, t); return c.ok && !c.warnings.some(w => w.code !== "title_cut") && c.legit.score >= 95; };
  // a Spanish ad keeps its Spanish: the pictured paragraph is chosen with it in
  const pick = () => { for (const p of pictured) { shown = p; if (fine()) return true; } shown = ""; return fine(); };
  es = !!spanish;
  if (!pick() && es) { es = false; pick(); }
  for (const p of extras) { kept.push(p); if (!fine()) kept.pop(); }
  return body();
}

/** The listing for the ad on screen. */
export function listingFor(st, meta = {}, { angle = "auto", tone = "plain", titleVariant = 0, bodyVariant = 0 } = {}) {
  const read = readAd(st, meta);
  const use = angle && angle !== "auto" && ANGLES[angle] ? angle : read.angle;
  const ctx = { ...read, angle: use };
  const titles = titleOptions(ctx, use, tone);
  const t = titles.length ? titles[((titleVariant % titles.length) + titles.length) % titles.length].title : `We buy ${joinModels(ctx.models.slice(0, 2)) || FAMILY.plural}`;
  const description = describe(ctx, use, tone, bodyVariant, t);
  return { angle: use, angleLabel: ANGLES[use].label, tone, title: t, description, titleCount: titles.length,
    bodyCount: (ANGLES[use].tones[tone] || ANGLES[use].tones.plain).bodies.length, read, check: lint(t, description) };
}
