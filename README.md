# sui-margin-trading
n3xus

frontend setup --> frontend/README

backend setup ?

TODO:
- add pool assets: USDC, SUI
- lending pool: depositing and withdrawing to/from vault
- interest accrues to entire pool and distributes to lenders based on when they deposited
- interest index: every borrower/lender starts at 1 when they open/deposit. the interest index ticks up every block based on borrowers' interest
- utilisation cap: 80% 
- APY rates: 
    - utlisation : APY
    - 0-10% : very low
    - 20-40% : low-medium
    - 40-70% : medium-high
    - 70-80% : very high
- utlisation -- affects --> APY -- affects --> interest
- add collateral supported assets: USDC
- borrower functionality:
    - pyth integration for fetching prices
    - deepbook integration for executing trades
    - health factor calculations
    - liquidation mechanism