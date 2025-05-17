module vault::vault {
    use sui::coin::{Self, Coin, value, zero, join, split};
    use sui::object::{Self, UID};
    use sui::table::{Self, Table};
    use sui::sui::SUI;
    use borrower_funds::borrower_funds::Vault as BorrowerVault;
    use borrower_funds::borrower_funds::deposit as deposit_borrower_funds;
    use borrower_funds::borrower_funds::withdraw as withdraw_borrower_funds;
    use collateral::reserve::Vault_USDC;
    use collateral::reserve::collateral_balance_of;
    
    public struct Vault_SUI has key, store {
        id: UID,
        pool: Coin<SUI>,
        total_deposits: u128,
        balances: Table<address, u128>,
        debts: Table<address, u128>,
    }

    // total_deposits = total_liquidity + borrowed amount
    // utilisation ratio = 1 - (total_liquidity / total_deposits)
    fun init(ctx: &mut TxContext) {
        let vault = Vault_SUI {
            id: object::new(ctx),
            pool: zero<SUI>(ctx),
            total_deposits: 0, // total amount deposited in the vault
            balances: table::new(ctx),
            debts: table::new(ctx),
        };
        transfer::share_object(vault);
    }

    // deposit SUI into the vault (as lender)
    public entry fun deposit(
        vault: &mut Vault_SUI,
        incoming: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // How many SUI did I send?
        let amt: u64 = value(&incoming);
        // move the coin into the vault's pool
        join(&mut vault.pool, incoming);
        // bump total supply of shares (u128 to avoid overflow)
        vault.total_deposits = vault.total_deposits + (amt as u128);

        let who = tx_context::sender(ctx);
        if (table::contains(&vault.balances, who)) {
            // add to existing balance
            let bal_ref = table::borrow_mut(&mut vault.balances, who);
            *bal_ref = *bal_ref + (amt as u128);
        } else {
            // first deposit from this address
            table::add(&mut vault.balances, who, (amt as u128));
        }
    }

    // withdraw SUI from the vault (as lender)
    public entry fun withdraw(
        vault: &mut Vault_SUI,
        amt: u64,
        ctx: &mut TxContext
    ) {
        let amt128 = amt as u128;
        let who = tx_context::sender(ctx);

        // make sure you have enough shares
        assert!(table::contains(&vault.balances, who), 1);
        let bal_ref = table::borrow_mut(&mut vault.balances, who);
        assert!(*bal_ref >= amt128, 2);

        // deduct shares
        *bal_ref = *bal_ref - amt128;
        if (*bal_ref == 0) {
            // clean up zero‐entries
            table::remove(&mut vault.balances, who);
        };

        // reduce total share supply
        vault.total_deposits = vault.total_deposits - amt128;

        // split the pool: this returns a Coin<SUI> of exactly `amt`
        let coin = split(&mut vault.pool, amt, ctx);
        transfer::public_transfer(coin, who);
    }

    // total liquidity in the vault
    public fun total_liquidity(vault: &Vault_SUI): u64 {
        value(&vault.pool)
    }

    public fun balance_of(vault: &Vault_SUI, who: address): u128 {
        if (table::contains(&vault.balances, who)) {
            *table::borrow(&vault.balances, who)
        } else {
            0
        }
    }

    // borrow SUI from the vault (as borrower)
    public entry fun borrow(
        lender_vault: &mut Vault_SUI,
        collateral_vault: &collateral::reserve::Vault_USDC,
        borrower_vault: &mut BorrowerVault,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let who = tx_context::sender(ctx);

        // Get the user's collateral in the USDC vault
        let collateral = collateral_balance_of(collateral_vault, who);

        // checks if borrowed amount is less than underutilised collateral
        let debt_ref = table::borrow_mut(&mut lender_vault.debts, who);
        let max_value = 3 * (collateral - (*debt_ref / 3));
        assert!((amount as u128) <= max_value, 1);

        // Check: Does the vault have enough SUI to lend out?
        let available: u64 = value(&lender_vault.pool);
        assert!(available >= amount, 0);

        // Split the pool to get a Coin<SUI> of `amount`
        let borrowed_coin = split(&mut lender_vault.pool, amount, ctx);

        // Deposit the borrowed coin into the borrower's vault
        deposit_borrower_funds(borrower_vault, borrowed_coin, ctx);
    }

    // repay SUI to the vault (as borrower)
    public entry fun repay(
        lender_vault: &mut Vault_SUI,
        borrower_vault: &mut BorrowerVault,
        ctx: &mut TxContext,
    ) {
        let who = tx_context::sender(ctx);

        // 1) Fetch and clear their debt
        let debt_ref = table::borrow_mut(&mut lender_vault.debts, who);
        let to_repay: u64 = (*debt_ref) as u64;
        *debt_ref = 0;

        // 2) Split exactly that amount out of the borrower’s pool
        let coin: Coin<SUI> = withdraw_borrower_funds(borrower_vault, to_repay, ctx);

        // 3) Merge it back into the lender’s pool
        join(&mut lender_vault.pool, coin);
    }


    public fun get_debt(vault: &Vault_SUI, who: address): u128 {
        if (table::contains(&vault.debts, who)) {
            *table::borrow(&vault.debts, who)
        } else {
            0
        }
    }



    #[test_only]
    public fun test_new_vault(ctx: &mut TxContext): Vault_SUI {
        Vault_SUI {
            id: object::new(ctx),
            pool: zero<SUI>(ctx),
            total_deposits: 0,
            balances: table::new(ctx),
            debts: table::new(ctx),
        }
    }



}