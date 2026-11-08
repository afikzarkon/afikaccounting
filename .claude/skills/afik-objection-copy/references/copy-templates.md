# Copy Templates

Fill-in structures for the surfaces that matter most. `{…}` = fill from product data or the student's state.
Every template ends with the objection it targets. Write 3 variants per surface, from different angles.

## 1. Home hero (door A + door B)
```
H1:   {category claim: practice, not reading}
       e.g. ״חשבונאות לומדים כשפותרים.״
Sub:  {the contrast with summaries} + {free proof}
       e.g. ״סיכום אומר מה כתוב בתקן. כאן פותרים שאלות מבחן, נופלים במלכודות לפני המבחן — ורואים בדיוק למה.״
CTA1: {door A} ״להתחיל מאפס — בחינם״
CTA2: {door B} ״יש לי מבחן ב־{IAS 16 / IAS 19 / מלאי}״
Micro: ״בלי כרטיס אשראי. הקורס הבסיסי פתוח כולו.״
```
Targets: O1, O5, O3.

## 2. WhatsApp share card (trap-share loop)
Constraints: image (1200×630, readable on a phone thumbnail) + one line + link. The preview text is the OG description.
```
Image:  the question stem, big, + ״{X}% נופלים כאן״ (only with real data) / ״רוב הסטודנטים נופלים כאן״ (only if true per our data)
Line:   ״נפלתי בזה. בואו נראה אתכם.״ / ״שאלה מהמבחן ב־{standard}. סעיף ב׳ הוא המלכודת.״
OG:     ״פותרים בלי הרשמה, ורואים מיד אם נפלתם.״
```
Targets: O1 (curiosity beats "I have the summary"), O5 (falling is normal).

## 3. Paywall after the free first lesson
```
Head:  ״סיימתם את שיעור 1 ב־{course}. {N−1} שיעורים נשארו.״    (N from catalog/pricing)
Body:  what's next, concretely: {next lesson title} · ״כל שיעור נגמר בשאלה ברמת מבחן״ · ״הטעויות שלכם נכנסות לחזרה״
Proof: {their own stats}: ״{k} תשובות נכונות, {t} מלכודות שזיהיתם״
CTA:   ״להמשיך ל{next lesson title}״  → /pricing?plan=courses&from=…
Risk:  ״ביטול בלחיצה מהפרופיל. הגישה נשארת עד סוף התקופה.״
Alt:   ״לא עכשיו — לחזור לחזרה היומית״ (neutral, never shaming)
```
Targets: O3, O2. Lead with continuation, not with the price.

## 4. Pricing page plan card
```
Name + one line (from PLANS in pricing.ts)
Price framing: {monthly} ⟶ also show {per-semester} equivalent if a semester pass exists
Includes: from PLANS[].includes (never re-typed)
FAQ (accordion, in this order): ״אפשר לבטל?״ · ״זה מתאים לקורס שלי?״ · ״מה בחינם?״ · ״מה ההבדל בין קורסים לקורסים+מבחנים?״ · ״יש חשבונית?״
```
Targets: O3, O4, O6.

## 5. Re-engagement (email / push), day 2 and day 6
```
Day 2 subject: ״{k} טעויות מאתמול מחכות לחזרה (2 דקות)״
Day 2 body:    one line + one button ״לחזרה״ → /review
Day 6 subject: ״{N} ימים למבחן ב־{standard}״  (only if they entered a date)  / ״השבוע: {next lesson title}״
Day 6 body:    progress so far + one tiny next step
```
Targets: O2. Max 1 message per 2 days; unsubscribe in one click; commercial-messaging consent rules apply (check Israeli anti-spam law requirements before sending marketing email/SMS).

## 6. Ambassador / TA script (spoken or posted in a group)
```
״היי, מי שמתכונן/ת ל{exam}: יש אתר עם קורס {standard} שבו פותרים שאלות מבחן ורואים איפה נופלים.
השיעור הראשון בחינם, וגם הקורס הבסיסי כולו. אני השתמשתי ב{what they used} — {one honest sentence}.
{personal link}״
```
Rules: ambassadors disclose they get free access (honest endorsement). No scripted fake enthusiasm.
Targets: O1, O4.

## 7. Short-form video hook (TikTok/Reels, ≤ 3 s hook)
```
Hook:   ״השאלה הזאת הפילה חצי מהשכבה״ (only if true) / ״המלכודת הכי נפוצה ב־IAS 16, ב־20 שניות״
Body:   the tempting wrong answer → why it's tempting → the right one (screen recording of the trap)
CTA:    ״השאלה המלאה בלינק. בלי הרשמה.״
```
Targets: O1, O5.
