module collateral::reserve {
    use sui::coin::{Self, Coin, value, zero, join, split};
    use sui::object::{Self, UID};
    use sui::table::{Self, Table};
    use sui::sui::SUI;

    
    public struct Vault_USDC has key, store {
        id: UID,
        pool: Coin<SUI>,
        balances: Table<address, u128>,
    }

    fun init(ctx: &mut TxContext) {
        let vault = Vault_USDC {
            id: object::new(ctx),
            pool: zero<SUI>(ctx),
            balances: table::new(ctx),
        };
        transfer::share_object(vault);
    }

    public entry fun deposit(
        vault: &mut Vault_USDC,
        incoming: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // How many SUI did I send?
        let amt: u64 = value(&incoming);
        // move the coin into the vault’s pool
        join(&mut vault.pool, incoming);

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
        vault: &mut Vault_USDC,
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

        // split the pool: this returns a Coin<USDC> of exactly `amt`
        let coin = split(&mut vault.pool, amt, ctx);
        transfer::public_transfer(coin, who);
    }

    // total collateral in the vault
    public fun total_collateral(vault: &Vault_USDC): u64 {
        value(&vault.pool)
    }

    public fun collateral_balance_of(vault: &Vault_USDC, who: address): u128 {
        if (table::contains(&vault.balances, who)) {
            *table::borrow(&vault.balances, who)
        } else {
            0
        }
    }

    #[test_only]
    public fun test_new_vault(ctx: &mut TxContext): Vault_USDC {
        Vault_USDC {
            id: object::new(ctx),
            pool: zero<SUI>(ctx),
            balances: table::new(ctx),
        }
    }



}