module vault::vault {
    use sui::coin::{Self, Coin, value, zero, join, split};
    use sui::object::{Self, UID};
    use sui::table::{Self, Table};
    use sui::sui::SUI;
    
    public struct Vault_SUI has key, store {
        id: UID,
        pool: Coin<SUI>,
        total_deposits: u128,
        balances: Table<address, u128>,
    }

    // total_deposits = total_liquidity + borrowed amount
    // utilisation ratio = 1 - (total_liquidity / total_deposits)
    fun init(ctx: &mut TxContext) {
        let vault = Vault_SUI {
            id: object::new(ctx),
            pool: zero<SUI>(ctx),
            total_deposits: 0, // total amount deposited in the vault
            balances: table::new(ctx),
        };
        transfer::transfer(vault, tx_context::sender(ctx));
    }

    public entry fun deposit(
        vault: &mut Vault_SUI,
        incoming: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // How many SUI did I send?
        let amt: u64 = value(&incoming);
        // move the coin into the vault’s pool
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

    //TODO: borrow and repay functions for borrowers

    #[test_only]
    public fun test_new_vault(ctx: &mut TxContext): Vault_SUI {
        Vault_SUI {
            id: object::new(ctx),
            pool: zero<SUI>(ctx),
            total_deposits: 0,
            balances: table::new(ctx),
        }
    }



}