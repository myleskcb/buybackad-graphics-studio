/* RETIRED FROM THE STUDIO'S SHELVES, 2026-11-11. Kept by hand: this is a decision, not a measurement.

   The owner: "I still don't see picture ads that look in line with the video ads", "drop old
   ones that look tacky cheesy or ununified" (2026-11-03), and, of the work left, "retire the
   old generations as each replacement lands; the 31 originals and 26 street templates are the
   furthest from the house style". The replacement landed the same day: the full ad
   (motion/fullad.js) draws every one of these lines (phones, gold, silver, coins, cars, test
   strips, Pokemon and sports cards) in the house style.

   What this does: app.js applyTemplateHolds() leaves these out of TEMPLATES, as it does a held
   template, so they are not offered in Easy Mode, the editor's picker or the landing. Nothing
   is deleted: the builders, the baked tables and every saved project stay as they are, and a
   project made on one of these still opens from its own saved layers.

   To bring one back, delete its row. To see them all again, open the studio with ?noretire=1.
   The designer layouts (dl_), the offer family (of_) and the Designer Library stay offered. */
window.TEMPLATE_RETIRED = {
  // the first hand-made designs: 50
  "sell_iphone":"original", "top_buyer":"original", "we_buy":"original", "cash_offer":"original", "icloud_ok":"original",
  "same_day":"original", "bold_buyer":"original", "neon_sell":"original", "gold_spot":"original", "gold_lux":"original",
  "gold_scale":"original", "gold_cash_now":"original", "gold_estate":"original", "gold_marker":"original", "silver_stack":"original",
  "silver_ounce":"original", "silver_mirror":"original", "silver_ster":"original", "silver_neon":"original", "coins_estate":"original",
  "coins_morgan":"original", "coins_grandpa":"original", "coins_error":"original", "coins_graded":"original", "coins_ticket":"original",
  "cars_anycond":"original", "cars_kbb":"original", "cars_junk":"original", "cars_plate":"original", "cars_speed":"original",
  "cars_fleet":"original", "cars_odometer":"original", "strips_clean":"original", "strips_box":"original", "strips_pickup":"original",
  "strips_cgm":"original", "strips_expiry":"original", "pkm_binder":"original", "pkm_zard":"original", "pkm_sealed":"original",
  "pkm_attic":"original", "pkm_grade":"original", "pkm_jp":"original", "pkm_bulk":"original", "sports_rookie":"original",
  "sports_score":"original", "sports_goat":"original", "sports_break":"original", "sports_ticket":"original", "sports_setbuild":"original",
  // the street set: 40
  "st_phones_cashfor":"street", "st_phones_icongrid":"street", "st_phones_speccheck":"street", "st_phones_pricebadge":"street", "st_phones_splitcol":"street",
  "st_gold_ribbon":"street", "st_gold_cutouthero":"street", "st_gold_twocol":"street", "st_gold_topstrip":"street", "st_gold_pricetag":"street",
  "st_silver_topstrip":"street", "st_silver_cutouthero":"street", "st_silver_speccheck":"street", "st_silver_icongrid":"street", "st_silver_pricetag":"street",
  "st_coins_twocol":"street", "st_coins_ribbon":"street", "st_coins_splitcol":"street", "st_coins_pricebadge":"street", "st_coins_cashfor":"street",
  "st_cars_pricebadge":"street", "st_cars_cutouthero":"street", "st_cars_topstrip":"street", "st_cars_twocol":"street", "st_cars_cashfor":"street",
  "st_strips_icongrid":"street", "st_strips_ribbon":"street", "st_strips_speccheck":"street", "st_strips_splitcol":"street", "st_strips_pricetag":"street",
  "st_pokemon_ribbon":"street", "st_pokemon_twocol":"street", "st_pokemon_icongrid":"street", "st_pokemon_pricebadge":"street", "st_pokemon_cutouthero":"street",
  "st_sports_splitcol":"street", "st_sports_cutouthero":"street", "st_sports_twocol":"street", "st_sports_topstrip":"street", "st_sports_pricetag":"street",
};
