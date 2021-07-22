
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";
import * as hardhat from "hardhat";
import { FacetCutAction, getSelectors } from "../scripts/libraries/diamond";
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

  let membershipToken: MockZeroToken;
  let zDAO: Diamond;

  before(async () => {
    accounts = await hardhat.ethers.getSigners();
    creator = accounts[0];
    user1 = accounts[3];
    user2 = accounts[4];
    user3 = accounts[5];
    user4 = accounts[6];
  });

  before(async () => {
    // Setup Membership Token (voting token)
    const tokenFactory = new MockZeroToken__factory(creator);
    membershipToken = await tokenFactory.deploy();
    await membershipToken.initialize("Mock Token", "MOCK");

    // Cut Facet must be deployed first
    const cutFactory = new DiamondCutFacet__factory(creator);
    const cutFacet = await cutFactory.deploy();

    // Create zDAO Diamond
    const diamondFactory = new Diamond__factory(creator);
    zDAO = await diamondFactory.deploy(creator.address, cutFacet.address);

    // Authorize zDAO Diamond to snapshot on zToken
    await membershipToken.authorizeSnapshotter(zDAO.address);
  });

  // generic facets
  before(async () => {
    // deploy diamond init
    const initFactory = new DiamondInit__factory(creator);
    const initializer = await initFactory.deploy();

    const FacetNames = ["DiamondLoupeFacet", "OwnershipFacet"];
    const cuts = [];

    for (const FacetName of FacetNames) {
      const facetFactory = await hardhat.ethers.getContractFactory(FacetName);
      const facet = await facetFactory.deploy();

      cuts.push({
        facetAddress: facet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(facet),
      });
    }

    const initFunctionCall = initializer.interface.encodeFunctionData("init");

    const diamondCut = await DiamondCutFacet__factory.connect(zDAO.address, creator);

    await diamondCut.diamondCut(cuts, initializer.address, initFunctionCall);
  });

  // basic voting init
  before(async () => {
    // deploy diamond init
    const initFactory = new ZDAOBasicInit__factory(creator);
    const initializer = await initFactory.deploy();

    // deploy basic voting facet
    const FacetNames = ["BasicVotingFacet"];
    const cuts = [];

    for (const FacetName of FacetNames) {
      const facetFactory = await hardhat.ethers.getContractFactory(FacetName);
      const facet = await facetFactory.deploy();

      cuts.push({
        facetAddress: facet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(facet),
      });
    }

    const initFunctionCall = initializer.interface.encodeFunctionData("init", [
      membershipToken.address,
      0,
      5,
      ethers.utils.parseEther("0.3")
    ]);

    const diamondCut = await DiamondCutFacet__factory.connect(zDAO.address, creator);
    await diamondCut.diamondCut(cuts, initializer.address, initFunctionCall);
  });

  before(async () => {
    await membershipToken.mintBypass(user1.address, ethers.utils.parseEther("2"));
    await membershipToken.mintBypass(user3.address, ethers.utils.parseEther("1"));
    await membershipToken.mintBypass(user4.address, ethers.utils.parseEther("1"));
  });

  describe("Creating Proposals", () => {
    it("allows a user to create a proposal", async () => {
      const basicVoting = await BasicVotingFacet__factory.connect(zDAO.address, user1);

      const proposalData = membershipToken.interface.encodeFunctionData("mint", [user1.address, ethers.utils.parseEther("10")]);

      const tx = await basicVoting.createProposal(membershipToken.address, 0, proposalData);

      expect(tx).to.emit(basicVoting, "ProposalCreated").withArgs(
        user1.address,
        1,
        1,
        ethers.utils.parseEther("4"),
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

});