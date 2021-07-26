import { Diamond, DiamondCutFacet__factory, DiamondInit__factory, Diamond__factory, MockZeroToken, MockZeroToken__factory, ZDAOBasicInit__factory } from "../typechain";

import * as hardhat from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getSelectors } from "./diamond";
import { ethers } from "ethers";

export enum VotingType {
  Absolute = 0,
  Relative = 1
}

export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

export const deployDiamond = async (creator: SignerWithAddress) => {
  // Cut Facet must be deployed first
  const cutFactory = new DiamondCutFacet__factory(creator);
  const cutFacet = await cutFactory.deploy();

  // Create zDAO Diamond
  const diamondFactory = new Diamond__factory(creator);
  const diamond = await diamondFactory.deploy(creator.address, cutFacet.address);

  return diamond;
}

export const deployMockToken = async (creator: SignerWithAddress) => {
  // Setup Membership Token (voting token)
  const tokenFactory = new MockZeroToken__factory(creator);
  const token = await tokenFactory.deploy();
  await token.initialize("Mock Token", "MOCK");

  return token;
}

interface MockZDAO {
  membershipToken: MockZeroToken,
  zDAO: Diamond
}

export const deployMockZDAODiamond = async (creator: SignerWithAddress): Promise<MockZDAO> => {
  const token = await deployMockToken(creator);
  const diamond = await deployDiamond(creator);

  await token.authorizeSnapshotter(diamond.address);

  return {
    membershipToken: token,
    zDAO: diamond
  }
}

const prepareFacets = async (facetNames: string[]) => {
  const cuts = [];

  for (const FacetName of facetNames) {
    const facetFactory = await hardhat.ethers.getContractFactory(FacetName);
    const facet = await facetFactory.deploy();

    cuts.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    });
  }

  return cuts;
}

export const cutDefaultFacets = async (diamondAddress: string, cutter: SignerWithAddress) => {
  // deploy diamond init
  const initFactory = new DiamondInit__factory(cutter);
  const initializer = await initFactory.deploy();

  const cuts = await prepareFacets(["DiamondLoupeFacet", "OwnershipFacet"]);

  const initFunctionCall = initializer.interface.encodeFunctionData("init");

  const diamondCut = await DiamondCutFacet__factory.connect(diamondAddress, cutter);

  await diamondCut.diamondCut(cuts, initializer.address, initFunctionCall);
}

export const cutBasicVotingFacet = async (diamondAddress: string, cutter: SignerWithAddress, membershipTokenAddress: string, votingType: VotingType, voteTime: number, votePercent: number) => {
  // deploy diamond init
  const initFactory = new ZDAOBasicInit__factory(cutter);
  const initializer = await initFactory.deploy();

  // deploy basic voting facet
  const cuts = await prepareFacets(["BasicVotingFacet"]);

  const initFunctionCall = initializer.interface.encodeFunctionData("init", [
    membershipTokenAddress,
    votingType,
    voteTime,
    ethers.utils.parseEther(votePercent.toString())
  ]);

  const diamondCut = await DiamondCutFacet__factory.connect(diamondAddress, cutter);
  await diamondCut.diamondCut(cuts, initializer.address, initFunctionCall);
}