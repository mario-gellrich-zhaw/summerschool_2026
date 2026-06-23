# Student Tasks: Build an Agent-Based Credit Risk Model

Folder: `Agent_Based_Credit_Risk_Modeling/`

## Goal

Build your own interactive web app (or notebook-based simulation, if you prefer) for an agent-based credit risk model. The core idea: a lender extends loans to many borrower agents with different credit scores; each borrower repays (or fails to repay) a monthly amortized loan over time, and some borrowers default. Beyond that, the design is yours.

## Background

The term "credit risk" refers to the risk that a lender may not receive the owed principal and interest. The principal is the amount a consumer borrowed and has to pay back; interest is what the lender charges for lending the money. A borrower's credit risk can be summarized by the "five Cs" of credit (capacity, capital, character, collateral, conditions) — see the Investopedia article linked below. Lenders use a credit score derived from this kind of information to assess how likely a borrower is to default, and to compensate for that risk, borrowers with lower credit scores are usually charged higher interest rates than borrowers with higher credit scores.

## Your Freedom

- Pick any language, framework, and plotting/visualization library you like.
- Decide how exactly credit score maps to interest rate, how borrower behavior (repay vs. miss a payment) is simulated, and what happens after consecutive missed payments — as long as it stays true to the credit risk modeling idea (heterogeneous borrowers, amortized loans, a default mechanism).
- Decide which parameters to expose, how the UI looks, and how you present results.
- Decide whether and how to use an LLM for "AI-induced" borrower behavior (e.g. deciding whether a borrower pays late) — this is optional, not required.

You'll be graded on whether the model logic is correct, the app works, and you can explain and justify the decisions you made — not on following a specific recipe.

## Core Mechanics to Get Right

A reasonable agent-based credit risk model needs at least the following pieces, however you choose to implement them:

- **Borrower heterogeneity**: each borrower agent has its own credit score (e.g. drawn randomly from a range such as 50–100).
- **Lender pricing**: the interest rate a borrower is charged should depend on their credit score — lower score, higher rate (and vice versa).
- **Loan setup**: each borrower takes out a loan with some principal, a loan term (number of months/steps), and a monthly interest rate. The standard amortization formula gives a constant monthly payment for the life of the loan:

  $m = \dfrac{p \, r \, (1+r)^n}{(1+r)^n - 1}$

  where $p$ is the principal, $r$ is the monthly interest rate, $n$ is the number of months, and $m$ is the resulting monthly payment. Within that fixed payment, the split between interest and principal shifts over time: more of each early payment goes to interest, more of each later payment goes to principal.
- **Repayment over time**: at each simulation step (month), each borrower's balance is reduced according to the amortization schedule, provided they can pay.
- **Missed payments and default**: sometimes a borrower cannot make a payment. Decide how that probability is determined (e.g. a fixed/base probability, something that depends on the borrower's situation, or an LLM-based decision). If a borrower misses payments for some number of consecutive months (e.g. three in a row), treat that borrower as having defaulted: remove them from the model and treat their remaining balance as a loss to the lender.
- **Classes and methods**: a natural way to structure this (you're free to deviate) is three classes — a `Lender` with a method that turns a credit score into an interest rate; a `Borrower` agent holding its own state (credit score, interest rate, principal, balance, consecutive missed payments) with a `step()` method that handles one month's repayment attempt and updates that state; and a `CreditModel` that creates the borrower population and, on each `step()`, calls every borrower's `step()` and removes anyone who has defaulted.

## Example Loan Calculation

A small standalone snippet to get you started with the amortization formula above — check it against https://www.calculator.net/loan-calculator.html before building it into your agents:

```python
# Input
# p = loan amount (principle)
# r = monthly interest rate
# y = number of years
# n = total number of months

p = 100000
r = 0.05 / 12
y = 30
n = y*12

# Monthly loan
m = p * r * (1 + r)**n / ((1 + r)**n - 1)

# Summary of results
print(f"Principle: {p:.0f} USD")
print(f"Loan term: {y} years ({y*12} months)")
print(f"Interest rate: {r*12*100:.2f} %")
print(f"Monthly loan: {m:.2f} USD")
print(f"Annually loan: {m*12:.2f} USD")
print(f"Total interest over {y} years: {m*n - p:.2f} USD")
print(f"Principle plus interest over {y} years: {m*n:.2f} USD")
```

## What Your App Should Be Able to Do

Roughly, a user should be able to configure the model (e.g. number of borrowers, loan term, base default probability), run/step/reset the simulation, see how borrower balances evolve and who defaults, and track portfolio-level outcomes over time. How you implement and present this is up to you, but a useful app probably shows something like:

- the population of borrowers (credit scores, interest rates, balances) at a glance,
- how total outstanding balance and the number of active borrowers change over the loan term,
- which borrowers defaulted and when.

## Portfolio Metrics

At minimum, report some measure of how the loan portfolio performed, for example:

- **Defaulted loan share**: the fraction of total principal-plus-interest that was never recovered, due to defaults.
- **Profit / return**: e.g. `(total repaid − defaulted loan) − total principal lent`, optionally annualized (divide by `loan term in months / 12`) to get a return on investment (ROI).

You're free to define these precisely however makes sense for your model, as long as you can explain the definition.

## Sensitivity Analysis

Include some analysis of how portfolio outcomes change when you vary model parameters — for example, loan term (in months), base default probability, or number of borrowers. Form is your choice: heatmap, table, chart, notebook, or a panel inside the app. At minimum, report how the defaulted-loan share and/or ROI change as you vary at least one parameter.

## Suggested (Not Required) Approach

If you want a starting structure: build the simulation first without a UI (a `Lender`, a `Borrower`, and a model class that steps all borrowers each month is a reasonable starting point), check that interest rates, repayments, and defaults behave sensibly, then layer on visualization and controls, and finally the sensitivity analysis. Feel free to deviate if you have a better workflow.

## Sanity Checks Worth Doing

A few things worth confirming before you call it done: borrowers with lower credit scores should end up with higher interest rates (not lower); balances should generally trend toward zero over the loan term for borrowers who keep paying; a borrower who keeps missing payments should eventually be removed/defaulted rather than carried forever; resetting the model should give you a clean run; changing the number of borrowers or the loan term should visibly affect portfolio-level outcomes.

## Original Sources

The five Cs of credit (Investopedia):
https://www.investopedia.com/terms/f/five-c-credit.asp

Loan amortization calculator (for checking your monthly-payment formula):
https://www.calculator.net/loan-calculator.html
