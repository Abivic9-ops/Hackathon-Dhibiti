/**
 * Language layer.
 *
 * Copy is authored in English and translated at the text boundary, so a screen
 * never has to know which language is active. Anything without a Kiswahili
 * entry falls back to the English original rather than showing a key.
 */

export type Language = 'en' | 'sw';

/** Each language is named in its own language, never abbreviated. */
export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
];

/**
 * English → Kiswahili. Keys are the exact English string.
 * `{n}` matches a number and `{x}` any run of text, so one entry covers a
 * sentence that carries a count or a name.
 */
const SW: Record<string, string> = {
  // Navigation
  Home: 'Nyumbani',
  Shield: 'Ngao',
  Pay: 'Malipo',
  Family: 'Familia',
  More: 'Zaidi',

  // Shared actions
  Next: 'Endelea',
  Skip: 'Ruka',
  'Get started': 'Anza',
  Continue: 'Endelea',
  Cancel: 'Ghairi',
  Close: 'Funga',
  Call: 'Piga simu',
  Restore: 'Rejesha',
  'Not a scam': 'Si utapeli',
  'View all': 'Tazama zote',
  'Mark as read': 'Weka kama iliyosomwa',
  'Try again': 'Jaribu tena',
  'Show technical details': 'Onyesha maelezo ya kiufundi',
  'Hide technical details': 'Ficha maelezo ya kiufundi',
  'Skip for now': 'Ruka kwa sasa',
  'Set up now': 'Sanidi sasa',
  'Decide later': 'Amua baadaye',
  'Allow and continue': 'Ruhusu na uendelee',
  'Verify and continue': 'Thibitisha na uendelee',
  'Resend code': 'Tuma msimbo tena',
  'Clear search': 'Safisha utafutaji',
  'Clear filters': 'Safisha vichujio',
  Search: 'Tafuta',

  // Risk system (canonical wording — never soften)
  'High risk': 'Hatari kubwa',
  Suspicious: 'Ina shaka',
  'No known risk found': 'Hakuna hatari inayojulikana',
  'Verified sender': 'Mtumaji aliyethibitishwa',
  Verified: 'Imethibitishwa',
  Unknown: 'Haijulikani',
  'Do not answer, reply, click, or pay': 'Usipokee, usijibu, usibofye, wala usilipe',
  'Verify independently before acting': 'Hakikisha mwenyewe kabla ya kuchukua hatua',
  'No known risk found — this is not a guarantee. Verify anything unexpected.':
    'Hakuna hatari inayojulikana — hii si dhamana. Hakikisha chochote usichotarajia.',
  'Confirm that the message content is also expected':
    'Hakikisha kuwa maudhui ya ujumbe pia ni yanayotarajiwa',
  'Treat this as unknown, not as safe. Verify before you act.':
    'Ichukulie kama haijulikani, si salama. Hakikisha kabla ya kuchukua hatua.',
  'Why we flagged it': 'Kwa nini tuliiweka alama',
  'Recommended actions': 'Hatua tunazopendekeza',
  'Message risk': 'Hatari ya ujumbe',
  'Recipient risk': 'Hatari ya mpokeaji',
  'Overall payment risk': 'Hatari ya malipo kwa ujumla',

  // Onboarding
  'Check before you act': 'Kagua kabla ya kutenda',
  'Check any message, call, or link': 'Angalia ujumbe wowote, simu, au kiungo',
  'before it costs you anything.': 'kabla halikugharimu chochote.',
  'Private by design.': 'Faragha kwa muundo.',
  'Works offline.': 'Hufanya kazi bila mtandao.',
  'A second opinion before money moves': 'Rai ya pili kabla ya pesa kusogezwa',
  'We check the number, link, or message at the exact moment you are about to reply, click, or pay.':
    'Tunakagua namba, kiungo, au ujumbe hasa wakati unakaribia kujibu, kubofya, au kulipa.',
  'We check messages, calls, and QR codes for scams before you act.':
    'Tunakagua ujumbe, simu na misimbo QR kubaini utapeli kabla ya kutenda.',
  'Know who is really calling': 'Jua ni nani anayekupigia kwa kweli',
  'We verify who is really contacting you — banks, Safaricom, or family.':
    'Tunathibitisha ni nani anayekutafuta kwa kweli — benki, Safaricom au familia.',
  'Stop money leaving': 'Zuia pesa kutoka',
  'We warn you before money leaves your account, and can protect your family too.':
    'Tunakuonya kabla pesa kutoka kwenye akaunti yako, na tunaweza kulinda familia yako pia.',
  'Why we ask': 'Kwa nini tunaomba',
  'Confirm your code': 'Thibitisha msimbo wako',
  'Family Circle': 'Mduara wa Familia',
  'I want to protect a family member': 'Nataka kulinda mwanafamilia',
  'I want someone to look out for me': 'Nataka mtu anilinde',
  'Just me for now': 'Mimi tu kwa sasa',
  Language: 'Lugha',
  'Choose your language': 'Chagua lugha yako',
  'You can change this later in More.': 'Unaweza kubadilisha hii baadaye katika Zaidi.',

  // Home
  'Hi, {x}': 'Habari, {x}',
  'Stay alert. Stay protected.': 'Kaa macho. Kaa salama.',
  'Overall protection': 'Ulinzi kwa ujumla',
  Good: 'Nzuri',
  'Stay alert': 'Kaa macho',
  'Take action': 'Chukua hatua',
  'Not checked yet': 'Hakuna ukaguzi bado',
  'No high-risk items in the last 7 days. This is not a guarantee — keep checking.':
    'Hakuna hatari kubwa katika siku 7 zilizopita. Hii si dhamana — endelea kukagua.',
  'Run your first check and your protection status appears here.':
    'Fanya ukaguzi wako wa kwanza na hali ya ulinzi wako itaonekana hapa.',
  '{n} checks in the last 7 days': 'Ukaguzi {n} katika siku 7 zilizopita',
  '{n} check in the last 7 days': 'Ukaguzi {n} katika siku 7 zilizopita',
  '{n} high-risk items flagged in the last 7 days. Do not reply or pay.':
    'Vitu {n} vya hatari kubwa vimebainika katika siku 7 zilizopita. Usijibu wala usilipe.',
  '{n} high-risk item flagged in the last 7 days. Do not reply or pay.':
    'Kitu {n} cha hatari kubwa kimebainika katika siku 7 zilizopita. Usijibu wala usilipe.',
  '{n} suspicious items to verify independently.':
    'Vitu {n} vya kutiliwa shaka — hakikisha mwenyewe.',
  '{n} suspicious item to verify independently.':
    'Kitu {n} cha kutiliwa shaka — hakikisha mwenyewe.',
  'Check message': 'Kagua ujumbe',
  'Scan QR': 'Changanua QR',
  'Verify recipient': 'Hakikisha mpokeaji',
  'Check number': 'Kagua namba',
  'Recent activity': 'Shughuli za hivi karibuni',
  'No checks yet': 'Hakuna ukaguzi bado',
  'When you check a message, call, QR code or number, it will be listed here so you can look back at it.':
    'Unapokagua ujumbe, simu, msimbo QR au namba, utaorodheshwa hapa ili uweze kuurejea.',
  'Scam radar': 'Rada ya utapeli',
  'Near {x}': 'Karibu na {x}',
  'See more near you': 'Tazama zaidi karibu nawe',
  'High-risk items stopped': 'Hatari kubwa zilizozuiliwa',
  'Your safety score': 'Alama yako ya usalama',

  // Shield
  'Check something now': 'Kagua kitu sasa',
  'Check a message': 'Kagua ujumbe',
  'Check a link': 'Kagua kiungo',
  'Check a payment': 'Kagua malipo',
  'Describe a call': 'Eleza simu',
  'Scan a QR code': 'Changanua msimbo QR',
  'Scan a QR code instead': 'Changanua msimbo QR badala yake',
  'Look up a number': 'Tafuta namba',
  'Your risk history': 'Historia yako ya hatari',
  'Quarantine inbox': 'Kikapu cha karantini',
  'Report a scam': 'Ripoti utapeli',
  'Submit report': 'Tuma ripoti',
  'Report received': 'Ripoti imepokelewa',
  'Nothing has been quarantined': 'Hakuna kilichowekwa karantini',
  'Back to Shield': 'Rudi kwa Ngao',
  'Go to Shield': 'Nenda kwa Ngao',
  'Check this message': 'Kagua ujumbe huu',
  'Check this link': 'Kagua kiungo hiki',
  'Check this identifier': 'Kagua kitambulisho hiki',
  'Check this message in full': 'Kagua ujumbe huu kwa ukamilifu',
  'Message text': 'Maandishi ya ujumbe',
  'Paste the message here, in English, Kiswahili or Sheng':
    'Weka ujumbe hapa, kwa Kiingereza, Kiswahili au Sheng',
  Checking: 'Tunakagua',
  'Checking this payment': 'Tunakagua malipo haya',
  Lesson: 'Somo',
  Check: 'Ukaguzi',

  // Pay
  'Verify a payment': 'Hakikisha malipo',
  'Before you confirm it in M-Pesa': 'Kabla ya kuithibitisha kwenye M-Pesa',
  'Amount in KES': 'Kiasi kwa KES',
  'Account name or reference': 'Jina la akaunti au kumbukumbu',
  'Check this payment': 'Kagua malipo haya',
  'High-risk payment': 'Malipo ya hatari kubwa',
  'Before this money leaves': 'Kabla pesa hii kutoka',
  'Call a trusted contact while you wait': 'Piga simu kwa mtu unayemwamini unaposubiri',
  'Do not send this money': 'Usitume pesa hii',
  'Payment stopped': 'Malipo yamesitishwa',
  'Log a payment': 'Andika malipo',
  'Log this payment': 'Andika malipo haya',
  'Mark as paid': 'Weka kama yaliyolipwa',
  'I did not send it': 'Sikuituma',
  'Payment logged': 'Malipo yameandikwa',
  'Saved recipients': 'Wapokeaji waliohifadhiwa',
  'Verify again': 'Hakikisha tena',
  'Payment safety tips': 'Vidokezo vya usalama wa malipo',

  // Family and groups
  'Your family circle': 'Mduara wako wa familia',
  'Group circles': 'Miduara ya vikundi',
  'Chamas and SACCOs': 'Chama na SACCO',
  'Create a group circle': 'Anzisha mduara wa kikundi',
  'New group circle': 'Mduara mpya wa kikundi',
  'Group name': 'Jina la kikundi',
  Members: 'Wanachama',
  'Invite a member': 'Karibisha mwanachama',
  'Invite sent': 'Mwaliko umetumwa',
  'Send invite': 'Tuma mwaliko',
  'Share an invite link': 'Shiriki kiungo cha mwaliko',
  'Their name': 'Jina lake',
  'Their phone number': 'Namba yake ya simu',
  'Invite to your circle': 'Karibisha kwenye mduara wako',
  'Both sides have to agree': 'Pande zote mbili zinapaswa kukubali',
  'Protected member': 'Mwanachama anayelindwa',
  'Family admin': 'Msimamizi wa familia',
  'Send a warning': 'Tuma tahadhari',
  'Send a warning to the group': 'Tuma tahadhari kwa kikundi',
  'Warning sent to the group': 'Tahadhari imetumwa kwa kikundi',
  Alerts: 'Tahadhari',
  'Family safety guide': 'Mwongozo wa usalama wa familia',

  // More
  'Your account, permissions and learning': 'Akaunti yako, ruhusa na kujifunza',
  'Profile & security': 'Wasifu na usalama',
  Permissions: 'Ruhusa',
  'Trusted contacts': 'Watu unaowaamini',
  'Add a trusted contact': 'Ongeza mtu unayemwamini',
  'Verified institutions': 'Taasisi zilizothibitishwa',
  'Literacy library': 'Maktaba ya mafunzo',
  Lessons: 'Masomo',
  'Search lessons': 'Tafuta masomo',
  'Practice: Spot the Scam': 'Mazoezi: Tambua Utapeli',
  'Spot the Scam': 'Tambua Utapeli',
  'Start a round': 'Anza raundi',
  'Try another round': 'Jaribu raundi nyingine',
  'Share your score': 'Shiriki alama yako',
  'Round complete': 'Raundi imekamilika',
  'Safety score': 'Alama ya usalama',
  'Checks this week': 'Ukaguzi wa wiki hii',
  'Lessons read': 'Masomo yaliyosomwa',
  'Reports sent': 'Ripoti zilizotumwa',
  Protection: 'Ulinzi',
  Learn: 'Jifunze',
  Shortcuts: 'Njia za haraka',
  About: 'Kuhusu',
  'About Dhibiti': 'Kuhusu Dhibiti',
  'Quick-Check widget': 'Kijizana cha Ukaguzi wa Haraka',
  'Review options': 'Machaguo ya ukaguzi',
  'Simulate no connection': 'Onyesha hali ya kukosa mtandao',
  'Getting started': 'Unaanza',
  'Building the habit': 'Unajenga mazoea',
  'Checking before you act': 'Unakagua kabla ya kutenda',
  'Hard to catch out': 'Ni vigumu kudanganywa',
  'Protecting yourself': 'Unajilinda mwenyewe',
  Account: 'Akaunti',
  'Your data': 'Data yako',
  'Delete history': 'Futa historia',
  'Your people': 'Watu wako',

  // Shield hub
  'Check anything before you act on it': 'Kagua chochote kabla ya kutenda',
  'Paste a message': 'Weka ujumbe',
  'SMS or WhatsApp text, in any language': 'Ujumbe wa SMS au WhatsApp, kwa lugha yoyote',
  'What the caller said and what they asked for': 'Aliyosema aliyekupigia na alichokuomba',
  'Scan QR code': 'Changanua msimbo QR',
  'Camera or an image from your gallery': 'Kamera au picha kutoka ghala lako',
  'Check a link before you open it': 'Kagua kiungo kabla ya kukifungua',
  'Paste any web address, wherever it came from': 'Weka anwani yoyote ya mtandao, ilikotoka kokote',
  'No messages are being held right now.': 'Hakuna ujumbe unaozuiliwa kwa sasa.',
  'Nothing is deleted. Every held message shows why it was flagged, and you can restore it in one tap. One-time codes from your bank or Safaricom are never held.':
    'Hakuna kinachofutwa. Kila ujumbe uliozuiliwa unaonyesha kwa nini uliwekwa alama, na unaweza kuurejesha kwa mbofyo mmoja. Misimbo ya mara moja kutoka benki yako au Safaricom haizuiliwi kamwe.',
  'Open quarantine inbox': 'Fungua kikapu cha karantini',
  Clear: 'Safisha',
  'Your history is empty': 'Historia yako ni tupu',
  'Checks you run are saved here with their verdict, so you can look back at what happened.':
    'Ukaguzi unaofanya huhifadhiwa hapa na uamuzi wake, ili uweze kurejea kilichotokea.',
  'Help others, and practise': 'Saidia wengine, na fanya mazoezi',
  'Five real examples. Can you call them correctly?':
    'Mifano mitano halisi. Utaweza kuitambua sawasawa?',
  'Clear your check history?': 'Safisha historia yako ya ukaguzi?',
  'The verdicts you have already seen will be removed from this device. Community reports you submitted are not affected.':
    'Uamuzi ambao umeuona utaondolewa kwenye kifaa hiki. Ripoti za jamii ulizotuma hazitaathirika.',
  'Clear history': 'Safisha historia',
  'Keep my history': 'Weka historia yangu',

  // Message and call input
  'SMS, WhatsApp or any text you were sent': 'SMS, WhatsApp au maandishi yoyote uliyotumiwa',
  'Paste it exactly as you received it. Mixed languages are normal, not a problem.':
    'Weka kama vile ulivyoupokea. Kuchanganya lugha ni kawaida, si tatizo.',
  'This text stays on your device. It is only sent anywhere if you choose to report it, and we never ask for your PIN or password.':
    'Maandishi haya yanabaki kwenye kifaa chako. Yanatumwa mahali pengine tu ikiwa unachagua kuripoti, na hatuombi PIN wala nenosiri lako.',
  'In WhatsApp or Messages, long-press a message, tap Share, then pick Dhibiti Quick Check to land on this screen.':
    'Katika WhatsApp au Messages, bonyeza ujumbe kwa muda, gusa Share, kisha chagua Dhibiti Quick Check ili ufike kwenye skrini hii.',
  'Or try a real reported example': 'Au jaribu mfano halisi uliripotiwa',
  'Write what the caller said, in your own words': 'Andika aliyosema aliyekupigia, kwa maneno yako',
  'Dhibiti cannot tell whether a voice was recorded, cloned or real — no tool can do that reliably over a phone line. It checks the request, the pressure and where the money would go.':
    'Dhibiti haiwezi kujua kama sauti ilirekodiwa, ilinakiliwa au ni halisi — hakuna zana inayoweza kufanya hivyo kwa uhakika kwenye simu. Inakagua ombi, msukumo na pesa ingekwenda wapi.',
  'What the caller said': 'Aliyosema aliyekupigia',
  'He said my account will be blocked unless I send money today…':
    'Alisema akaunti yangu itafungwa nisipotuma pesa leo…',
  'Include the claimed name or company, the amount, and the number or Paybill they gave you.':
    'Weka jina au kampuni aliyodai, kiasi, na namba au Paybill aliyokupa.',
  'Who did the caller say they were?': 'Aliyekupigia alisema ni nani?',
  'What did they ask you to do?': 'Alikuomba ufanye nini?',
  'Where did they want the money sent?': 'Alitaka pesa itumwe wapi?',
  'Did they push you to hurry or keep it secret?': 'Alikushinikiza kuharakisha au kuweka siri?',
  'Nothing here is recorded or uploaded. Your description stays on this device unless you report it.':
    'Hakuna kinachorekodiwa au kupakiwa hapa. Maelezo yako yanabaki kwenye kifaa hiki hadi uripoti.',
  'Common call scripts': 'Mifano ya kawaida ya simu',
  'Check this call': 'Kagua simu hii',

  // Lookup and link input
  'We check community reports, verified institutions and your own payment history.':
    'Tunakagua ripoti za jamii, taasisi zilizothibitishwa na historia yako ya malipo.',
  'We store the identifier you check, never your contacts list. Nobody is told that you looked someone up.':
    'Tunahifadhi kitambulisho unachokagua, sio orodha yako ya anwani. Hakuna anayeambiwa kuwa ulimtafuta mtu.',
  'Recently reported by others': 'Zilizoripotiwa hivi karibuni na wengine',
  'Before you open it, not after': 'Kabla ya kukifungua, sio baada',
  'Web address': 'Anwani ya mtandao',
  'Paste the link here': 'Weka kiungo hapa',
  'We check the domain age, certificate, redirects and brand lookalikes.':
    'Tunakagua umri wa kikoa, cheti, uelekezaji na vikoa vinavyofanana na chapa.',
  'Do not enter your PIN, password or ID number on a page you reached from a message, even if the page looks familiar.':
    'Usiweke PIN, nenosiri au namba yako ya kitambulisho kwenye ukurasa uliofikia kutoka kwa ujumbe, hata kama ukurasa unaonekana wa kawaida.',
  'We keep the domain, not the full link with your personal details in it.':
    'Tunahifadhi kikoa, sio kiungo kamili chenye taarifa zako binafsi.',
  'Examples to try': 'Mifano ya kujaribu',

  // QR scanning
  'Camera access is off': 'Ufikiaji wa kamera umezimwa',
  'Without the camera you cannot scan a code directly, but you can still import a QR screenshot from your gallery, or paste the link it contains.':
    'Bila kamera hauwezi kuchanganua msimbo moja kwa moja, lakini bado unaweza kuingiza picha ya QR kutoka ghala lako, au kuweka kiungo kilichomo.',
  'Turn on camera access': 'Washa ufikiaji wa kamera',
  'Import from gallery instead': 'Ingiza kutoka ghala badala yake',
  'Dhibiti needs the camera to read a code': 'Dhibiti inahitaji kamera ili kusoma msimbo',
  'The camera is used only while this screen is open, to read what a QR code contains. No photo is saved and nothing is opened or paid automatically.':
    'Kamera hutumika tu wakati skrini hii imefunguliwa, kusoma kilichomo katika msimbo QR. Hakuna picha inayohifadhiwa na hakuna kinachofunguliwa au kulipwa kiotomatiki.',
  'We store the domain or Paybill a code points to, never the raw image, and you can delete your scan history at any time.':
    'Tunahifadhi kikoa au Paybill ambayo msimbo unaelekeza, sio picha yenyewe, na unaweza kufuta historia yako ya uchanganuzi wakati wowote.',
  'Allow camera access': 'Ruhusu ufikiaji wa kamera',
  'Not now': 'Sio sasa',
  'Nothing opens or pays until you decide': 'Hakuna kinachofunguliwa au kulipwa hadi uamue',
  'Hold the code inside the frame. In this preview build, pick one of the codes below to simulate a scan.':
    'Weka msimbo ndani ya kiunzi. Katika toleo hili la mfano, chagua mmoja wa misimbo ifuatayo ili kuonyesha uchanganuzi.',
  'Codes you can scan in this build': 'Misimbo unayoweza kuchanganua katika toleo hili',
  'A code is never opened, dialled, connected to or paid just because you scanned it. You see the verdict first.':
    'Msimbo haufunguliwi, haupigwi, hauunganishwi wala haulipwi kwa sababu tu umeuchanganua. Unaona uamuzi kwanza.',
  'Import a QR screenshot': 'Ingiza picha ya QR',
  'Import a saved QR code': 'Ingiza msimbo QR uliohifadhiwa',
  'Pick a screenshot to read the code inside it. The image stays on your device.':
    'Chagua picha ili tusome msimbo ulio ndani yake. Picha inabaki kwenye kifaa chako.',

  // Processing steps
  'Reading the wording for urgency, secrecy and payment pressure':
    'Tunasoma maneno kubaini haraka, usiri na msukumo wa malipo',
  'Matching English, Kiswahili and Sheng scam patterns':
    'Tunalinganisha mifumo ya utapeli ya Kiingereza, Kiswahili na Sheng',
  'Checking any number or Paybill against community reports':
    'Tunakagua namba au Paybill yoyote kwa ripoti za jamii',
  'Listing the actions the caller asked you to take':
    'Tunaorodhesha hatua aliyekupigia alizokuomba kuchukua',
  'Comparing the claimed identity with your saved and verified numbers':
    'Tunalinganisha utambulisho aliodai na namba zako zilizohifadhiwa na zilizothibitishwa',
  'Checking the payment destination against community reports':
    'Tunakagua mahali pa malipo kwa ripoti za jamii',
  'Reading the code content and checking its format':
    'Tunasoma maudhui ya msimbo na kukagua muundo wake',
  'Checking the domain age, redirects and brand lookalikes':
    'Tunakagua umri wa kikoa, uelekezaji na vikoa vinavyofanana na chapa',
  'Checking any Paybill, Till or address against community reports':
    'Tunakagua Paybill, Till au anwani yoyote kwa ripoti za jamii',
  'Looking up community reports for this identifier':
    'Tunatafuta ripoti za jamii kwa kitambulisho hiki',
  'Comparing it with verified institutions and merchants':
    'Tunalinganisha na taasisi na wafanyabiashara waliothibitishwa',
  'Checking your own payment history with it': 'Tunakagua historia yako ya malipo naye',
  'Checking the domain, certificate and redirect chain':
    'Tunakagua kikoa, cheti na mnyororo wa uelekezaji',
  'Comparing it with known Kenyan brand domains':
    'Tunalinganisha na vikoa vya chapa zinazojulikana za Kenya',
  'Looking up community reports for this address': 'Tunatafuta ripoti za jamii kwa anwani hii',

  // Verdict detail
  'This check is no longer saved': 'Ukaguzi huu haujahifadhiwa tena',
  'It may have been deleted from your history. You can run a new check any time.':
    'Unaweza kuwa umefutwa kwenye historia yako. Unaweza kufanya ukaguzi mpya wakati wowote.',
  'Many people in Kenya receive messages like this one. Most of them are scams, and reports from others are what made this one easy to spot.':
    'Watu wengi Kenya wanapokea ujumbe kama huu. Wengi wao ni utapeli, na ripoti kutoka kwa wengine ni zilizofanya huu uonekane haraka.',
  'Others have checked identifiers like this one. Unverified does not mean guilty — it means confirm it yourself before money moves.':
    'Wengine wamekagua vitambulisho kama hiki. Kutothibitishwa haimaanishi hatia — inamaanisha uhakikishe mwenyewe kabla pesa kuhama.',
  'What you checked': 'Ulichokagua',
  'This stays on your device unless you choose to report it.':
    'Hii inabaki kwenye kifaa chako hadi uchague kuripoti.',
  'Delete this check?': 'Futa ukaguzi huu?',
  'The record leaves your device. Community reports you already submitted stay, without your name.':
    'Rekodi inaondoka kwenye kifaa chako. Ripoti za jamii ulizotuma zinasalia, bila jina lako.',
  Delete: 'Futa',
  'Keep it': 'Iache',
  'Share this alert with your family circle': 'Shiriki tahadhari hii na mduara wako wa familia',
  'Alert shared with your circle': 'Tahadhari imeshirikiwa na mduara wako',
  'Your circle sees what was detected, why, and what to do — not a feed of everything you do.':
    'Mduara wako unaona kilichobainika, kwa nini, na la kufanya — sio orodha ya kila unachofanya.',
  Done: 'Imekamilika',
  'Open Family': 'Fungua Familia',
  'Why we flagged this': 'Kwa nini tuliiweka alama',
  'What you can do now': 'Unaweza kufanya nini sasa',
  'What to do': 'La kufanya',
  'No payment destination in this check': 'Hakuna mahali pa malipo katika ukaguzi huu',
  optional: 'si lazima',

  // Quarantine
  'Message access is off': 'Ufikiaji wa ujumbe umezimwa',
  'Without message access on Android, Dhibiti cannot hold suspicious SMS for review. You can still paste or share any message into Shield to check it, and you can turn this on later.':
    'Bila ufikiaji wa ujumbe kwenye Android, Dhibiti haiwezi kuzuia SMS zenye shaka kwa ukaguzi. Bado unaweza kuweka au kushiriki ujumbe wowote kwenye Ngao ili kuukagua, na unaweza kuwasha hii baadaye.',
  'Turn on message access': 'Washa ufikiaji wa ujumbe',
  'Paste a message instead': 'Weka ujumbe badala yake',
  'Nothing held right now': 'Hakuna kilichozuiliwa sasa',
  'Suspicious messages will appear here with the reason they were flagged. Nothing is ever deleted, and one-time codes are never held.':
    'Ujumbe wenye shaka utaonekana hapa na sababu ya kuwekwa alama. Hakuna kinachofutwa kamwe, na misimbo ya mara moja haizuiliwi.',
  'These messages are still on your phone. Restoring one puts it back in your Messages app. If we got it wrong, tell us — it helps the rules improve.':
    'Ujumbe huu bado uko kwenye simu yako. Kurejesha mmoja unaurudisha kwenye programu yako ya Messages. Kama tulikosea, tuambie — inasaidia kanuni kuboreka.',
  'Why it was held': 'Kwa nini ulizuiliwa',
  'Restored to your Messages app. It stays visible here so you can check it again later.':
    'Umerejeshwa kwenye programu yako ya Messages. Unabaki hapa ili uweze kuukagua tena baadaye.',
  'Thanks — we are reviewing this one and it has been restored to your Messages app.':
    'Asante — tunauchunguza huu na umerejeshwa kwenye programu yako ya Messages.',

  // Reporting
  'Your report warns the next person': 'Ripoti yako inamtahadharisha mtu ajaye',
  'Your report warns the next person who checks':
    'Ripoti yako inamtahadharisha mtu ajaye anayekagua',
  'What kind of scam was it': 'Ulikuwa utapeli wa aina gani',
  'Closest pattern': 'Mfumo unaokaribiana',
  'Number, Paybill, Till or link used': 'Namba, Paybill, Till au kiungo kilichotumika',
  'This is the part that helps other people most.':
    'Hii ni sehemu inayowasaidia watu wengine zaidi.',
  'What was sent or said': 'Kilichotumwa au kusemwa',
  'Paste the message or describe the call': 'Weka ujumbe au eleza simu',
  'Attach a screenshot (optional)': 'Ambatisha picha ya skrini (si lazima)',
  'Screenshot attached': 'Picha ya skrini imeambatishwa',
  'Keep the screenshot on my device only': 'Weka picha ya skrini kwenye kifaa changu tu',
  'The screenshot stays on this device. Only the number or link and the scam pattern are shared with the community count.':
    'Picha ya skrini inabaki kwenye kifaa hiki. Ni namba au kiungo na mfumo wa utapeli tu vinavyoshirikiwa na hesabu ya jamii.',
  'The screenshot will be shared with Dhibiti review after personal details are removed. Never include your PIN, password or full ID number.':
    'Picha ya skrini itashirikiwa na wachunguzi wa Dhibiti baada ya taarifa binafsi kuondolewa. Usiweke kamwe PIN, nenosiri au namba kamili ya kitambulisho.',
  'Reports are counted per person, so no single reporter can mark a number as a confirmed scam on their own.':
    'Ripoti zinahesabiwa kwa kila mtu, hivyo mtu mmoja hawezi kuweka namba kama utapeli uliothibitishwa peke yake.',
  'Saved on your device for now': 'Imehifadhiwa kwenye kifaa chako kwa sasa',
  "You're offline, so this report hasn't reached the community count yet. It's kept on this device and nothing has been shared. Try again once you have a connection.":
    'Hauna mtandao, hivyo ripoti hii haijafika kwenye hesabu ya jamii. Imehifadhiwa kwenye kifaa hiki na hakuna kilichoshirikiwa. Jaribu tena ukipata mtandao.',
  'Try sending again': 'Jaribu kutuma tena',
  'Thanks for reporting. Reports like yours are what let Dhibiti warn someone else before they pay.':
    'Asante kwa kuripoti. Ripoti kama yako ni zinazomwezesha Dhibiti kumtahadharisha mtu mwingine kabla ya kulipa.',
  'See how reports help (1 min)': 'Ona ripoti zinasaidiaje (dakika 1)',

  // Reverse lookup result
  'What the community data shows': 'Data ya jamii inaonyesha nini',
  'Independent reports': 'Ripoti huru',
  'None yet': 'Hakuna bado',
  'Most common category': 'Aina inayojitokeza zaidi',
  'Not enough information': 'Taarifa hazitoshi',
  'First reported': 'Iliripotiwa kwanza',
  'Most recent report': 'Ripoti ya hivi karibuni',
  'Review status': 'Hali ya uchunguzi',
  'Confirmed by Dhibiti review': 'Imethibitishwa na uchunguzi wa Dhibiti',
  'Under review': 'Inachunguzwa',
  'Reported, not yet reviewed': 'Iliripotiwa, haijachunguzwa',
  'No record': 'Hakuna rekodi',
  'Merchant verification': 'Uthibitisho wa mfanyabiashara',
  'Matches a known merchant': 'Inalingana na mfanyabiashara anayejulikana',
  'Not in our verified merchant list':
    'Haiko kwenye orodha yetu ya wafanyabiashara waliothibitishwa',
  'Domain age': 'Umri wa kikoa',
  'Your own history': 'Historia yako mwenyewe',
  'Other things we noticed': 'Mambo mengine tuliyoyaona',
  'Nobody is told that you looked this up.': 'Hakuna anayeambiwa kuwa ulitafuta hii.',
  'Dial it yourself rather than calling back a number that contacted you.':
    'Ipige mwenyewe badala ya kumpigia namba iliyokutafuta.',
  'Check a payment to this recipient': 'Kagua malipo kwa mpokeaji huyu',
  'Enter the amount and we will show you the risk before any money moves.':
    'Weka kiasi na tutakuonyesha hatari kabla pesa yoyote kuhama.',
  'Call someone you trust first': 'Piga simu kwa mtu unayemwamini kwanza',
  'A second opinion costs nothing and takes a minute.':
    'Maoni ya pili hayagharimu kitu na yanachukua dakika moja.',
  'Verify a payment before sending': 'Hakikisha malipo kabla ya kutuma',
  'No reports found, so confirm the amount and account name still match.':
    'Hakuna ripoti zilizopatikana, hivyo hakikisha kiasi na jina la akaunti bado yanalingana.',
  'Report this to protect others': 'Ripoti hii ili kuwalinda wengine',
  'You have never paid this recipient from Dhibiti. First-time payments deserve one extra check.':
    'Hujawahi kumlipa mpokeaji huyu kutoka Dhibiti. Malipo ya mara ya kwanza yanahitaji ukaguzi mmoja wa ziada.',
  'Others have reported this identifier more than once. Reports from different people count separately, so one person cannot mark a number as a scam alone.':
    'Wengine wameripoti kitambulisho hiki zaidi ya mara moja. Ripoti kutoka kwa watu tofauti zinahesabiwa tofauti, hivyo mtu mmoja hawezi kuweka namba kama utapeli peke yake.',
  'Many people in Kenya are asked to pay numbers they have never used before. Most legitimate businesses are happy to be verified first.':
    'Watu wengi Kenya wanaombwa kulipa namba ambazo hawajazitumia. Biashara halali nyingi hazina tatizo kuthibitishwa kwanza.',

  // Safe browser
  'Dhibiti safe preview': 'Onyesho salama la Dhibiti',
  'The live page is not loaded': 'Ukurasa hai haujapakiwa',
  'You opened this link from a message or QR code. Do not enter your PIN, password or ID number unless you are certain the site is genuine.':
    'Ulifungua kiungo hiki kutoka kwa ujumbe au msimbo QR. Usiweke PIN, nenosiri au namba ya kitambulisho isipokuwa una uhakika tovuti ni halisi.',
  'What is on this page': 'Kilicho kwenye ukurasa huu',
  'Text-only snapshot, nothing on the page can run':
    'Muhtasari wa maandishi tu, hakuna kinachoweza kufanya kazi kwenye ukurasa',
  'The page shows an M-Pesa style logo and green header, but the address is not safaricom.co.ke.':
    'Ukurasa unaonyesha nembo ya mtindo wa M-Pesa na kichwa cha kijani, lakini anwani si safaricom.co.ke.',
  'There is a login form asking for a phone number and M-Pesa PIN.':
    'Kuna fomu ya kuingia inayoomba namba ya simu na PIN ya M-Pesa.',
  'A payment form is pre-filled with an amount you did not enter.':
    'Fomu ya malipo imejazwa kiasi ambacho hukukiweka.',
  'The page has no contact details, terms or company name anywhere.':
    'Ukurasa hauna taarifa za mawasiliano, masharti wala jina la kampuni mahali popote.',
  'The page is a plain information page with no login or payment form.':
    'Ukurasa ni wa taarifa tu, hauna fomu ya kuingia wala ya malipo.',
  'The address matches the brand shown on the page.':
    'Anwani inalingana na chapa inayoonyeshwa kwenye ukurasa.',
  'Nothing on the page asks for a PIN, password or ID number.':
    'Hakuna kinachoomba PIN, nenosiri au namba ya kitambulisho kwenye ukurasa.',
  'What this preview blocks': 'Onyesho hili linazuia nini',
  'Password and PIN fields are disabled on pages we cannot verify.':
    'Sehemu za nenosiri na PIN zimezimwa kwenye kurasa tusizoweza kuthibitisha.',
  'App and file downloads are blocked in this view.':
    'Upakuaji wa programu na faili umezuiliwa katika mwonekano huu.',
  'Forms cannot be submitted to a domain flagged for impersonation.':
    'Fomu haziwezi kutumwa kwa kikoa lililowekwa alama kwa kujifanya mwingine.',
  'Certificate organisation does not match the brand displayed on the page.':
    'Shirika la cheti halilingani na chapa inayoonyeshwa kwenye ukurasa.',
  'Snapshot fetched without cookies, scripts or your IP address.':
    'Muhtasari ulichukuliwa bila vidakuzi, hati au anwani yako ya IP.',
  'Leave this page': 'Ondoka kwenye ukurasa huu',
  'Report this link': 'Ripoti kiungo hiki',

  // Pay tab
  'Check the destination before the money leaves': 'Kagua mahali pa kwenda kabla pesa kutoka',
  'Verify before you send': 'Hakikisha kabla ya kutuma',
  'Enter the recipient and the amount. We check the destination against community reports, your own payment history and any message you were sent.':
    'Weka mpokeaji na kiasi. Tunakagua mahali pa kwenda kwa ripoti za jamii, historia yako ya malipo na ujumbe wowote uliotumiwa.',
  'You still confirm the payment in M-Pesa or your bank app. Dhibiti only adds the check.':
    'Bado unathibitisha malipo kwenye M-Pesa au programu ya benki yako. Dhibiti inaongeza ukaguzi tu.',
  'Waiting on your decision': 'Inasubiri uamuzi wako',
  'No saved recipients yet': 'Hakuna wapokeaji waliohifadhiwa bado',
  'Once you log a payment, the recipient is saved here so future checks can tell you whether you have paid them before.':
    'Ukiandika malipo, mpokeaji huhifadhiwa hapa ili ukaguzi wa baadaye ukuambie kama umemlipa hapo awali.',
  'Your payment log': 'Kumbukumbu yako ya malipo',
  'This log stays on your device. You choose what to add, and you can leave it empty.':
    'Kumbukumbu hii inabaki kwenye kifaa chako. Unachagua unachoongeza, na unaweza kuiacha tupu.',
  'Read the lesson': 'Soma somo',

  // Payment verification input
  'Checking this destination against community reports and your own history…':
    'Tunakagua mahali hapa kwa ripoti za jamii na historia yako…',
  'Matching the number against reported Paybills, Tills and phone numbers':
    'Tunalinganisha namba na Paybill, Till na namba za simu zilizoripotiwa',
  'Checking your payment history with this recipient':
    'Tunakagua historia yako ya malipo na mpokeaji huyu',
  'Reading any message you pasted for urgency and pressure':
    'Tunasoma ujumbe wowote uliouweka kubaini haraka na msukumo',
  'Where is the money going?': 'Pesa inakwenda wapi?',
  'The name shown on the request': 'Jina linaloonyeshwa kwenye ombi',
  'Optional. It helps you recognise this payment later.':
    'Si lazima. Inakusaidia kutambua malipo haya baadaye.',
  'Message or instruction you were sent': 'Ujumbe au maagizo uliyotumiwa',
  'Paste the SMS or WhatsApp text that asked you to pay, if there was one':
    'Weka ujumbe wa SMS au WhatsApp uliokuomba kulipa, kama ulikuwa',
  'Optional, but it lets us check the language as well as the destination.':
    'Si lazima, lakini inatuwezesha kukagua lugha pamoja na mahali pa kwenda.',
  'You have paid this recipient before': 'Umemlipa mpokeaji huyu hapo awali',
  'What we check next': 'Tunakagua nini baadaye',
  'Whether other people have reported this destination, and what for':
    'Kama watu wengine wameripoti mahali hapa, na kwa sababu gani',
  'Whether you have ever paid this recipient from this device':
    'Kama umewahi kumlipa mpokeaji huyu kutoka kifaa hiki',
  'Whether the amount is unusual for you or for this merchant':
    'Kama kiasi si cha kawaida kwako au kwa mfanyabiashara huyu',
  'Whether the Paybill or Till is newly created or missing from our verified merchant list':
    'Kama Paybill au Till ni mpya au haiko kwenye orodha yetu ya wafanyabiashara waliothibitishwa',
  'The recipient, amount and any text you paste stay on this device. Nothing is shared unless you report it, and we never ask for your PIN or M-Pesa password.':
    'Mpokeaji, kiasi na maandishi yoyote unayoweka yanabaki kwenye kifaa hiki. Hakuna kinachoshirikiwa hadi uripoti, na hatuombi PIN wala nenosiri lako la M-Pesa.',

  // Payment result and confirmation
  'Payment check': 'Ukaguzi wa malipo',
  'Nothing has been sent yet': 'Hakuna kilichotumwa bado',
  'This payment check is no longer here': 'Ukaguzi huu wa malipo haupo tena',
  'Payment checks are kept on this device only. Start a new check and we will look up the destination again.':
    'Ukaguzi wa malipo huhifadhiwa kwenye kifaa hiki tu. Anza ukaguzi mpya na tutatafuta mahali pa kwenda tena.',
  'Payment checks live on this device only. Start a new check and we will look up the destination again.':
    'Ukaguzi wa malipo unabaki kwenye kifaa hiki tu. Anza ukaguzi mpya na tutatafuta mahali pa kwenda tena.',
  'First payment to this destination': 'Malipo ya kwanza kwa mahali hapa',
  'Paid before': 'Ilipwa hapo awali',
  'You did not paste a message with this payment, so there is nothing to read for scam language. Unknown is not the same as safe.':
    'Hukuweka ujumbe na malipo haya, hivyo hakuna maandishi ya kusoma kubaini lugha ya utapeli. Kutojulikana si sawa na kuwa salama.',
  'What we found': 'Tulichopata',
  'Before you send': 'Kabla ya kutuma',
  'Many people in Kenya are asked to pay a new number in a hurry. Checking first is normal, and it is the step that stops most losses.':
    'Watu wengi Kenya wanaombwa kulipa namba mpya kwa haraka. Kukagua kwanza ni kawaida, na ni hatua inayozuia hasara nyingi.',
  'Hold this payment and verify': 'Zuia malipo haya na uhakikishe',
  'I have paid — log it': 'Nimelipa — andika',
  'Cancel this payment': 'Ghairi malipo haya',
  'Confirm the details with the recipient': 'Hakikisha maelezo na mpokeaji',
  'Read the Paybill or number and the amount back to the person or business on a number you already have. No known risk found is not a guarantee.':
    'Msomee mtu au biashara Paybill au namba na kiasi kwa namba uliyokuwa nayo. Hakuna hatari inayojulikana si dhamana.',
  'Got it': 'Nimeelewa',
  'Nothing was sent. You did the right thing by checking — now you know this pattern, and you are harder to scam next time.':
    'Hakuna kilichotumwa. Ulifanya jambo sahihi kwa kukagua — sasa unajua mfumo huu, na ni vigumu kudanganywa tena.',
  'Nothing was sent. Pressure to pay fast is the clearest sign of a scam, and you did not give in to it.':
    'Hakuna kilichotumwa. Msukumo wa kulipa haraka ni ishara wazi zaidi ya utapeli, na hukukubali.',
  'Use the wait to verify': 'Tumia muda wa kusubiri kuhakikisha',
  'Calling out is never blocked. Speak to someone you trust, or to the institution on the number saved in Dhibiti — never the number that contacted you.':
    'Kupiga simu hakuzuiliwi kamwe. Zungumza na mtu unayemwamini, au taasisi kwa namba iliyohifadhiwa katika Dhibiti — sio namba iliyokutafuta.',
  'One question before you continue': 'Swali moja kabla uendelee',
  'Yes, I have spoken to them directly': 'Ndiyo, nimezungumza nao moja kwa moja',
  'On a number I already had, not the one that contacted me':
    'Kwa namba niliyokuwa nayo, sio ile iliyonitafuta',
  'No, not yet': 'Hapana, bado',
  'I have only had messages or calls from the number that asked for money':
    'Nimepata ujumbe au simu kutoka namba iliyoomba pesa tu',
  'Speak to them on a number you already had first. That single step stops most impersonation scams.':
    'Zungumza nao kwa namba uliyokuwa nayo kwanza. Hatua hiyo moja inazuia utapeli mwingi wa kujifanya mwingine.',
  'I understand this is high risk and I may not get this money back.':
    'Naelewa hii ni hatari kubwa na naweza kutopata pesa hii tena.',
  'Hold fast-forwarded for this demo': 'Kusubiri kumeharakishwa kwa onyesho hili',
  'Demo: fast-forward the hold': 'Onyesho: haraka mbele ya kusubiri',
  'Included so you can review the lock-elapsed state. In the real app the timer always runs its full length.':
    'Imewekwa ili uweze kuona hali ya baada ya muda kuisha. Katika programu halisi kipima muda hukamilisha muda wake wote.',
  "I'm ready to pay": 'Niko tayari kulipa',
  'Confirm is held until the timer ends': 'Uthibitisho unazuiliwa hadi kipima muda kuisha',
  'Answer the question above and tick the box to continue.':
    'Jibu swali la juu na tia alama kwenye kisanduku ili kuendelea.',
  'You can still call anyone you need to while the hold runs.':
    'Bado unaweza kumpigia yeyote unayemhitaji wakati kusubiri kunaendelea.',
  'Call someone you trust': 'Piga simu kwa mtu unayemwamini',
  'These are the numbers you saved yourself. Caller ID can be faked — a number you saved cannot.':
    'Hizi ni namba ulizohifadhi mwenyewe. Utambulisho wa mpigaji unaweza kughushiwa — namba uliyohifadhi haiwezi.',
  'Back to Pay': 'Rudi kwa Malipo',
  'Report this destination': 'Ripoti mahali hapa',
  'Hold complete': 'Kusubiri kumekamilika',
  'Hold required by your family admin': 'Kusubiri kinahitajika na msimamizi wa familia yako',
  'Hold in progress': 'Kusubiri kunaendelea',
  Ready: 'Tayari',

  // Payment log
  'This payment is no longer here': 'Malipo haya hayapo tena',
  'Payment checks live on this device only. Start a new check whenever you are about to send money.':
    'Ukaguzi wa malipo unabaki kwenye kifaa hiki tu. Anza ukaguzi mpya kila unapotaka kutuma pesa.',
  'Optional, and only on this device': 'Si lazima, na ni kwenye kifaa hiki tu',
  'Did you send this in M-Pesa or your bank app? Marking it here saves the recipient so a future check can tell you how often you have paid them without trouble.':
    'Ulituma hii kwenye M-Pesa au programu ya benki yako? Kuiweka hapa huhifadhi mpokeaji ili ukaguzi wa baadaye ukuambie mara ngapi umemlipa bila tatizo.',
  'What was this for?': 'Haya yalikuwa ya nini?',
  'Rent, stock for the shop, school fees…': 'Kodi, bidhaa za duka, karo…',
  'Optional. You can leave this empty and still log the payment.':
    'Si lazima. Unaweza kuiacha tupu na bado kuandika malipo.',
  "This log stays on your device. Amounts and notes are never shared with your family circle, and nothing here is sent to Dhibiti's servers.":
    'Kumbukumbu hii inabaki kwenye kifaa chako. Kiasi na maelezo hayashirikiwi na mduara wako wa familia, na hakuna kinachotumwa kwa seva za Dhibiti.',
  'Saved on this device. Next time you pay this recipient we will tell you how long you have been paying them without trouble.':
    'Imehifadhiwa kwenye kifaa hiki. Mara ijayo unapomlipa mpokeaji huyu tutakuambia muda gani umemlipa bila tatizo.',
  'See how to verify a merchant': 'Ona jinsi ya kuthibitisha mfanyabiashara',

  // Family tab
  'Protection you agree on together': 'Ulinzi mnaokubaliana pamoja',
  Invite: 'Karibisha',
  'You are protected by your circle': 'Unalindwa na mduara wako',
  'When Dhibiti flags something high risk for a protected member, you get an alert with what was detected and how to help. You never see their normal activity.':
    'Dhibiti inapoweka alama ya hatari kubwa kwa mwanachama anayelindwa, unapata tahadhari ya kilichobainika na jinsi ya kusaidia. Hauoni shughuli zake za kawaida.',
  'Your circle only sees high-risk events you have agreed to share. Nothing else about your messages or payments is visible to them.':
    'Mduara wako unaona matukio ya hatari kubwa uliyokubali kushiriki tu. Hakuna kingine kuhusu ujumbe au malipo yako kinachoonekana kwao.',
  'What you share': 'Unachoshiriki',
  'What they share': 'Anachoshiriki',
  'No one in your circle yet': 'Hakuna mtu kwenye mduara wako bado',
  'Invite a relative to be protected, or ask someone to look out for you. Both sides have to agree before anything is shared.':
    'Karibisha ndugu alindwe, au mwombe mtu akulinde. Pande zote mbili zinapaswa kukubali kabla kitu kushirikiwa.',
  'Invite someone': 'Karibisha mtu',
  'No alerts shared with you': 'Hakuna tahadhari zilizoshirikiwa nawe',
  'Alerts appear here only when Dhibiti flags something high risk for a member of your circle. Quiet is good news.':
    'Tahadhari zinaonekana hapa tu Dhibiti inapoweka alama ya hatari kubwa kwa mwanachama wa mduara wako. Ukimya ni habari nzuri.',
  'See all': 'Tazama zote',
  'No group circles yet': 'Hakuna miduara ya vikundi bado',
  'Chamas and SACCOs are common targets for people impersonating a treasurer. A group circle lets an official warn every member at once.':
    'Chama na SACCO ni malengo ya kawaida kwa watu wanaojifanya mtunza hazina. Mduara wa kikundi unamwezesha ofisa kutahadharisha kila mwanachama kwa wakati mmoja.',
  'Talking about money safety at home': 'Kuzungumzia usalama wa pesa nyumbani',
  'Short guides for agreeing on family rules before a scam arrives':
    'Miongozo mifupi ya kukubaliana kanuni za familia kabla utapeli kufika',

  // Family invite and member
  'We send a link by SMS. Nothing is shared until they install Dhibiti and choose what they are comfortable sharing.':
    'Tunatuma kiungo kwa SMS. Hakuna kinachoshirikiwa hadi asakinishe Dhibiti na achague anachostarehe kushiriki.',
  'What is their role?': 'Jukumu lake ni lipi?',
  'I want to look out for them — I get alerts when something high risk is flagged':
    'Nataka nimlinde — napata tahadhari kitu cha hatari kubwa kinapowekwa alama',
  'They look out for me — they get the alerts I choose to share':
    'Ananilinda — anapata tahadhari ninazochagua kushiriki',
  'Use the number they already use for M-Pesa so alerts reach the right person.':
    'Tumia namba anayotumia kwa M-Pesa ili tahadhari zimfikie mtu sahihi.',
  'Contacts are turned off': 'Anwani zimezimwa',
  'You can still invite people by typing their number. Turning contacts on only makes picking a relative faster.':
    'Bado unaweza kukaribisha watu kwa kuandika namba zao. Kuwasha anwani kunaharakisha kuchagua ndugu tu.',
  'Turn contacts on': 'Washa anwani',
  'Pick from contacts instead': 'Chagua kutoka anwani badala yake',
  'Dhibiti shares specific high-risk events only — never a feed of messages, calls or payments. Each person controls what leaves their own phone, and can change it any time.':
    'Dhibiti inashiriki matukio maalum ya hatari kubwa tu — sio orodha ya ujumbe, simu au malipo. Kila mtu anadhibiti kinachotoka kwenye simu yake, na anaweza kubadilisha wakati wowote.',
  'They will show as pending until they install Dhibiti and accept. You can change what is shared at any time from their member page.':
    'Ataonekana kama anasubiri hadi asakinishe Dhibiti na akubali. Unaweza kubadilisha kinachoshirikiwa wakati wowote kutoka ukurasa wake.',
  'Back to Family': 'Rudi kwa Familia',
  'Read the family guide': 'Soma mwongozo wa familia',
  'Contacts on this device': 'Anwani kwenye kifaa hiki',
  'In this build the contact list is mocked. Tap a name to fill in the invite.':
    'Katika toleo hili orodha ya anwani ni ya mfano. Gusa jina ili kujaza mwaliko.',
  Member: 'Mwanachama',
  'This member is no longer in your circle': 'Mwanachama huyu hayuko kwenye mduara wako tena',
  'They may have left, or the invite was withdrawn. You can invite them again at any time.':
    'Anaweza kuwa aliondoka, au mwaliko ulifutwa. Unaweza kumkaribisha tena wakati wowote.',
  'You get an alert when Dhibiti flags something high risk for them. You never see their normal messages, calls or payments.':
    'Unapata tahadhari Dhibiti inapoweka alama ya hatari kubwa kwake. Hauoni ujumbe, simu au malipo yake ya kawaida.',
  'They get the alerts you choose to share below, and can help you verify a caller or a payment destination.':
    'Anapata tahadhari unazochagua kushiriki hapa chini, na anaweza kukusaidia kuthibitisha mpigaji au mahali pa malipo.',
  Message: 'Tuma ujumbe',
  'Hold on high-risk payments': 'Zuia malipo ya hatari kubwa',
  'When a payment is flagged high risk, the confirm button is held for this long so there is time to verify. It never stops them from calling anyone during the wait.':
    'Malipo yanapowekwa alama ya hatari kubwa, kitufe cha kuthibitisha kinazuiliwa kwa muda huu ili kuwe na wakati wa kuhakikisha. Hakumzuii kumpigia yeyote wakati wa kusubiri.',
  'They can confirm immediately after reading the warning.':
    'Anaweza kuthibitisha mara moja baada ya kusoma tahadhari.',
  'Shared alerts': 'Tahadhari zilizoshirikiwa',
  'Nothing has been shared': 'Hakuna kilichoshirikiwa',
  'Alerts only appear for specific high-risk events. A quiet page means nothing risky has been flagged.':
    'Tahadhari zinaonekana kwa matukio maalum ya hatari kubwa tu. Ukurasa tulivu unamaanisha hakuna hatari iliyowekwa alama.',

  // Family safety guide
  'Agree the rules before a scam arrives': 'Kubalianeni kanuni kabla utapeli kufika',
  'Start from respect, not blame': 'Anza kwa heshima, sio lawama',
  'These scams are written to catch anyone, including people who are careful. Families that talk about it openly lose far less money than families where it feels shameful to ask.':
    'Utapeli huu umeandikwa kunasa yeyote, hata watu waangalifu. Familia zinazozungumza wazi zinapoteza pesa kidogo sana kuliko familia ambazo kuuliza kunaonekana aibu.',
  'Three rules worth agreeing on': 'Kanuni tatu zinazofaa kukubaliwa',
  'We always call back on a saved number': 'Tunapiga simu kwa namba iliyohifadhiwa kila mara',
  'Nobody in the family acts on a request that arrives from an unknown number, even if the voice or name matches.':
    'Hakuna mtu katika familia anayetekeleza ombi linalotoka namba isiyojulikana, hata kama sauti au jina linalingana.',
  'We agree on a family code word': 'Tunakubaliana neno la siri la familia',
  'Used only for real emergencies. A caller who cannot say it does not get money, no matter how urgent they sound.':
    'Linatumika kwa dharura halisi tu. Mpigaji asiyeweza kulisema hapati pesa, hata akionekana wa haraka kiasi gani.',
  'Checking first is never a bother': 'Kukagua kwanza si usumbufu',
  'Anyone can pause and ask before sending money. Nobody is made to feel careless for asking.':
    'Yeyote anaweza kusimama na kuuliza kabla ya kutuma pesa. Hakuna anayefanywa ajione mzembe kwa kuuliza.',
  'Short lessons': 'Masomo mafupi',

  // Group circles
  'One warning reaches everyone': 'Tahadhari moja inawafikia wote',
  'Scammers copy the name of a treasurer or chairperson and ask members to contribute to a new Paybill. A group circle lets an official send one verified warning to every member, and lets members flag a message claiming to be official business.':
    'Matapeli wanakopi jina la mtunza hazina au mwenyekiti na kuwaomba wanachama wachangie kwa Paybill mpya. Mduara wa kikundi unamwezesha ofisa kutuma tahadhari moja iliyothibitishwa kwa kila mwanachama, na unawawezesha wanachama kuweka alama ujumbe unaodai kuwa shughuli rasmi.',
  'Create one for your chama or SACCO and invite the members you already collect contributions from.':
    'Anzisha mmoja kwa chama au SACCO yako na uwakaribishe wanachama unaowakusanya michango.',
  'For a chama or SACCO': 'Kwa chama au SACCO',
  'Use the name members already know, so a warning from Dhibiti is recognised.':
    'Tumia jina wanachama wanalijua, ili tahadhari kutoka Dhibiti itambulike.',
  'What kind of group is it?': 'Ni kikundi cha aina gani?',
  'An informal savings or merry-go-round group collecting contributions between members':
    'Kikundi cha akiba au mzunguko kinachokusanya michango kati ya wanachama',
  'A registered savings and credit society with officials and member accounts':
    'Chama cha akiba na mikopo kilichosajiliwa chenye viongozi na akaunti za wanachama',
  "A group circle carries warnings only. Dhibiti never sees contributions, member balances or the group account, and members never see each other's payments.":
    'Mduara wa kikundi unabeba tahadhari tu. Dhibiti haioni michango, salio za wanachama au akaunti ya kikundi, na wanachama hawaoni malipo ya wenzao.',
  'Create group circle': 'Anzisha mduara wa kikundi',
  'Group circle': 'Mduara wa kikundi',
  'This group circle no longer exists': 'Mduara huu wa kikundi haupo tena',
  'It may have been closed by its official. You can create a new one for your chama or SACCO.':
    'Unaweza kuwa ulifungwa na ofisa wake. Unaweza kuanzisha mpya kwa chama au SACCO yako.',
  'You are an official — you can send warnings': 'Wewe ni ofisa — unaweza kutuma tahadhari',
  'You receive warnings from the officials': 'Unapokea tahadhari kutoka kwa viongozi',
  'Send a warning when you hear of a scam targeting this group — for example someone using your name to ask for contributions to a new Paybill.':
    'Tuma tahadhari unaposikia utapeli unaolenga kikundi hiki — kwa mfano mtu anayetumia jina lako kuomba michango kwa Paybill mpya.',
  'If you get a message claiming to be official group business, check it in Shield first. Officials never change the contribution number by SMS or WhatsApp alone.':
    'Ukipata ujumbe unaodai kuwa shughuli rasmi ya kikundi, ukague kwenye Ngao kwanza. Viongozi hawabadilishi namba ya michango kwa SMS au WhatsApp peke yake.',
  'Flag a message claiming to be official': 'Weka alama ujumbe unaodai kuwa rasmi',
  "Members see group warnings and each other's names only. Contributions, balances and personal checks are never shared with the group.":
    'Wanachama wanaona tahadhari za kikundi na majina ya wenzao tu. Michango, salio na ukaguzi wa kibinafsi hayashirikiwi na kikundi.',
  'Warnings sent to this group': 'Tahadhari zilizotumwa kwa kikundi hiki',
  'No warnings yet': 'Hakuna tahadhari bado',
  'When you hear of a scam aimed at this group, send one warning so every member sees the same clear message.':
    'Unaposikia utapeli unaolenga kikundi hiki, tuma tahadhari moja ili kila mwanachama aone ujumbe mmoja ulio wazi.',
  'Officials have not needed to warn the group yet. You will get a notification when they do.':
    'Viongozi hawajahitaji kutahadharisha kikundi bado. Utapata taarifa wakifanya hivyo.',
  'They get an SMS invite. They show as pending until they install Dhibiti and accept.':
    'Anapata mwaliko wa SMS. Anaonekana kama anasubiri hadi asakinishe Dhibiti na akubali.',
  'They will appear as pending in the member list. Nothing is shared with them until they accept.':
    'Ataonekana kama anasubiri kwenye orodha ya wanachama. Hakuna kinachoshirikiwa naye hadi akubali.',
  'Someone is impersonating an official': 'Mtu anajifanya ofisa',
  'Messages claiming to be from the treasurer are asking for a new Paybill':
    'Ujumbe unaodai kutoka mtunza hazina unaomba Paybill mpya',
  'A fake group link is going round': 'Kiungo cha kikundi cha kughushi kinazunguka',
  'A link claiming to be the group meeting or register is collecting ID and PIN details':
    'Kiungo kinachodai kuwa mkutano au daftari la kikundi kinakusanya namba ya kitambulisho na PIN',
  'Members are being rushed to pay today': 'Wanachama wanashinikizwa kulipa leo',
  'Members are being pressured to send contributions immediately':
    'Wanachama wanashinikizwa kutuma michango mara moja',
  'Pick a group first': 'Chagua kikundi kwanza',
  'Open the group circle you want to warn, then choose Send a warning.':
    'Fungua mduara wa kikundi unaotaka kutahadharisha, kisha chagua Tuma tahadhari.',
  'See your group circles': 'Tazama miduara yako ya vikundi',
  'Start from a common pattern': 'Anza kutoka mfumo wa kawaida',
  'Members see the warning, the reason, and the same suggested action: do not pay a new Paybill or number, and confirm with an official on a saved number.':
    'Wanachama wanaona tahadhari, sababu, na hatua moja inayopendekezwa: usilipe Paybill au namba mpya, na hakikisha na ofisa kwa namba iliyohifadhiwa.',
  'Warning headline': 'Kichwa cha tahadhari',
  'One plain sentence describing what is happening.':
    'Sentensi moja rahisi inayoeleza kinachotokea.',
  'What members should know and do': 'Wanachama wanapaswa kujua na kufanya nini',
  'Explain what you have seen, confirm what has not changed, and tell members who to call to confirm.':
    'Eleza ulichoona, thibitisha kisichobadilika, na waambie wanachama wampigie nani kuhakikisha.',
  'Dhibiti sends only the text you write here. Member names, contributions and their own checks are never included in a group warning.':
    'Dhibiti inatuma maandishi unayoandika hapa tu. Majina ya wanachama, michango na ukaguzi wao hayawekwi kwenye tahadhari ya kikundi.',
  'Every member now sees the same alert with your reason and the suggested action. You did the right thing by warning them early — members who know the pattern are much harder to trick.':
    'Kila mwanachama sasa anaona tahadhari moja na sababu yako na hatua inayopendekezwa. Ulifanya jambo sahihi kwa kuwatahadharisha mapema — wanachama wanaojua mfumo ni vigumu kudanganywa.',
  'Back to the group': 'Rudi kwa kikundi',

  // More tab
  'Your score grows when you check something before acting, report a scam, or practise spotting one. It is private to you — there is no leaderboard and no one else sees it.':
    'Alama yako inaongezeka unapokagua kitu kabla ya kutenda, kuripoti utapeli, au kufanya mazoezi ya kuutambua. Ni yako binafsi — hakuna orodha ya washindi na hakuna mwingine anayeiona.',
  'App language': 'Lugha ya programu',
  'Switch between English and Kiswahili at any time. Quoted messages, names and numbers are always shown exactly as they were received.':
    'Badilisha kati ya Kiingereza na Kiswahili wakati wowote. Ujumbe uliokaririwa, majina na namba zinaonyeshwa kama zilivyopokelewa.',
  'Save the people you would call before sending money':
    'Hifadhi watu ambao ungewapigia kabla ya kutuma pesa',
  'Short lessons on scam patterns, mobile money, banks and your rights':
    'Masomo mafupi kuhusu mifumo ya utapeli, pesa za mkononi, benki na haki zako',
  'Classify real, redacted messages and see the answer straight away':
    'Panga ujumbe halisi uliofichwa taarifa na uone jibu mara moja',
  'Paste and check a message in one tap, straight from your home screen':
    'Weka na kagua ujumbe kwa mbofyo mmoja, moja kutoka skrini yako ya nyumbani',
  'What we do, what we deliberately do not claim, and how to reach us':
    'Tunachofanya, tusichodai kwa makusudi, na jinsi ya kutufikia',
  'Turn this on to see how every flow behaves offline. Rule checks still run on your device; community report data is paused.':
    'Washa hii kuona kila mtiririko unavyofanya kazi bila mtandao. Ukaguzi wa kanuni bado unaendelea kwenye kifaa chako; data ya ripoti za jamii imesimamishwa.',

  // Profile and privacy
  'Phone number · verified by one-time code':
    'Namba ya simu · imethibitishwa kwa msimbo wa mara moja',
  'No email added': 'Hakuna barua pepe iliyoongezwa',
  'Backup sign-in method': 'Njia ya akiba ya kuingia',
  'Optional backup if you change your phone number':
    'Akiba si lazima ikiwa unabadilisha namba yako ya simu',
  County: 'Kaunti',
  'Used only to show scam trends near you. We store the county, never your exact location.':
    'Inatumika kuonyesha mwelekeo wa utapeli karibu nawe tu. Tunahifadhi kaunti, sio mahali pako halisi.',
  'What your circle can see': 'Mduara wako unaweza kuona nini',
  'Your sharing level': 'Kiwango chako cha kushiriki',
  'You chose this, and you can change it whenever you like. Nothing is shared retroactively.':
    'Ulichagua hii, na unaweza kuibadilisha wakati wowote. Hakuna kinachoshirikiwa kwa nyuma.',
  'Change sharing level': 'Badilisha kiwango cha kushiriki',
  'Where your information lives': 'Taarifa zako zinakaa wapi',
  'Stays on this device': 'Inabaki kwenye kifaa hiki',
  'Messages and call descriptions you paste, screenshots you attach, your check history and your scan history. Rule checks run here, on your phone.':
    'Ujumbe na maelezo ya simu unayoweka, picha za skrini unazoambatisha, historia yako ya ukaguzi na ya uchanganuzi. Ukaguzi wa kanuni unafanyika hapa, kwenye simu yako.',
  'Shared with your family or group circle': 'Inashirikiwa na mduara wako wa familia au kikundi',
  'Only the high-risk events at the sharing level you chose. Your circle never sees your normal messages, contacts or day-to-day payments.':
    'Matukio ya hatari kubwa kwa kiwango cha kushiriki ulichochagua tu. Mduara wako hauoni ujumbe wako wa kawaida, anwani au malipo ya kila siku.',
  'Never leaves this device': 'Haiondoki kwenye kifaa hiki kamwe',
  'PINs, passwords and full ID numbers. Dhibiti never asks for them, and no screen in this app will accept them.':
    'PIN, manenosiri na namba kamili za kitambulisho. Dhibiti haiziombi kamwe, na hakuna skrini katika programu hii itakayozipokea.',
  'Shared only when you report': 'Inashirikiwa unaporipoti tu',
  'If you submit a report, we send the identifier (number, Paybill or domain) and the scam pattern. Names, phone contacts and photos are removed first.':
    'Ukituma ripoti, tunatuma kitambulisho (namba, Paybill au kikoa) na mfumo wa utapeli. Majina, anwani za simu na picha huondolewa kwanza.',
  'No screen in Dhibiti will ever ask for your M-Pesa PIN, a bank password or a verification code. If anything claiming to be Dhibiti asks, it is not us.':
    'Hakuna skrini katika Dhibiti itakayoomba PIN yako ya M-Pesa, nenosiri la benki au msimbo wa uthibitisho. Kitu chochote kinachodai kuwa Dhibiti kikiomba, si sisi.',
  'The people Dhibiti suggests you call before money moves':
    'Watu Dhibiti inapendekeza uwapigie kabla pesa kuhama',
  'Delete check and scan history': 'Futa historia ya ukaguzi na uchanganuzi',
  'History deleted from this device.': 'Historia imefutwa kwenye kifaa hiki.',
  'Deleting your history removes it from this device. Reports you already submitted stay in the community data, without your name attached.':
    'Kufuta historia yako kunaiondoa kwenye kifaa hiki. Ripoti ulizotuma zinasalia kwenye data ya jamii, bila jina lako.',
  'Delete your history?': 'Futa historia yako?',
  'Your checks and scans are removed from this device. This cannot be undone.':
    'Ukaguzi na uchanganuzi wako unaondolewa kwenye kifaa hiki. Hii haiwezi kurudishwa.',

  // Permissions
  'You decide what Dhibiti can reach': 'Wewe unaamua Dhibiti ifikie nini',
  'Every permission is explained in plain language, and Dhibiti keeps working without any of them. Turning one off never leaves you stuck.':
    'Kila ruhusa inaelezwa kwa lugha rahisi, na Dhibiti inaendelea kufanya kazi bila yoyote. Kuzima moja hakukuachi ukwama.',
  Contacts: 'Anwani',
  'So you can save trusted contacts and call the real person instead of the number that called you.':
    'Ili uweze kuhifadhi watu unaowaamini na kumpigia mtu halisi badala ya namba iliyokupigia.',
  'You can still add trusted contacts by typing their number in yourself.':
    'Bado unaweza kuongeza watu unaowaamini kwa kuandika namba zao mwenyewe.',
  'Add a contact manually': 'Ongeza anwani mwenyewe',
  Notifications: 'Taarifa',
  'So we can warn you about a high-risk number or message, and alert your family circle.':
    'Ili tuweze kukutahadharisha kuhusu namba au ujumbe wa hatari kubwa, na kutahadharisha mduara wako wa familia.',
  'Warnings only appear while the app is open, and family alerts wait until you come back.':
    'Tahadhari zinaonekana tu programu ikiwa wazi, na tahadhari za familia zinasubiri hadi urejee.',
  Camera: 'Kamera',
  'So you can scan a QR code before you pay or open a link. Images are checked on your device.':
    'Ili uweze kuchanganua msimbo QR kabla ya kulipa au kufungua kiungo. Picha zinakaguliwa kwenye kifaa chako.',
  'You can import a QR screenshot from your gallery, or type the Paybill or link instead.':
    'Unaweza kuingiza picha ya QR kutoka ghala lako, au kuandika Paybill au kiungo badala yake.',
  'Look up a number or Paybill': 'Tafuta namba au Paybill',
  'Messages (Android)': 'Ujumbe (Android)',
  'So suspicious SMS can be held in your quarantine inbox for review. Nothing is deleted, and one-time codes are never blocked.':
    'Ili SMS zenye shaka ziwekwe kwenye kikapu chako cha karantini kwa ukaguzi. Hakuna kinachofutwa, na misimbo ya mara moja haizuiliwi.',
  'Paste a message or share it to Dhibiti when something looks off.':
    'Weka ujumbe au ushiriki kwa Dhibiti kitu kinapoonekana si sawa.',
  'Currently off.': 'Imezimwa kwa sasa.',
  'Not set yet.': 'Haijawekwa bado.',
  'Screenshots and pasted messages stay on your device by default. They only leave it if you choose to submit a report, and personal details are removed first.':
    'Picha za skrini na ujumbe uliowekwa unabaki kwenye kifaa chako kwa kawaida. Vinaondoka tu ukichagua kutuma ripoti, na taarifa binafsi huondolewa kwanza.',

  // Literacy library
  All: 'Zote',
  'Reversal, Paybill, prize, SIM swap…': 'Urejeshwaji, Paybill, zawadi, kubadilisha SIM…',
  'No lessons match that': 'Hakuna masomo yanayolingana',
  'Try a different word, or clear the filters to see everything in the library.':
    'Jaribu neno lingine, au safisha vichujio kuona kila kitu kwenye maktaba.',
  'Longer reads live here on purpose. When something high risk happens, Dhibiti shows you a 60-second explainer instead — never a ten-minute article in the middle of a decision.':
    'Masomo marefu yanakaa hapa kwa makusudi. Kitu cha hatari kubwa kinapotokea, Dhibiti inakuonyesha maelezo ya sekunde 60 badala yake — sio makala ya dakika kumi katikati ya uamuzi.',

  // Scam simulator
  'No practice messages yet': 'Hakuna ujumbe wa mazoezi bado',
  'Practice rounds are built from real, redacted examples. As soon as the library has some, they appear here.':
    'Raundi za mazoezi zinatokana na mifano halisi iliyofichwa taarifa. Mara maktaba ipatapo, zitaonekana hapa.',
  'Back to the library': 'Rudi kwa maktaba',
  'This is a scam': 'Huu ni utapeli',
  'Do not answer, reply, click or pay.': 'Usipokee, usijibu, usibofye wala usilipe.',
  'Needs verifying first': 'Inahitaji kuhakikishwa kwanza',
  'Could be real, but only after checking on a number you already trust.':
    'Inaweza kuwa halisi, lakini baada ya kukagua kwa namba unayoiamini.',
  'No known risk': 'Hakuna hatari inayojulikana',
  'Nothing in it matches a known scam pattern.':
    'Hakuna kilicholingana na mfumo wa utapeli unaojulikana.',
  'Every one correct. You already read these patterns quickly — that is exactly the reflex that keeps money safe.':
    'Zote sahihi. Unasoma mifumo hii haraka — hiyo ndiyo hasa tabia inayolinda pesa.',
  'Solid round. The ones you missed are the patterns worth reading about — nobody spots all of them at first.':
    'Raundi nzuri. Zile ulizokosa ni mifumo inayofaa kusoma — hakuna anayeitambua yote mwanzoni.',
  'These messages are built to fool anyone, and getting them wrong here costs nothing. Now you know the patterns to watch for.':
    'Ujumbe huu umeundwa kudanganya yeyote, na kukosea hapa hakugharimu kitu. Sasa unajua mifumo ya kuangalia.',
  'Your safety score went up. It stays private to you — no leaderboard, no other names.':
    'Alama yako ya usalama imeongezeka. Inabaki yako binafsi — hakuna orodha ya washindi, hakuna majina mengine.',
  'Keep going': 'Endelea',
  'Practice is one habit. Checking before you act is the other — and that is the one that actually stops a payment.':
    'Mazoezi ni tabia moja. Kukagua kabla ya kutenda ni nyingine — na hiyo ndiyo inayozuia malipo kwa kweli.',
  'Read a lesson on these patterns': 'Soma somo kuhusu mifumo hii',
  'Message received': 'Ujumbe uliopokelewa',
  'What would you do?': 'Ungefanya nini?',
  'You called it right': 'Ulitambua sawasawa',
  'Worth a second look': 'Inafaa kuangaliwa tena',
  'What to do with a message like this': 'La kufanya na ujumbe kama huu',
  'Nothing here is sent anywhere. These are real messages with the personal details removed.':
    'Hakuna kinachotumwa mahali popote hapa. Huu ni ujumbe halisi ambao taarifa binafsi zimeondolewa.',

  // Widget mockup
  'One tap, from anywhere': 'Mbofyo mmoja, kutoka mahali popote',
  'The moment you most need to check something is the moment you least feel like opening an app. The widget and the share action both land straight on the paste-and-check screen.':
    'Wakati unaohitaji kukagua kitu zaidi ni wakati unaotaka kufungua programu kidogo. Kijizana na kitendo cha kushiriki vinakufikisha moja kwenye skrini ya kuweka na kukagua.',
  'Small widget': 'Kijizana kidogo',
  'Check a message before you act': 'Kagua ujumbe kabla ya kutenda',
  'Paste & Check': 'Weka na Kagua',
  'Medium widget': 'Kijizana cha wastani',
  'Something feels off? Check it first.': 'Kitu hakikaa sawa? Kagua kwanza.',
  'How to add it': 'Jinsi ya kukiweka',
  'Press and hold your home screen': 'Bonyeza na ushikilie skrini yako ya nyumbani',
  'Then choose Widgets, and scroll to Dhibiti.': 'Kisha chagua Widgets, na sogeza hadi Dhibiti.',
  'Pick the small or medium size': 'Chagua ukubwa mdogo au wa wastani',
  'Small gives you Paste & Check. Medium adds Scan QR beside it.':
    'Kidogo kinakupa Weka na Kagua. Wastani kinaongeza Changanua QR pembeni.',
  'Place it where your thumb lands': 'Kiweke pale kidole chako kinafikia',
  'Next to your messaging app is the most useful spot — that is where the risky message arrives.':
    'Pembeni ya programu yako ya ujumbe ni sehemu bora — huko ujumbe wa hatari unafika.',
  'Works from WhatsApp, Messages, your browser and email':
    'Inafanya kazi kutoka WhatsApp, Messages, kivinjari chako na barua pepe',
  'Long-press any message, choose Share, then Dhibiti. We cannot read your WhatsApp messages — end-to-end encryption means nothing reaches us until you share it yourself. What we can do is warn you before you act on one.':
    'Bonyeza ujumbe wowote kwa muda, chagua Share, kisha Dhibiti. Hatuwezi kusoma ujumbe wako wa WhatsApp — usimbaji fiche kutoka mwanzo hadi mwisho unamaanisha hakuna kinachotufikia hadi ushiriki mwenyewe. Tunachoweza ni kukutahadharisha kabla ya kutenda.',
  'Open Paste & Check now': 'Fungua Weka na Kagua sasa',

  // About
  'Detect scams. Verify contacts. Protect your money and your family.':
    'Baini utapeli. Hakikisha anwani. Linda pesa yako na familia yako.',
  'Why we exist': 'Kwa nini tuko',
  'Most scams do not succeed because the technology is clever. They succeed because someone is pushed to act fast, in secret, before they can check anything.':
    'Utapeli mwingi haufanikiwi kwa sababu teknolojia ni werevu. Unafanikiwa kwa sababu mtu anashinikizwa kutenda haraka, kwa siri, kabla ya kukagua kitu.',
  'Dhibiti puts verification back at the exact moment money is about to move: what the message really is, who is really contacting you, who you should call instead, and what you can do to stop the payment.':
    'Dhibiti inaweka uthibitisho wakati ule pesa inakaribia kuhama: ujumbe ni nini kwa kweli, ni nani anayekutafuta kwa kweli, umpigie nani badala yake, na unaweza kufanya nini kuzuia malipo.',
  'What we do not claim': 'Tusichodai',
  'We cannot tell you a voice is AI-generated. Phone audio is compressed and that kind of detection is unreliable, so we look at what the caller asked you to do instead.':
    'Hatuwezi kukuambia sauti imetengenezwa na AI. Sauti ya simu inabanwa na ubainishaji wa aina hiyo hauaminiki, hivyo tunaangalia aliyekuomba ufanye nini badala yake.',
  'We cannot see your WhatsApp messages before they reach you. WhatsApp is end-to-end encrypted. We warn you about a suspicious message once you share it with us.':
    'Hatuwezi kuona ujumbe wako wa WhatsApp kabla kukufikia. WhatsApp ina usimbaji fiche kutoka mwanzo hadi mwisho. Tunakutahadharisha kuhusu ujumbe wenye shaka ukiushiriki nasi.',
  '"No known risk found" is not "safe". A number can be unreported and still be used by a scammer today.':
    '"Hakuna hatari inayojulikana" si "salama". Namba inaweza kutoripotiwa na bado itumiwe na mtapeli leo.',
  'We never block your one-time codes, and we never delete a message. Anything held for review sits in your quarantine inbox until you decide.':
    'Hatuzuii misimbo yako ya mara moja, na hatufuti ujumbe. Chochote kinachozuiliwa kwa ukaguzi kinabaki kwenye kikapu chako cha karantini hadi uamue.',
  'Get in touch': 'Wasiliana nasi',
  'Email support': 'Barua pepe ya usaidizi',
  'Report abuse of Dhibiti': 'Ripoti matumizi mabaya ya Dhibiti',
  'Someone using our name to ask for a PIN, a code or a payment':
    'Mtu anayetumia jina letu kuomba PIN, msimbo au malipo',
  'Report a scam you received': 'Ripoti utapeli uliopokea',
  'Adds to the community data that protects everyone else nearby':
    'Inaongeza kwenye data ya jamii inayolinda kila mtu karibu',
  Policies: 'Sera',
  'Privacy in one paragraph': 'Faragha kwa aya moja',
  'Terms in one paragraph': 'Masharti kwa aya moja',
  'Built with community reports from people like you.':
    'Imeundwa kwa ripoti za jamii kutoka watu kama wewe.',

  // Lesson screen
  'This lesson is no longer available': 'Somo hili halipo tena',
  'Browse the literacy library for the full set of short explainers.':
    'Pitia maktaba ya mafunzo kwa maelezo mafupi yote.',
  'Open the library': 'Fungua maktaba',
  'What to remember': 'La kukumbuka',
  'Real example, with personal details removed.': 'Mfano halisi, taarifa binafsi zimeondolewa.',
  'This scam is designed to trick anyone. Knowing the pattern is what makes you much harder to scam next time.':
    'Utapeli huu umeundwa kudanganya yeyote. Kujua mfumo ni kinachokufanya uwe vigumu kudanganywa tena.',

  // Scam radar
  'All patterns': 'Mifumo yote',
  Everywhere: 'Kila mahali',
  'Nothing reported for this filter': 'Hakuna kilichoripotiwa kwa kichujio hiki',
  'No reports match this pattern or area in the last 24 hours. That is not a guarantee — treat anything unexpected as unverified.':
    'Hakuna ripoti zinazolingana na mfumo au eneo hili katika saa 24 zilizopita. Hiyo si dhamana — chukulia chochote usichotarajia kama hakithibitishwa.',
  'Show everything': 'Onyesha kila kitu',
  'These are patterns reported by other people in the last 24 hours. No names, numbers or amounts are shared — only the pattern and the rough area.':
    'Hii ni mifumo iliyoripotiwa na watu wengine katika saa 24 zilizopita. Hakuna majina, namba au kiasi kinachoshirikiwa — mfumo na eneo la jumla tu.',
  'Read the 1-minute lesson': 'Soma somo la dakika 1',
  'Many people in Kenya receive messages like these. Most are scams, and every report makes the next person harder to trick.':
    'Watu wengi Kenya wanapokea ujumbe kama huu. Wengi ni utapeli, na kila ripoti inamfanya mtu ajaye kuwa vigumu kudanganywa.',

  // Trusted contacts
  'Caller ID can be faked. A saved number cannot.':
    'Utambulisho wa mpigaji unaweza kughushiwa. Namba iliyohifadhiwa haiwezi.',
  'When a message or call claims to be from someone on this list, Dhibiti offers to call the number you saved — never the number that contacted you.':
    'Ujumbe au simu inapodai kutoka mtu kwenye orodha hii, Dhibiti inapendekeza kupiga namba uliyohifadhi — sio namba iliyokutafuta.',
  'Contacts access is off': 'Ufikiaji wa anwani umezimwa',
  'That is fine — you can add people by typing their number in yourself. Nothing is uploaded either way.':
    'Hakuna tatizo — unaweza kuongeza watu kwa kuandika namba zao mwenyewe. Hakuna kinachopakiwa vyovyote.',
  'Change permissions': 'Badilisha ruhusa',
  'You have not confirmed this number by speaking to them yet. Call once on a quiet day, so it is already checked when it matters.':
    'Hujathibitisha namba hii kwa kuzungumza naye. Piga mara moja siku tulivu, ili iwe imekaguliwa itakapohitajika.',
  'No trusted contacts yet': 'Hakuna watu unaowaamini bado',
  'Add the people you would call before sending money — a parent, a partner, your treasurer. Dhibiti will suggest calling them when a message claims to be from them.':
    'Ongeza watu ambao ungewapigia kabla ya kutuma pesa — mzazi, mwenzi, mtunza hazina wako. Dhibiti itapendekeza kuwapigia ujumbe unapodai kutoka kwao.',
  'Someone you would call first': 'Mtu ambaye ungempigia kwanza',
  'When a message claims to be from this person, Dhibiti offers this saved number instead of the one that contacted you.':
    'Ujumbe unapodai kutoka mtu huyu, Dhibiti inapendekeza namba hii iliyohifadhiwa badala ya ile iliyokutafuta.',
  Name: 'Jina',
  Relationship: 'Uhusiano',
  'Mother, brother, chama treasurer…': 'Mama, kaka, mtunza hazina wa chama…',
  'Phone number': 'Namba ya simu',
  'Type the number you already know is theirs, not one from a recent message.':
    'Andika namba unayojua ni yake, sio kutoka ujumbe wa hivi karibuni.',
  'I have spoken to them on this number and know it is really theirs':
    'Nimezungumza naye kwa namba hii na najua ni yake kweli',
  'Trusted contacts stay on this device. We do not upload your contact list, and this person is not notified that you saved them.':
    'Watu unaowaamini wanabaki kwenye kifaa hiki. Hatupakii orodha yako ya anwani, na mtu huyu haarifiwi kuwa umemhifadhi.',
  'Save contact': 'Hifadhi anwani',
  'Marked as confirmed. Dhibiti will offer this number whenever a message claims to be from them.':
    'Imewekwa kama iliyothibitishwa. Dhibiti itapendekeza namba hii kila ujumbe unapodai kutoka kwake.',
  'Saved as not yet confirmed. Call them once on a quiet day so the number is already checked when it matters.':
    'Imehifadhiwa kama haijathibitishwa. Mpigie mara moja siku tulivu ili namba iwe imekaguliwa itakapohitajika.',

  // Verified institutions
  'Call these numbers yourself': 'Piga namba hizi mwenyewe',
  'If someone calls claiming to be your bank, Safaricom or a government office, hang up and call the official number here. A caller ID or sender name can be faked; this directory cannot be edited by whoever contacted you.':
    'Mtu akipiga akidai kuwa benki yako, Safaricom au ofisi ya serikali, kata simu na upige namba rasmi hapa. Utambulisho wa mpigaji au jina la mtumaji linaweza kughushiwa; orodha hii haiwezi kubadilishwa na aliyekutafuta.',
  Bank: 'Benki',
  Banks: 'Benki',
  Telcos: 'Kampuni za simu',
  Government: 'Serikali',
  Merchant: 'Mfanyabiashara',
  Merchants: 'Wafanyabiashara',
  'Mobile network': 'Mtandao wa simu',
  'Nothing matches that name': 'Hakuna kinacholingana na jina hilo',
  'We only list institutions whose official numbers we have confirmed. If yours is missing, find the number on a statement, a card or the official website — never from the message that contacted you.':
    'Tunaorodhesha taasisi ambazo namba zao rasmi tumezithibitisha tu. Ikiwa yako haiko, tafuta namba kwenye taarifa ya akaunti, kadi au tovuti rasmi — sio kutoka ujumbe uliokutafuta.',

  // Shared feedback states
  'Checking this against known scam patterns and community reports…':
    'Tunakagua hii kwa mifumo ya utapeli inayojulikana na ripoti za jamii…',
  "Couldn't reach Dhibiti's servers": 'Hatukuweza kufikia seva za Dhibiti',
  'Check your connection and try again. Your input stays on this device in the meantime.':
    'Kagua mtandao wako na ujaribu tena. Ulichoweka kinabaki kwenye kifaa hiki kwa sasa.',
  'You are offline. Community report data may be out of date — rule checks still run on this device.':
    'Hauna mtandao. Data ya ripoti za jamii inaweza kuwa ya zamani — ukaguzi wa kanuni bado unaendelea kwenye kifaa hiki.',
  'Open permission settings': 'Fungua mipangilio ya ruhusa',
  'Oops!': 'Samahani!',
  "This screen doesn't exist.": 'Skrini hii haipo.',
  'Go to home screen!': 'Nenda skrini ya nyumbani!',

  // Counted lines. Ordered specific first: the first matching template wins.
  '{n} reports from {n} people · {x}': 'Ripoti {n} kutoka watu {n} · {x}',
  '{n} reports · {n} reporters': 'Ripoti {n} · waripoti {n}',
  '{n} reports · {x}': 'Ripoti {n} · {x}',
  '{n} of {n} read': 'Yamesomwa {n} kati ya {n}',
  '{n} of {n} allowed · change any of them at any time':
    'Zimeruhusiwa {n} kati ya {n} · badilisha yoyote wakati wowote',
  '{n} saved · call the real person, not the number that called you':
    'Zimehifadhiwa {n} · mpigie mtu halisi, sio namba iliyokupigia',
  '{n} checks stored on this device': 'Ukaguzi {n} umehifadhiwa kwenye kifaa hiki',
  'This reaches all {n} members as a high-risk alert':
    'Hii inawafikia wanachama wote {n} kama tahadhari ya hatari kubwa',
  'Send to {n} members': 'Tuma kwa wanachama {n}',
  '{n} shared events': 'Matukio {n} yaliyoshirikiwa',
  '{n} members': 'Wanachama {n}',
  '{n} saved': 'Zimehifadhiwa {n}',
  '{x} read': 'Kusoma kwa {x}',
};

type Template = { match: RegExp; value: string };

function escape(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

const TEMPLATES: Template[] = Object.entries(SW)
  .filter(([key]) => key.includes('{'))
  .map(([key, value]) => {
    const pattern = escape(key)
      .replaceAll(String.raw`\{n\}`, String.raw`(\d[\d,.]*)`)
      .replaceAll(String.raw`\{x\}`, '(.+?)');
    return { match: new RegExp(`^${pattern}$`), value };
  });

const cache = new Map<string, string>();

/** Translate one authored English string. Unknown strings stay in English. */
export function translate(text: string, language: Language): string {
  if (language === 'en' || text.length === 0) return text;

  const trimmed = text.trim();
  if (trimmed.length === 0) return text;

  const cached = cache.get(trimmed);
  if (cached !== undefined) return cached;

  let result = SW[trimmed];
  if (result === undefined) {
    for (const template of TEMPLATES) {
      const found = template.match.exec(trimmed);
      if (found) {
        let index = 0;
        result = template.value.replaceAll(/\{[nx]\}/g, () => {
          index += 1;
          return found[index] ?? '';
        });
        break;
      }
    }
  }

  const output = result ?? trimmed;
  cache.set(trimmed, output);
  return output;
}
