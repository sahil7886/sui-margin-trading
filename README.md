# DeepLever - Sui's Margin Trading Platform

## Introduction

DeepLever is a decentralized margin-trading platform built on the Sui blockchain. It allows users to lend their assets to earn yield and traders to borrow assets with collateral for leveraged positions, all managed through a unified, real-time dashboard.

## What it is

Our platform is composed of several key modules:

*   **Lending Module:** Users can deposit SUI or other supported tokens into lending pools to earn competitive yields on their idle assets.
*   **Borrowing Module:** Traders can borrow assets from these pools by providing collateral, enabling them to take leveraged positions and amplify their trading power.
*   **Unified Dashboard:** A comprehensive interface to track your deposits, monitor outstanding loans, and view your position health in real time.

## Why it Matters

DeepLever offers distinct advantages for different users:

**For Lenders:**
*   **Earn Competitive Yield:** Put your idle SUI and other crypto assets to work, earning attractive APYs compared to simple staking.
*   **Transparent & Permissionless:** Enjoy direct access to lending pools with on-chain accounting, free from traditional middleman fees.

**For Borrowers:**
*   **Amplify Trading Power:** Magnify your trading potential by borrowing up to X × your collateral (Note: specific leverage multiplier to be defined).
*   **Maintain Flexibility:** Open, close, or adjust your leveraged positions on-chain at any time, giving you full control.

## How it Works

The platform leverages the unique capabilities of the Sui blockchain and other cutting-edge technologies:

*   **Sui's Object-Centric Model:**
    *   Native asset objects simplify collateral management, making liquidation logic more efficient and secure.
    *   Provides zero-trust, on-chain accounting for all deposits, borrows, and interest accrual, ensuring transparency.
*   **Price Oracles (Pyth Network):**
    *   Utilizes real-time, tamper-resistant price feeds from Pyth to accurately calculate collateralization ratios and trigger liquidations when necessary.
*   **Frontend (Next.js):**
    *   A responsive and intuitive user interface built with Next.js for seamless deposit/borrow flows and comprehensive position monitoring.
    *   Features clear charts and timely alerts, developed using Tailwind CSS and shadcn/ui for a modern user experience.

**Other Key Features:**
*   **Interest Accrual:** Interest accrues to the entire pool and is distributed to lenders based on their share and deposit C.
*   **Interest Index:** Every borrower/lender starts at an index of 1. This index adjusts block-by-block based on borrower interest rates.
*   **Utilisation Cap:** The platform targets an optimal utilisation rate (e.g., 80%) to balance lender APYs and borrower liquidity.
*   **Dynamic APY Rates:** APY rates are influenced by the pool's utilisation:
    *   0-10% utilisation: Very low APY
    *   20-40% utilisation: Low-medium APY
    *   40-70% utilisation: Medium-high APY
    *   70-80% utilisation: Very high APY
*   **Custom Liquidation Auctions:** Designed to maximize asset recovery during liquidations, benefiting the platform's stability.
*   **Fee-Sharing Pools:** Mechanisms for sharing platform fees, potentially tied to community governance.

## Current Progress

*   Lender Pool.
*   Collateral Management.
*   Borrowing at a 3x margin.
*   Metric tracking.

## Next Steps & Roadmap

We are actively working on expanding the platform's capabilities:

*   **DeepBook v3 Integration:** Enable on-chain order-book access for seamless and efficient trade execution directly within the platform.
*   **Multi-Token Pools:** Introduce support for additional assets, including USDC, USDT, and other stablecoins native to the Sui ecosystem.
*   **Expanded Collateral Support:** Allow users to utilize ETH, BTC, and various LP tokens as collateral for margin trading.
*   **User-Governance Module:** Implement a DAO-driven system for tuning key platform parameters such as interest rates, utilisation caps, and fee structures.
*   **Security Audit & Testnet Launch:** Engage third-party auditors to thoroughly review the smart contracts and launch a public testnet to gather early user feedback and ensure robustness.

## Setup

*   **Frontend Setup:** See `frontend/README.md`

## Vision

Our vision is to deliver permissionless, scalable, and secure margin trading on the Sui blockchain.

---

We're excited about the future of DeepLever and welcome any questions!