# FoodNorm single-page Weebly calculator

Paste the entire `index.html` into one Weebly Embed Code block. It contains the household form, both result columns, styles, and all formulas. Remove the old separate result text/placeholders and old calculator script from that page to avoid duplicate displays.

Visitors add household members and calculate on the same page. No redirect, separate input page, or localStorage is needed. Editing members hides previous results until recalculation. Styles are scoped to the calculator and do not modify the Weebly footer or surrounding page.

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
