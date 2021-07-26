
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";
import * as hardhat from "hardhat";
import * as helpers from "../lib";
import { BasicVotingFacet__factory, Diamond, DiamondCutFacet__factory, DiamondInit__factory, Diamond__factory, MockZeroToken, ZDAOBasicInit__factory } from "../typechain";
import { MockZeroToken__factory } from "../typechain/factories/MockZeroToken__factory";

chai.use(solidity);
const { expect } = chai;

describe("E2E Basic Voting", () => {
  let accounts: SignerWithAddress[];
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;



  before(async () => {
    accounts = await hardhat.ethers.getSigners();
    creator = accounts[0];
    user1 = accounts[3];
    user2 = accounts[4];
    user3 = accounts[5];
    user4 = accounts[6];
  });


  describe("Creating Proposals", () => {
    let membershipToken: MockZeroToken;
    let zDAO: Diamond;

    before(async () => {
      const mock = await helpers.deployMockZDAODiamond(creator);
      membershipToken = mock.membershipToken;
      zDAO = mock.zDAO;

      await helpers.cutDefaultFacets(zDAO.address, creator);
      await helpers.cutBasicVotingFacet(zDAO.address, creator, membershipToken.address, helpers.VotingType.Absolute, 10, 0.3);

      await membershipToken.mintBypass(user1.address, ethers.utils.parseEther("2"));
    });


    it("allows a user to create a proposal", async () => {
      const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);

      const proposalData = membershipToken.interface.encodeFunctionData("mint", [user1.address, ethers.utils.parseEther("10")]);

      const tx = await basicVoting.createProposal(membershipToken.address, 0, proposalData);

      expect(tx).to.emit(basicVoting, "ProposalCreated").withArgs(
        user1.address,
        1,
        1,
        ethers.utils.parseEther("2"),
        membershipToken.address,
        0,
        proposalData
      )
    });

    it("prevents a user without membership from creating a proposal", async () => {
      const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user2);
      const tx = basicVoting.createProposal(membershipToken.address, 0, ethers.utils.randomBytes(32));

      await expect(tx).to.be.revertedWith("ZDAO: 0001");
    });
  });

  describe("Voting", () => {
    describe("Absolute", () => {
      let membershipToken: MockZeroToken;
      let zDAO: Diamond;

      before(async () => {
        const mock = await helpers.deployMockZDAODiamond(creator);
        membershipToken = mock.membershipToken;
        zDAO = mock.zDAO;

        await helpers.cutDefaultFacets(zDAO.address, creator);
        await helpers.cutBasicVotingFacet(zDAO.address, creator, membershipToken.address, helpers.VotingType.Absolute, 10, 0.5);

        await membershipToken.mintBypass(user1.address, ethers.utils.parseEther("1"));
        await membershipToken.mintBypass(user2.address, ethers.utils.parseEther("1"));
        await membershipToken.mintBypass(user3.address, ethers.utils.parseEther("1"));
      });

      // create a proposal to vote on
      before(async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);

        const proposalData = membershipToken.interface.encodeFunctionData("mint", [user1.address, ethers.utils.parseEther("10")]);

        const tx = await basicVoting.createProposal(membershipToken.address, 0, proposalData);
      });

      it("prevents a user without membership from voting on a proposal", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user4);

        const proposalId = 1;

        const tx = basicVoting.voteOnProposal(proposalId, true);
        await expect(tx).to.be.revertedWith("ZDAO: 0003")
      });

      it("prevents a user from voting on a proposal that doesn't exist", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);

        const proposalId = 2;

        const tx = basicVoting.voteOnProposal(proposalId, true);
        await expect(tx).to.be.revertedWith("ZDAO: 0004")
      });

      it("allows a user to vote on a proposal", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);

        const proposalId = 1;

        const tx = await basicVoting.voteOnProposal(proposalId, true);
        expect(tx).to.emit(basicVoting, "ProposalVotedOn").withArgs(
          proposalId,
          user1.address,
          ethers.utils.parseEther("1"),
          true
        );
      });

      it("prevents a user from voting on a proposal twice", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);

        const proposalId = 1;

        const tx = basicVoting.voteOnProposal(proposalId, true);
        await expect(tx).to.be.revertedWith("ZDAO: 0008")
      });

      it("says a proposal has not passed if it hasn't yet", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);

        const proposalId = 1;

        const tx = await basicVoting.proposalHasPassed(proposalId);
        expect(tx).to.be.false;
      });

      it("automatically passes a proposal on vote", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user2);

        const proposalId = 1;

        const tx = await basicVoting.voteOnProposal(proposalId, true);
        expect(tx).to.emit(basicVoting, "AbsoluteVoteProposalPassed").withArgs(
          proposalId
        );
      });

      it("says a proposal has passed", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);

        const proposalId = 1;

        const tx = await basicVoting.proposalHasPassed(proposalId);
        expect(tx).to.be.true;
      });

      it("prevents a user from voting on a proposal that has passed", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user3);

        const proposalId = 1;

        const tx = basicVoting.voteOnProposal(proposalId, false);
        await expect(tx).to.be.revertedWith("ZDAO: 0007A")
      });

      it("prevents a user from voting on a proposal that has expired", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user3);

        const proposalData = membershipToken.interface.encodeFunctionData("mint", [user1.address, ethers.utils.parseEther("10")]);

        await basicVoting.createProposal(membershipToken.address, 0, proposalData);

        // fast forward 11 blocks
        for (let i = 0; i < 11; ++i) {
          await hardhat.ethers.provider.send('evm_mine', []);
        }

        const proposalId = 2;

        const tx = basicVoting.voteOnProposal(proposalId, false);
        await expect(tx).to.be.revertedWith("ZDAO: 0006")
      });

      it("prevents a user from voting on a proposal that has failed", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user3);

        const proposalData = membershipToken.interface.encodeFunctionData("mint", [user1.address, ethers.utils.parseEther("10")]);

        await basicVoting.createProposal(membershipToken.address, 0, proposalData);

        const proposalId = 3;

        await basicVoting.voteOnProposal(proposalId, false);
        await basicVoting.connect(user2).voteOnProposal(proposalId, false);

        const tx = basicVoting.connect(user1).voteOnProposal(proposalId, true);

        await expect(tx).to.be.revertedWith("ZDAO: 0007B");
      });

    });


    describe("Relative", () => {
      let membershipToken: MockZeroToken;
      let zDAO: Diamond;

      before(async () => {
        const mock = await helpers.deployMockZDAODiamond(creator);
        membershipToken = mock.membershipToken;
        zDAO = mock.zDAO;

        await helpers.cutDefaultFacets(zDAO.address, creator);
        await helpers.cutBasicVotingFacet(zDAO.address, creator, membershipToken.address, helpers.VotingType.Relative, 10, 0.5);

        await membershipToken.mintBypass(user1.address, ethers.utils.parseEther("1"));
        await membershipToken.mintBypass(user2.address, ethers.utils.parseEther("1"));
        await membershipToken.mintBypass(user3.address, ethers.utils.parseEther("1"));
      });

      it("prevents a user from voting on a proposal that has expired", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user3);

        const proposalData = membershipToken.interface.encodeFunctionData("mint", [user1.address, ethers.utils.parseEther("10")]);

        await basicVoting.createProposal(membershipToken.address, 0, proposalData);

        // fast forward 11 blocks
        for (let i = 0; i < 11; ++i) {
          await hardhat.ethers.provider.send('evm_mine', []);
        }

        const proposalId = 1;

        const tx = basicVoting.voteOnProposal(proposalId, false);
        await expect(tx).to.be.revertedWith("ZDAO: 0006")
      });

      it("does not allow a proposal to pass early", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);

        const proposalData = membershipToken.interface.encodeFunctionData("mint", [user1.address, ethers.utils.parseEther("10")]);

        await basicVoting.createProposal(membershipToken.address, 0, proposalData);

        const proposalId = 2;

        await basicVoting.voteOnProposal(proposalId, true);

        expect(await basicVoting.proposalHasPassed(proposalId)).to.be.false;
      });

      it("says a proposal has passed after expiration time if it has enough votes", async () => {
        // fast forward 11 blocks
        for (let i = 0; i < 11; ++i) {
          await hardhat.ethers.provider.send('evm_mine', []);
        }

        const proposalId = 2;

        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);
        expect(await basicVoting.proposalHasPassed(proposalId)).to.be.true;
      });

    });
  });

  describe("Execution", () => {
    describe("Absolute", () => {
      let membershipToken: MockZeroToken;
      let zDAO: Diamond;
      let dummyToken: MockZeroToken;

      before(async () => {
        const mock = await helpers.deployMockZDAODiamond(creator);
        membershipToken = mock.membershipToken;
        zDAO = mock.zDAO;

        await helpers.cutDefaultFacets(zDAO.address, creator);
        await helpers.cutBasicVotingFacet(zDAO.address, creator, membershipToken.address, helpers.VotingType.Absolute, 10, 0.5);

        await membershipToken.mintBypass(user1.address, ethers.utils.parseEther("1"));
        await membershipToken.mintBypass(user2.address, ethers.utils.parseEther("1"));
        await membershipToken.mintBypass(user3.address, ethers.utils.parseEther("1"));

        dummyToken = await helpers.deployMockToken(creator);
        await dummyToken.transferOwnership(zDAO.address);
      });

      it("allows a passed proposal to execute successfully", async () => {
        const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);

        const mintAmount = ethers.utils.parseEther("10");
        const proposalData = dummyToken.interface.encodeFunctionData("mint", [user1.address, mintAmount]);

        await basicVoting.createProposal(dummyToken.address, 0, proposalData);

        const proposalId = 1;

        await basicVoting.connect(user1).voteOnProposal(proposalId, true);
        await basicVoting.connect(user2).voteOnProposal(proposalId, true);

        // fast forward 11 blocks
        for (let i = 0; i < 11; ++i) {
          await hardhat.ethers.provider.send('evm_mine', []);
        }
        // proposal should have passed by now

        const tx = await basicVoting.connect(user1).executeProposal(proposalId);

        expect(tx).to.emit(basicVoting, "ExecutedProposal").withArgs(proposalId, true);

        expect(await dummyToken.balanceOf(user1.address)).to.eq(mintAmount);
      });


    });

    describe("Relative", () => {
      let membershipToken: MockZeroToken;
      let zDAO: Diamond;
      let dummyToken: MockZeroToken;

      before(async () => {
        const mock = await helpers.deployMockZDAODiamond(creator);
        membershipToken = mock.membershipToken;
        zDAO = mock.zDAO;

        await helpers.cutDefaultFacets(zDAO.address, creator);
        await helpers.cutBasicVotingFacet(zDAO.address, creator, membershipToken.address, helpers.VotingType.Relative, 10, 0.5);

        await membershipToken.mintBypass(user1.address, ethers.utils.parseEther("1"));
        await membershipToken.mintBypass(user2.address, ethers.utils.parseEther("1"));
        await membershipToken.mintBypass(user3.address, ethers.utils.parseEther("1"));

        dummyToken = await helpers.deployMockToken(creator);
        await dummyToken.transferOwnership(zDAO.address);
      });
    });

  });

});