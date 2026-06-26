use soroban_sdk::{Env, Address};
use crate::types::{Escrow, Status};
use crate::errors::Error;
use crate::storage::{
    get_escrow, save_escrow, update_escrow,
    get_admin, set_admin, get_token, set_token
};

pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), Error> {
    if get_admin(&env).is_some() {
        return Err(Error::InvalidState);
    }
    set_admin(&env, &admin);
    set_token(&env, &token);
    Ok(())
}

pub fn create_escrow(
    env: Env,
    id: u64,
    client: Address,
    freelancer: Address,
    amount: i128,
) -> Result<(), Error> {
    if get_escrow(&env, id).is_ok() {
        return Err(Error::InvalidState);
    }
    if amount <= 0 {
        return Err(Error::InvalidState);
    }

    client.require_auth();

    let escrow = Escrow {
        id,
        client,
        freelancer,
        amount,
        status: Status::Pending as u32,
    };

    save_escrow(&env, &escrow);
    Ok(())
}

pub fn fund_escrow(env: Env, id: u64) -> Result<(), Error> {
    let mut escrow = get_escrow(&env, id)?;
    
    if escrow.status == Status::Funded as u32 {
        return Err(Error::AlreadyFunded);
    }
    if escrow.status != Status::Pending as u32 {
        return Err(Error::InvalidState);
    }

    escrow.client.require_auth();

    let token_address = get_token(&env).ok_or(Error::InvalidState)?;
    let contract_address = env.current_contract_address();

    let token_client = soroban_sdk::token::Client::new(&env, &token_address);
    token_client.transfer(&escrow.client, &contract_address, &escrow.amount);

    escrow.status = Status::Funded as u32;
    update_escrow(&env, &escrow);
    Ok(())
}

pub fn mark_in_progress(env: Env, id: u64, freelancer: Address) -> Result<(), Error> {
    let mut escrow = get_escrow(&env, id)?;
    if escrow.status != Status::Funded as u32 {
        return Err(Error::InvalidState);
    }

    escrow.client.require_auth();

    escrow.freelancer = freelancer;
    escrow.status = Status::InProgress as u32;
    update_escrow(&env, &escrow);
    Ok(())
}

pub fn mark_delivered(env: Env, id: u64) -> Result<(), Error> {
    let mut escrow = get_escrow(&env, id)?;
    if escrow.status != Status::InProgress as u32 {
        return Err(Error::InvalidState);
    }

    escrow.freelancer.require_auth();

    escrow.status = Status::Delivered as u32;
    update_escrow(&env, &escrow);
    Ok(())
}

pub fn approve_delivery(env: Env, id: u64) -> Result<(), Error> {
    let mut escrow = get_escrow(&env, id)?;
    if escrow.status != Status::Delivered as u32 && escrow.status != Status::RevisionRequested as u32 {
        return Err(Error::InvalidState);
    }

    escrow.client.require_auth();

    let token_address = get_token(&env).ok_or(Error::InvalidState)?;
    let contract_address = env.current_contract_address();

    let token_client = soroban_sdk::token::Client::new(&env, &token_address);
    token_client.transfer(&contract_address, &escrow.freelancer, &escrow.amount);

    escrow.status = Status::Completed as u32;
    update_escrow(&env, &escrow);
    Ok(())
}

pub fn request_refund(env: Env, id: u64) -> Result<(), Error> {
    let mut escrow = get_escrow(&env, id)?;
    if escrow.status != Status::InProgress as u32 && escrow.status != Status::Delivered as u32 {
        return Err(Error::InvalidState);
    }

    escrow.client.require_auth();

    escrow.status = Status::RevisionRequested as u32;
    update_escrow(&env, &escrow);
    Ok(())
}

pub fn refund_escrow(env: Env, id: u64) -> Result<(), Error> {
    let mut escrow = get_escrow(&env, id)?;
    if escrow.status != Status::Funded as u32
        && escrow.status != Status::InProgress as u32
        && escrow.status != Status::Delivered as u32
        && escrow.status != Status::RevisionRequested as u32
    {
        return Err(Error::InvalidState);
    }

    escrow.client.require_auth();

    let token_address = get_token(&env).ok_or(Error::InvalidState)?;
    let contract_address = env.current_contract_address();

    let token_client = soroban_sdk::token::Client::new(&env, &token_address);
    token_client.transfer(&contract_address, &escrow.client, &escrow.amount);

    escrow.status = Status::Refunded as u32;
    update_escrow(&env, &escrow);
    Ok(())
}

pub fn raise_dispute(env: Env, id: u64, caller: Address) -> Result<(), Error> {
    let mut escrow = get_escrow(&env, id)?;
    if caller != escrow.client && caller != escrow.freelancer {
        return Err(Error::Unauthorized);
    }

    caller.require_auth();

    if escrow.status != Status::Funded as u32
        && escrow.status != Status::InProgress as u32
        && escrow.status != Status::Delivered as u32
        && escrow.status != Status::RevisionRequested as u32
    {
        return Err(Error::InvalidState);
    }

    escrow.status = Status::Disputed as u32;
    update_escrow(&env, &escrow);
    Ok(())
}

pub fn resolve_dispute(env: Env, id: u64, winner: Address) -> Result<(), Error> {
    let admin = get_admin(&env).ok_or(Error::InvalidState)?;
    admin.require_auth();

    let mut escrow = get_escrow(&env, id)?;
    if escrow.status != Status::Disputed as u32 {
        return Err(Error::InvalidState);
    }

    if winner != escrow.client && winner != escrow.freelancer {
        return Err(Error::InvalidState);
    }

    let token_address = get_token(&env).ok_or(Error::InvalidState)?;
    let contract_address = env.current_contract_address();

    let token_client = soroban_sdk::token::Client::new(&env, &token_address);

    if winner == escrow.client {
        token_client.transfer(&contract_address, &escrow.client, &escrow.amount);
        escrow.status = Status::Refunded as u32;
    } else {
        token_client.transfer(&contract_address, &escrow.freelancer, &escrow.amount);
        escrow.status = Status::Completed as u32;
    }

    update_escrow(&env, &escrow);
    Ok(())
}
