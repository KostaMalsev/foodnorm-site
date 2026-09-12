# FoodNorm Weebly results script

`foodnorm.js` is the single deployable file: plain JavaScript with no HTML or script tags.

Replace the previous calculator script in the existing results page's Custom HTML block with the contents of `foodnorm.js` inside a single `<script>...</script>` block. Publish the page, enter a household on the site's original input page, then open the results page.

Keep the existing Weebly text and these placeholders: `[foodNormActive]`, `[foodNormSed]`, `[basketsActive]`, `[basketsSed]`, `[lowActive]`, `[lowSed]`, `[highActive]`, `[highSed]`. This script fills those labels directly; it does not insert a second calculator or require new HTML. Remove any extra embed block containing the earlier standalone calculator.

The script reads the existing `localStorage.people` array of `{age, sex}` objects (sex: `male` or `female`). Missing or invalid household data returns the visitor to `/`, as in the original site. Text-node replacement preserves the page's layout and event handlers. The script does not alter the Weebly footer.

## Household thresholds

Coefficients are copied from `KostaMalsev/economic_food`, `run.py`, commit `48ee462`. For each activity scenario:

- Predicted food expenditure = lower regression intercept + sum of coefficients times household member counts.
- ZL = 2 × household FoodNorm − predicted food expenditure.
- ZU = upper regression intercept + sum of coefficients times household member counts.

The lower transformation applies to both active and sedentary scenarios, following the methodology in `סיכום8_12_24.docx`, pages 2–3. The original Python sedentary branch omitted it.

Each intercept is added once per household. Values are household totals in the original model price basis, not per-capita values or inflation-adjusted 2026 estimates.

Regression age groups are 0–4, 5–9, 10–14, 15–17, 18–29, 30–49 and 50+. This implementation maps the source's min1 to male and min2 to female; confirm that coding against the original survey codebook before publication. Calorie age groups and FoodNorm calculation are preserved. In particular, the existing FoodNorm calculation excludes children younger than two, while the regression has a 0–4 group; estimates for such households require methodological review.

The sedentary lower regression is singular in the original report. These coefficients reproduce that model; adding them does not resolve its statistical limitations. No clipping of negative estimates or reordering of thresholds is performed.

## Verification

Run `node tests/thresholds.cjs` from the repository root. Checks cover a known household, every regression age boundary, and integration with the original FoodNorm calculation.
