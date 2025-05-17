module borrower_funds::borrower_funds {
    use sui::coin::{Self, Coin, value, zero, join, split};
    use sui::object::{Self, UID};
    use sui::table::{Self, Table};
    use sui::sui::SUI;
    
    public struct Vault has key, store {
        id: UID,
        pool: Coin<SUI>,
        balances: Table<address, u128>,
    }

    fun init(ctx: &mut TxContext) {
        let vault = Vault {
            id: object::new(ctx),
            pool: zero<SUI>(ctx),
            balances: table::new(ctx),
        };
        transfer::share_object(vault);
    }

    public entry fun deposit(
        vault: &mut Vault,
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

    public fun withdraw(
        bv: &mut Vault,
        amt: u64,
        ctx: &mut TxContext
    ): Coin<SUI> {
        let who = tx_context::sender(ctx);
        let bal_ref = table::borrow_mut(&mut bv.balances, who);
        assert!(*bal_ref >= (amt as u128), 1);
        *bal_ref = *bal_ref - (amt as u128);
        if (*bal_ref == 0) {
            table::remove(&mut bv.balances, who);
        };
        let coin = split(&mut bv.pool, amt, ctx);
        coin
    }
}