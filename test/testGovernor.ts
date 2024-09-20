import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

// Helper function to mine a specific number of blocks
async function mineBlocks(numberOfBlocks: number) {
  for (let i = 0; i < numberOfBlocks; i++) {
    await ethers.provider.send("evm_mine", []);
  }
}

describe("ZDAO", function () {
  async function deployZDAOFixture() {
    const [owner, signer1, signer2] = await ethers.getSigners();
    const ownerAddr = await owner.getAddress();
    const addr1 = await signer1.getAddress();
    const addr2 = await signer2.getAddress();

    // Deploy the NFT contract
    const nftFactory = await ethers.getContractFactory("MockERC721Votes");
    const nft = await nftFactory.deploy();
    const nftAddr = await nft.getAddress();

    // Deploy the ERC20 contract
    const erc20Factory = await ethers.getContractFactory("MockERC20Votes");
    const erc20 = await erc20Factory.deploy("name", "symbol");
    const erc20Addr = await erc20.getAddress();

    // Deploy the TimelockController contract
    const TimelockController = await ethers.getContractFactory("TimelockController");
    const minDelay = 1; // Min delay in seconds

    // Explicitly type 'proposers' and 'executors' as 'string[]'
    const proposers: string[] = []; // Initially empty
    const executors: string[] = []; // Initially empty
    const admin = ownerAddr;

    const timelock = await TimelockController.deploy(
      minDelay,
      proposers,
      executors,
      admin
    );
    const timelockAddr = await timelock.getAddress();

    // --- Move minting and delegation BEFORE transferring ownership ---

    // Mint an NFT to the owner to give them voting power
    await nft.mint(ownerAddr, 1);

    // Delegate the voting power to the owner (for ERC721-based governance)
    await nft.connect(owner).delegate(ownerAddr);

    // Transfer ownership of the NFT contract to the TimelockController
    await nft.transferOwnership(timelockAddr);

    // Deploy the ZDAO contract with updated parameters
    const zDAOFactory = await ethers.getContractFactory("ZDAO");

    const delay = 1;  // Voting delay
    const votingPeriod = 5;  // Reduced voting period for testing
    const proposalThreshold = 1;  // Proposal threshold: 1 token
    const quorum = 0;  // 0% quorum

    const zDAO = await zDAOFactory.deploy(
      "ZDAO",  // Governor name
      nftAddr,  // IVotes token (NFT for this test)
      timelockAddr,  // Timelock controller
      delay,  // Voting delay
      votingPeriod,  // Voting period
      proposalThreshold,  // Proposal threshold
      quorum  // Quorum percentage
    );
    const zDAOAddr = await zDAO.getAddress();

    // Grant roles in the TimelockController
    const proposerRole = await timelock.PROPOSER_ROLE();
    const executorRole = await timelock.EXECUTOR_ROLE();
    const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();

    // Grant the proposer role to the Governor contract and the owner
    await timelock.grantRole(proposerRole, zDAOAddr);
    await timelock.grantRole(proposerRole, ownerAddr);

    // Grant the executor role to the zero address (open executor)
    await timelock.grantRole(executorRole, ethers.ZeroAddress); // Adjusted syntax for ethers.js v6

    // Do not revoke the admin role from the owner during testing
    // await timelock.revokeRole(adminRole, ownerAddr);

    return { nft, zDAO, timelock, owner, addr1, addr2, nftAddr, erc20, erc20Addr, zDAOAddr, ownerAddr, timelockAddr };
  }

  describe("Proposals with NFT Voting Power", function () {
    it("Should allow a token holder (NFT) to propose minting and execute the proposal", async function () {
      const { zDAO, nft, timelock, owner, addr1, nftAddr } = await loadFixture(deployZDAOFixture);

      // --- No need to mint here since we already minted in the fixture ---
      // Mine some blocks to ensure snapshot captures delegation
      await mineBlocks(2);

      // Propose a mint transaction (minting token ID 2 to addr1)
      const targets = [nftAddr];
      const values = [0];
      const calldatas = [
        nft.interface.encodeFunctionData("mint", [addr1, 2]),
      ];
      const description = "Mint token ID 2 to addr1";

      // Connect as owner to propose
      await zDAO.propose(targets, values, calldatas, description);

      // Get proposal ID
      const proposalId = await zDAO.hashProposal(
        targets,
        values,
        calldatas,
        ethers.keccak256(new TextEncoder().encode(description))
      );

      // Since voting delay is 1 block, mine blocks to move the proposal to Active
      await mineBlocks(2);

      // Ensure the proposal is Active (state 1)
      const proposalState = await zDAO.state(proposalId);
      expect(proposalState).to.equal(1); // 1 = Active

      // Vote on the proposal
      await zDAO.castVote(proposalId, 1); // 1 = For

      // Mine blocks to move past the voting period
      await mineBlocks(5);

      // Check if the proposal succeeded
      const finalState = await zDAO.state(proposalId);
      expect(finalState).to.equal(4); // 4 = Succeeded

      // Queue the proposal in the timelock
      await zDAO.connect(owner).queue(
        targets,
        values,
        calldatas,
        ethers.keccak256(new TextEncoder().encode(description))
      );

      // Fast forward time to account for the timelock delay
      await ethers.provider.send("evm_increaseTime", [3600]); // Fast forward by 1 hour
      await ethers.provider.send("evm_mine", []);

      // Execute the proposal
      await zDAO.connect(owner).execute(
        targets,
        values,
        calldatas,
        ethers.keccak256(new TextEncoder().encode(description))
      );

      // Verify the token was minted to addr1
      const ownerOfToken = await nft.ownerOf(2); // Token ID 2 should now be owned by addr1
      expect(ownerOfToken).to.equal(addr1);
    });
  });

  describe("Proposals with ERC20 Voting Power", function () {
    it("Should allow a token holder (ERC20) to propose minting and execute the proposal", async function () {
      const { nft, timelock, owner, addr1, erc20, nftAddr, timelockAddr, ownerAddr, erc20Addr } = await loadFixture(deployZDAOFixture);

      // Re-deploy ZDAO with ERC20 as the governance token
      const zDAOFactory = await ethers.getContractFactory("ZDAO");
      const delay = 1;  // Voting delay
      const votingPeriod = 5;  // Reduced voting period for testing
      const proposalThreshold = 1;  // Proposal threshold
      const quorum = 0;  // 0% quorum

      const zDAO = await zDAOFactory.deploy(
        "ZDAO",  // Governor name
        erc20Addr,  // Use ERC20 token for governance
        timelockAddr,  // Timelock controller
        delay,  // Voting delay
        votingPeriod,  // Voting period
        proposalThreshold,  // Proposal threshold
        quorum  // Quorum percentage
      );
      const zDAOAddr = await zDAO.getAddress();

      // Grant the proposer role to the new ZDAO instance and owner
      const proposerRole = await timelock.PROPOSER_ROLE();
      await timelock.grantRole(proposerRole, zDAOAddr);
      await timelock.grantRole(proposerRole, ownerAddr);

      // Mint enough ERC20 tokens to the owner to meet the proposal threshold
      await erc20.mint(ownerAddr, 1000);

      // Delegate the voting power to the owner (for ERC20-based governance)
      await erc20.connect(owner).delegate(ownerAddr);

      // Mine a block to ensure snapshot captures delegation
      await mineBlocks(1);

      // Check the voting power of the owner at the correct block
      const blockNumber = await ethers.provider.getBlockNumber();
      const votingPower = await zDAO.getVotes(ownerAddr, blockNumber - 1);

      // Ensure voting power is sufficient
      expect(votingPower).to.be.gte(1);  // Assuming the proposal threshold is 1

      // Propose a mint transaction (minting token ID 3 to addr1)
      const targets = [nftAddr];
      const values = [0];
      const calldatas = [
        nft.interface.encodeFunctionData("mint", [addr1, 3]),
      ];
      const description = "Mint token ID 3 to addr1";

      // Connect as owner to propose
      await zDAO.propose(targets, values, calldatas, description);

      // Get proposal ID
      const proposalId = await zDAO.hashProposal(
        targets,
        values,
        calldatas,
        ethers.keccak256(new TextEncoder().encode(description))
      );

      // Since voting delay is 1 block, mine blocks to move the proposal to Active
      await mineBlocks(2);

      // Ensure the proposal is Active (state 1)
      const proposalState = await zDAO.state(proposalId);
      expect(proposalState).to.equal(1); // 1 = Active

      // Vote on the proposal
      await zDAO.castVote(proposalId, 1); // 1 = For

      // Mine blocks to move past the voting period
      await mineBlocks(5);

      // Check if the proposal succeeded
      const finalState = await zDAO.state(proposalId);
      expect(finalState).to.equal(4); // 4 = Succeeded

      // Queue the proposal in the timelock
      await zDAO.connect(owner).queue(
        targets,
        values,
        calldatas,
        ethers.keccak256(new TextEncoder().encode(description))
      );

      // Fast forward time to account for the timelock delay
      await ethers.provider.send("evm_increaseTime", [3600]); // Fast forward by 1 hour
      await ethers.provider.send("evm_mine", []);

      // Execute the proposal
      await zDAO.connect(owner).execute(
        targets,
        values,
        calldatas,
        ethers.keccak256(new TextEncoder().encode(description))
      );

      // Verify the token was minted to addr1
      expect(await nft.ownerOf(3)).to.equal(addr1);
    });
  });

});
