import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  MockERC20Votes,
  MockERC721Votes,
} from "../typechain-types";

let owner : HardhatEthersSigner;
let addr1 : HardhatEthersSigner;
let addr2 : HardhatEthersSigner;

let erc20Token : MockERC20Votes;
let erc721Token : MockERC721Votes;

const erc20Name = "MockERC20Votes";
const erc20Symbol = "ZV";

const erc721Name = "MockERC721Votes";
const erc721Symbol = "ZVNFT";

const mintAmount = ethers.parseEther("150");
const burnAmount = ethers.parseEther("100");
const transferAmount = ethers.parseEther("50");
const tokenId = 1;

before(async () => {
  [owner, addr1, addr2] = await ethers.getSigners();

  // ERC20 deploy
  const ERC20Factory = await ethers.getContractFactory(erc20Name) ;
  erc20Token = await ERC20Factory.deploy(erc20Name, erc20Symbol, owner);
  await erc20Token.waitForDeployment();

  await erc20Token.connect(owner).mint(owner.address, ethers.parseEther("1000"));
  await erc20Token.connect(owner).transfer(addr1.address, ethers.parseEther("100"));
  await erc20Token.connect(owner).transfer(addr2.address, ethers.parseEther("50"));

  // ERC721 deploy
  const ERC721Factory = await ethers.getContractFactory(erc721Name) ;
  erc721Token = await ERC721Factory.deploy(erc721Name, erc721Symbol, "1.0");
  await erc721Token.waitForDeployment();

  await erc721Token.connect(owner).mint(owner.address, tokenId);
  await erc721Token.connect(owner).mint(addr1.address, tokenId + 1);
});

describe("ERC20 Voting Tests", () => {
  it("Should correctly set name and symbol for ERC20 token", async () => {
    expect(await erc20Token.name()).to.equal(erc20Name);
    expect(await erc20Token.symbol()).to.equal(erc20Symbol);
  });

  it("Should delegate votes for ERC20 token", async () => {
    const balanceBefore = await erc20Token.balanceOf(owner.address);

    await erc20Token.connect(owner).delegate(owner.address);
    const votes = await erc20Token.getVotes(owner.address);
    expect(votes).to.eq(balanceBefore);
  });

  it("Should correctly update votes after TRANSFER for ERC20 token", async () => {
    const balanceBefore = await erc20Token.balanceOf(addr1.address);
    await erc20Token.connect(addr1).delegate(addr1.address);
    const votesBefore = await erc20Token.getVotes(addr1.address);

    expect(votesBefore).to.equal(balanceBefore);

    await erc20Token.connect(addr1).transfer(addr2.address, transferAmount);
    const votesAfterTransfer = await erc20Token.getVotes(addr1.address);

    expect(votesAfterTransfer).to.equal(balanceBefore - transferAmount);
  });

  it("Should correctly update votes after BURN for ERC20 token", async () => {
    await erc20Token.connect(owner).mint(addr1.address, mintAmount);
    const balanceBefore = await erc20Token.balanceOf(addr1.address);

    await erc20Token.connect(addr1).burn(addr1.address, burnAmount);
    const votesAfterBurn = await erc20Token.getVotes(addr1.address);

    expect(votesAfterBurn).to.equal(balanceBefore - burnAmount);
  });
});

describe("ERC721 Voting Tests", () => {
  it("Should correctly set name and symbol for ERC721 token", async () => {
    expect(await erc721Token.name()).to.equal(erc721Name);
    expect(await erc721Token.symbol()).to.equal(erc721Symbol);
  });

  it("Should delegate votes for ERC721 token", async () => {
    const votesBefore = 1n;
    await erc721Token.connect(owner).delegate(owner.address);
    const votes = await erc721Token.getVotes(owner.address);
    expect(votes).to.eq(votesBefore);
  });

  it("Should update votes after transferring NFT for ERC721 token", async () => {
    const votesBefore = await erc721Token.getVotes(owner.address);

    await erc721Token.connect(owner).transferFrom(owner.address, addr1.address, tokenId);
    const votesAfter = await erc721Token.getVotes(owner.address);

    expect(votesAfter).to.eq(votesBefore - 1n);
  });
});
