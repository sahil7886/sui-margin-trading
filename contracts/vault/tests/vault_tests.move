#[test_only]
module vault::vault_test {
    use sui::tx_context;
    use sui::object;
    use sui::coin::{zero};
    use sui::table;
    use sui::sui::SUI;
    use vault::vault::{deposit, withdraw, total_liquidity, balance_of, Vault_SUI, test_new_vault};
    
    #[test]
    fun test_deposit_and_withdraw(): Vault_SUI {
        // 1) Create a dummy TxContext for unit tests
        let mut ctx = tx_context::dummy();

        // 2) Manually construct an empty Vault_SUI
        let mut vault = test_new_vault(&mut ctx);


        // 3) Deposit a zero‐amount coin (everyone starts at 0)
        let coin = zero<SUI>(&mut ctx);
        deposit(&mut vault, coin, &mut ctx);

        // After depositing 0, total_supply should still be 0
        assert!(total_liquidity(&vault) == 0, 1);

        // 4) Withdraw 0 SUI — this should also succeed without panic
        withdraw(&mut vault, 0, &mut ctx);

        // And supply remains 0
        assert!(total_liquidity(&vault) == 0, 2);

        vault
    }

    #[test]
    #[expected_failure(abort_code = 1)]
    public fun test_withdraw_without_deposit(): Vault_SUI {
        let mut ctx = tx_context::dummy();
        let mut vault = test_new_vault(&mut ctx);
        // No prior deposit ⇒ abort!
        withdraw(&mut vault, 1, &mut ctx);
        vault
    }

}


