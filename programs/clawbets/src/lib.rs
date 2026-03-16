use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

pub use instructions::initialize::*;
pub use instructions::create_market::*;
pub use instructions::place_bet::*;
pub use instructions::resolve_market::*;
pub use instructions::claim_winnings::*;
pub use instructions::cancel_market::*;
pub use instructions::reclaim_bet::*;
pub use instructions::expire_market::*;
pub use instructions::close_betting::*;

declare_id!("8bob8yfaWXatYCtz6drEYD6og6mfVZ47ZdnxfvRmVgCH");

#[program]
pub mod clawbets {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        title: String,
        description: String,
        feed_id: [u8; 32],
        target_price: i64,
        target_above: bool,
        deadline: i64,
        resolution_deadline: i64,
        min_bet: u64,
        max_bet: u64,
    ) -> Result<()> {
        instructions::create_market::handler(
            ctx, title, description, feed_id, target_price,
            target_above, deadline, resolution_deadline, min_bet, max_bet,
        )
    }

    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, position: bool) -> Result<()> {
        instructions::place_bet::handler(ctx, amount, position)
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>) -> Result<()> {
        instructions::resolve_market::handler(ctx)
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::handler(ctx)
    }

    pub fn cancel_market(ctx: Context<CancelMarket>) -> Result<()> {
        instructions::cancel_market::handler(ctx)
    }

    pub fn reclaim_bet(ctx: Context<ReclaimBet>) -> Result<()> {
        instructions::reclaim_bet::handler(ctx)
    }

    pub fn expire_market(ctx: Context<ExpireMarket>) -> Result<()> {
        instructions::expire_market::handler(ctx)
    }

    pub fn close_betting(ctx: Context<CloseBetting>) -> Result<()> {
        instructions::close_betting::handler(ctx)
    }
}
