# FoodNorm Weebly results embed

Paste the complete contents of `index.html` into the results page's Embed Code block, beneath the result text. The page must include the existing `[foodNormActive]`, `[foodNormSed]`, `[basketsActive]`, `[basketsSed]`, `[lowActive]`, `[lowSed]`, `[highActive]`, and `[highSed]` placeholders.

The script reads `people` from localStorage as an array of `{age, sex}` objects; sex is `male` or `female` and age is in completed years.

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
