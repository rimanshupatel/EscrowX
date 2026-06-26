#![no_std]
pub mod types;
pub mod errors;
pub mod storage;
pub mod escrow;

use soroban_sdk::{contract, contractimpl, Address, Env};
use crate::types::Escrow;
use crate::errors::Error;

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), Error> {
        escrow::initialize(env, admin, token)
    }

    pub fn create_escrow(
        env: Env,
        id: u64,
        client: Address,
        freelancer: Address,
        amount: i128,
    ) -> Result<(), Error> {
        escrow::create_escrow(env, id, client, freelancer, amount)
    }

    pub fn fund_escrow(env: Env, id: u64) -> Result<(), Error> {
        escrow::fund_escrow(env, id)
    }

    pub fn mark_in_progress(env: Env, id: u64, freelancer: Address) -> Result<(), Error> {
        escrow::mark_in_progress(env, id, freelancer)
    }

    pub fn mark_delivered(env: Env, id: u64) -> Result<(), Error> {
        escrow::mark_delivered(env, id)
    }

    pub fn approve_delivery(env: Env, id: u64) -> Result<(), Error> {
        escrow::approve_delivery(env, id)
    }

    pub fn request_refund(env: Env, id: u64) -> Result<(), Error> {
        escrow::request_refund(env, id)
    }

    pub fn refund_escrow(env: Env, id: u64) -> Result<(), Error> {
        escrow::refund_escrow(env, id)
    }

    pub fn raise_dispute(env: Env, id: u64, caller: Address) -> Result<(), Error> {
        escrow::raise_dispute(env, id, caller)
    }

    pub fn resolve_dispute(env: Env, id: u64, winner: Address) -> Result<(), Error> {
        escrow::resolve_dispute(env, id, winner)
    }

    pub fn get_escrow(env: Env, id: u64) -> Result<Escrow, Error> {
        storage::get_escrow(&env, id)
    }
}
